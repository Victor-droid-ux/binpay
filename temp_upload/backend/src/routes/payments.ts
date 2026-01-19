import { Router } from 'express';
import { body, param } from 'express-validator';
import { Bill, Payment, BinRegistration, State, User, Notification } from '../models';
import { PaymentStatus } from '../models/Payment';
import { BillStatus } from '../models/Bill';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { paystackService } from '../services/paystack';
import { sendPaymentConfirmationSMS } from '../services/sms';
import mongoose from 'mongoose';

const router = Router();

// Get all payments (user's payment history)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(where)
        .populate('billId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(where),
    ]);

    res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// Initialize payment
router.post(
  '/initialize',
  authenticate,
  validate([
    body('billId').notEmpty(),
    body('method').isIn(['CARD', 'BANK_TRANSFER', 'USSD', 'MOBILE_MONEY']),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { billId, method } = req.body;

      // Get bill details
      const bill = await Bill.findOne({
        _id: billId,
        userId: req.user!.userId,
      }).populate('binRegistrationId').populate('userId');

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      if (bill.status === 'PAID') {
        return res.status(400).json({ error: 'Bill already paid' });
      }

      const user = await User.findById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate fees (Paystack charges 1.5% + ₦100)
      const fee = Math.round((bill.amount * 0.015) + 10000); // Fee in kobo
      const totalAmount = bill.amount + fee;

      // Generate transaction reference
      const transactionRef = `BP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      const payment = await Payment.create({
        transactionRef,
        billId: bill._id,
        userId: new mongoose.Types.ObjectId(req.user!.userId),
        stateCode: bill.stateCode,
        amount: bill.amount,
        fee,
        totalAmount,
        method,
        status: 'PENDING',
        customerEmail: user.email,
        customerPhone: user.phone,
        metadata: {
          billNumber: bill.billNumber,
          binId: (bill.binRegistrationId as any).binId,
          stateName: bill.stateCode,
        },
      });

      // Initialize Paystack payment
      const paystackResponse = await paystackService.initializePayment({
        email: user.email,
        amount: totalAmount,
        reference: transactionRef,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          paymentId: payment._id.toString(),
          billId: bill._id.toString(),
          billNumber: bill.billNumber,
          binId: (bill.binRegistrationId as any).binId,
          userId: req.user!.userId,
          custom_fields: [
            {
              display_name: 'Bill Number',
              variable_name: 'bill_number',
              value: bill.billNumber,
            },
            {
              display_name: 'Bin ID',
              variable_name: 'bin_id',
              value: (bill.binRegistrationId as any).binId,
            },
          ],
        },
        channels: method === 'CARD' ? ['card'] : ['bank', 'ussd', 'mobile_money'],
      });

      if (!paystackResponse.status) {
        // Delete payment record if initialization failed
        await Payment.findByIdAndDelete(payment._id);
        return res.status(500).json({ error: 'Payment initialization failed' });
      }

      // Update payment with Paystack reference
      payment.paystackRef = paystackResponse.data.reference;
      payment.status = PaymentStatus.PROCESSING;
      await payment.save();

      res.json({
        message: 'Payment initialized successfully',
        payment: {
          id: payment._id.toString(),
          transactionRef,
          amount: payment.amount,
          fee: payment.fee,
          totalAmount: payment.totalAmount,
        },
        paystack: {
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          reference: paystackResponse.data.reference,
        },
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ error: 'Failed to initialize payment' });
    }
  }
);

// Verify payment
router.get(
  '/verify/:reference',
  authenticate,
  validate([param('reference').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { reference } = req.params;

      // Find payment
      const payment = await Payment.findOne({ transactionRef: reference })
        .populate('billId')
        .populate('userId');

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.userId._id.toString() !== req.user!.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        return res.json({
          message: 'Payment already verified',
          payment: {
            status: payment.status,
            paidAt: payment.paidAt,
            amount: payment.amount,
          },
        });
      }

      // Verify with Paystack
      const paystackResponse = await paystackService.verifyPayment(payment.paystackRef!);

      if (!paystackResponse.status || paystackResponse.data.status !== 'success') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = paystackResponse.data.gateway_response || 'Payment verification failed';
        await payment.save();

        return res.status(400).json({
          error: 'Payment verification failed',
          reason: paystackResponse.data.gateway_response,
        });
      }

      // Update payment and bill using session for transaction
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        payment.status = PaymentStatus.COMPLETED;
        payment.paidAt = new Date();
        payment.webhookData = paystackResponse.data;
        await payment.save({ session });

        const bill = await Bill.findById(payment.billId);
        if (bill) {
          bill.status = BillStatus.PAID;
          bill.paidAt = new Date();
          bill.paidAmount = payment.amount;
          await bill.save({ session });
        }

        await Notification.create([{
          userId: payment.userId,
          title: 'Payment Successful',
          message: `Your payment of ₦${(payment.amount / 100).toFixed(2)} for bill ${(payment.billId as any).billNumber} was successful.`,
          type: 'payment_success',
          metadata: { paymentId: payment._id.toString(), billId: payment.billId.toString() },
        }], { session });
      });
      await session.endSession();

      // Send SMS confirmation
      const user = await User.findById(payment.userId);
      if (user && user.phone) {
        const bill = await Bill.findById(payment.billId);
        await sendPaymentConfirmationSMS(
          user.phone,
          payment.amount / 100, // Convert from kobo to naira
          bill?.billNumber || 'N/A',
          payment.transactionRef
        );
      }

      res.json({
        message: 'Payment verified successfully',
        payment: {
          id: payment._id.toString(),
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  }
);

// Paystack webhook
router.post('/webhook/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!paystackService.verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      const payment = await Payment.findOne({
        $or: [
          { transactionRef: reference },
          { paystackRef: reference },
        ],
      }).populate('billId');

      if (!payment) {
        console.error('Payment not found for webhook:', reference);
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.webhookReceived) {
        return res.json({ message: 'Webhook already processed' });
      }

      if (status === 'success') {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
          payment.status = PaymentStatus.COMPLETED;
          payment.paidAt = new Date();
          payment.webhookReceived = true;
          payment.webhookData = event.data;
          await payment.save({ session });

          const bill = await Bill.findById(payment.billId);
          if (bill) {
            bill.status = BillStatus.PAID;
            bill.paidAt = new Date();
            bill.paidAmount = payment.amount;
            await bill.save({ session });
          }

          await Notification.create([{
            userId: payment.userId,
            title: 'Payment Confirmed',
            message: `Your payment of ₦${(payment.amount / 100).toFixed(2)} has been confirmed.`,
            type: 'payment_success',
            metadata: { paymentId: payment._id.toString() },
          }], { session });
        });
        await session.endSession();
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.webhookReceived = true;
        payment.webhookData = event.data;
        payment.failureReason = event.data.gateway_response;
        await payment.save();
      }
    }

    res.json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(where)
        .populate('billId')
        .populate('binRegistrationId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(where),
    ]);

    res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Get specific payment
router.get(
  '/:paymentId',
  authenticate,
  validate([param('paymentId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findOne({
        _id: paymentId,
        userId: req.user!.userId,
      })
        .populate('billId')
        .populate('binRegistrationId');

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({ payment });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: 'Failed to get payment' });
    }
  }
);

export default router;
