import { Router } from 'express';
import { body, param } from 'express-validator';
import { BinRegistration, Bill, State, Notification, User, Payment } from '../models';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { validate } from '../middleware/validator';
import { sendNewBillSMS } from '../services/sms';
import { generateBinId } from '../utils/binId';
import { generateBillForBin } from '../utils/billGenerator';
import mongoose from 'mongoose';

const router = Router();

// Get state billing information (public endpoint for users to see pricing)
router.get('/state-billing/:stateCode', async (req, res) => {
  try {
    const { stateCode } = req.params;

    const state = await State.findOne({ code: stateCode, isActive: true });

    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    res.json({
      stateCode: state.code,
      stateName: state.name,
      monthlyBillAmount: state.monthlyBillAmount || state.averageBill,
      billCycle: state.billCycle,
      authorityName: state.authorityName,
    });
  } catch (error) {
    console.error('Get state billing error:', error);
    res.status(500).json({ error: 'Failed to get state billing information' });
  }
});

// Register a bin
router.post(
  '/bins/register',
  authenticate,
  validate([
    body('stateCode').notEmpty().trim(),
    body('lgaName').notEmpty().trim(),
    body('address').notEmpty().trim(),
    body('customerRef').optional().trim(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { stateCode, lgaName, address, customerRef } = req.body;

      // Verify state and LGA exist
      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      const lga = state.lgas.find(l => l.name === lgaName);
      if (!lga) {
        return res.status(404).json({ error: 'LGA not found in this state' });
      }

      // Check if this address is already registered
      const existingAddress = await BinRegistration.findOne({ 
        stateCode: state.code,
        address: address.trim().toLowerCase()
      });

      if (existingAddress) {
        return res.status(400).json({ 
          error: 'This address is already registered',
          binId: existingAddress.binId
        });
      }

      // Auto-generate unique bin ID based on state code
      const binId = await generateBinId(state.code);

      const binRegistration = await BinRegistration.create({
        binId,
        userId: new mongoose.Types.ObjectId(req.user!.userId),
        stateCode: state.code,
        lgaName: lga.name,
        address: address.trim(),
        customerRef,
      });

      const populatedBin = await BinRegistration.findById(binRegistration._id).populate('userId');

      res.status(201).json({
        message: 'Bin registered successfully',
        binRegistration: populatedBin,
      });
    } catch (error) {
      console.error('Bin registration error:', error);
      res.status(500).json({ error: 'Failed to register bin' });
    }
  }
);

// Search for address to find bin ID
router.get(
  '/bins/search',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { address, stateCode, lgaName } = req.query;

      if (!address && !stateCode) {
        return res.status(400).json({ error: 'Please provide address or state to search' });
      }

      const query: any = { isActive: true };

      if (address) {
        query.address = { $regex: address, $options: 'i' }; // Case-insensitive search
      }
      if (stateCode) {
        query.stateCode = stateCode;
      }
      if (lgaName) {
        query.lgaName = lgaName;
      }

      const results = await BinRegistration.find(query)
        .select('binId address stateCode lgaName registeredAt')
        .limit(20)
        .sort({ registeredAt: -1 });

      res.json({ results });
    } catch (error) {
      console.error('Address search error:', error);
      res.status(500).json({ error: 'Failed to search addresses' });
    }
  }
);

// Link a bin to user's account
router.post(
  '/bins/link',
  authenticate,
  validate([body('binId').notEmpty().trim()]),
  async (req: AuthRequest, res) => {
    try {
      const { binId } = req.body;
      const userId = req.user!.userId;

      // Find the bin registration
      const binRegistration = await BinRegistration.findOne({ binId, isActive: true });

      if (!binRegistration) {
        return res.status(404).json({ error: 'Bin ID not found or inactive' });
      }

      // Check if already linked to a user
      if (binRegistration.userId) {
        if (binRegistration.userId.toString() === userId) {
          return res.status(400).json({ error: 'This bin is already linked to your account' });
        } else {
          return res.status(400).json({ error: 'This bin is already linked to another account' });
        }
      }

      // Link the bin to the user
      binRegistration.userId = new mongoose.Types.ObjectId(userId);
      await binRegistration.save();

      // Automatically generate the first bill for this bin
      try {
        await generateBillForBin(binRegistration._id);
      } catch (billError: any) {
        console.log('Note: Could not generate initial bill:', billError.message);
        // Don't fail the linking if bill generation fails
      }

      const updatedBin = await BinRegistration.findById(binRegistration._id).populate('userId');

      res.json({
        message: 'Bin linked to your account successfully',
        binRegistration: updatedBin,
      });
    } catch (error) {
      console.error('Bin linking error:', error);
      res.status(500).json({ error: 'Failed to link bin' });
    }
  }
);

// Unlink a bin from user's account
router.post(
  '/bins/unlink',
  authenticate,
  validate([body('binId').notEmpty().trim()]),
  async (req: AuthRequest, res) => {
    try {
      const { binId } = req.body;
      const userId = req.user!.userId;

      const binRegistration = await BinRegistration.findOne({ 
        binId, 
        userId: userId,
        isActive: true 
      });

      if (!binRegistration) {
        return res.status(404).json({ error: 'Bin not found in your account' });
      }

      // For unlinking, we could either:
      // 1. Delete the record (not recommended)
      // 2. Set isActive to false
      // 3. Keep the userId but mark as "unlinked" somewhere
      // Let's deactivate it
      binRegistration.isActive = false;
      await binRegistration.save();

      res.json({ message: 'Bin unlinked from your account' });
    } catch (error) {
      console.error('Bin unlinking error:', error);
      res.status(500).json({ error: 'Failed to unlink bin' });
    }
  }
);

// Get user's registered bins
router.get('/bins', authenticate, async (req: AuthRequest, res) => {
  try {
    const bins = await BinRegistration.find({ 
      userId: req.user!.userId, 
      isActive: true 
    })
      .populate('userId')
      .sort({ createdAt: -1 });

    res.json({ bins });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({ error: 'Failed to get bins' });
  }
});

// Lookup bill by bin ID
router.get(
  '/lookup/:binId',
  authenticate,
  validate([param('binId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { binId } = req.params;

      const binRegistration = await BinRegistration.findOne({ binId }).populate('userId');

      if (!binRegistration) {
        return res.status(404).json({ error: 'Bin ID not found' });
      }

      // Get current pending/overdue bill
      const currentBill = await Bill.findOne({
        binRegistrationId: binRegistration._id,
        status: { $in: ['PENDING', 'OVERDUE'] }
      })
        .sort({ dueDate: 1 })
        .limit(1);

      res.json({
        binRegistration,
        currentBill: currentBill || null,
      });
    } catch (error) {
      console.error('Bill lookup error:', error);
      res.status(500).json({ error: 'Failed to lookup bill' });
    }
  }
);

// Get all bills for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };
    if (status) {
      where.status = status;
    }

    const [bills, total] = await Promise.all([
      Bill.find(where)
        .populate('binRegistrationId')
        .populate('userId')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Bill.countDocuments(where),
    ]);

    res.json({
      bills,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to get bills' });
  }
});

// Get bills by bin ID (must come before /:billId to avoid conflict)
router.get(
  '/bin/:binId',
  authenticate,
  validate([param('binId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { binId } = req.params;

      // Find bin registration
      const binRegistration = await BinRegistration.findOne({
        binId,
        userId: req.user!.userId,
      });

      if (!binRegistration) {
        return res.status(404).json({ error: 'Bin not found or not authorized' });
      }

      // Get all bills for this bin
      const bills = await Bill.find({
        binRegistrationId: binRegistration._id,
      })
        .populate('binRegistrationId')
        .sort({ createdAt: -1 });

      res.json({ bills });
    } catch (error) {
      console.error('Get bills by bin error:', error);
      res.status(500).json({ error: 'Failed to get bills' });
    }
  }
);

// Get user notifications
router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: new mongoose.Types.ObjectId(userId) },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/notifications/mark-all-read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Download bill as PDF
router.get('/:billId/download', authenticate, async (req: AuthRequest, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findOne({
      _id: billId,
      userId: req.user!.userId,
    })
      .populate('binRegistrationId')
      .populate('userId');

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Generate simple HTML receipt
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bill - ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #22c55e; margin: 0; }
            .details { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; }
            .status.pending { background: #fef3c7; color: #92400e; }
            .status.paid { background: #d1fae5; color: #065f46; }
            .status.overdue { background: #fee2e2; color: #991b1b; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🗑️ Waste Bin Management System</h1>
            <p>Bill Receipt</p>
          </div>
          
          <div class="details">
            <div class="row">
              <strong>Bill Number:</strong>
              <span>${bill.billNumber}</span>
            </div>
            <div class="row">
              <strong>Amount:</strong>
              <span>₦${bill.amount.toLocaleString()}</span>
            </div>
            <div class="row">
              <strong>Status:</strong>
              <span class="status ${bill.status.toLowerCase()}">${bill.status}</span>
            </div>
            <div class="row">
              <strong>Issue Date:</strong>
              <span>${new Date(bill.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <strong>Due Date:</strong>
              <span>${new Date(bill.dueDate).toLocaleDateString()}</span>
            </div>
            ${bill.paidAt ? `
            <div class="row">
              <strong>Paid Date:</strong>
              <span>${new Date(bill.paidAt).toLocaleDateString()}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for using our service!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.billNumber}.html`);
    res.send(html);
  } catch (error) {
    console.error('Download bill error:', error);
    res.status(500).json({ error: 'Failed to download bill' });
  }
});

// Get specific bill
router.get(
  '/:billId',
  authenticate,
  validate([param('billId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { billId } = req.params;

      const bill = await Bill.findOne({
        _id: billId,
        userId: req.user!.userId,
      })
        .populate('binRegistrationId')
        .populate('userId');

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      res.json({ bill });
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({ error: 'Failed to get bill' });
    }
  }
);

// Create bill (STATE_ADMIN only)
router.post(
  '/',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  validate([
    body('binRegistrationId').notEmpty(),
    body('amount').isInt({ min: 100 }),
    body('dueDate').isISO8601(),
    body('billingPeriod').notEmpty(),
    body('zoneName').optional().isString(),
    body('description').optional().isString(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { binRegistrationId, amount, dueDate, billingPeriod, zoneName, description } = req.body;

      const binRegistration = await BinRegistration.findById(binRegistrationId);

      if (!binRegistration) {
        return res.status(404).json({ error: 'Bin registration not found' });
      }

      const state = await State.findOne({ code: binRegistration.stateCode });
      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      // Check if state admin has permission
      if (req.user!.role === 'STATE_ADMIN' && req.user!.stateCode !== state.code) {
        return res.status(403).json({ error: 'You can only create bills for your state' });
      }

      // Generate bill number
      const billNumber = `BILL-${state.code.toUpperCase()}-${Date.now()}`;

      const bill = await Bill.create({
        billNumber,
        binRegistrationId: binRegistration._id,
        userId: binRegistration.userId,
        stateCode: state.code,
        zoneName,
        amount,
        dueDate: new Date(dueDate),
        billingPeriod,
        description,
        status: 'PENDING',
      });

      const populatedBill = await Bill.findById(bill._id)
        .populate('binRegistrationId')
        .populate('userId');

      // Create notification for user
      await Notification.create({
        userId: binRegistration.userId,
        title: 'New Bill Generated',
        message: `A new waste bill of ₦${(amount / 100).toFixed(2)} for ${billingPeriod} is now due.`,
        type: 'bill_due',
        metadata: { billId: bill._id.toString() },
      });

      // Send SMS notification
      const user = await User.findById(binRegistration.userId);
      if (user && user.phone) {
        await sendNewBillSMS(
          user.phone,
          billNumber,
          amount / 100, // Convert from kobo to naira
          new Date(dueDate)
        );
      }

      res.status(201).json({ message: 'Bill created successfully', bill: populatedBill });
    } catch (error) {
      console.error('Create bill error:', error);
      res.status(500).json({ error: 'Failed to create bill' });
    }
  }
);

// Update bill (STATE_ADMIN only)
router.patch(
  '/:billId',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  validate([
    param('billId').notEmpty(),
    body('amount').optional().isInt({ min: 100 }),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { billId } = req.params;
      const updates = req.body;

      const bill = await Bill.findById(billId);

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      if (req.user!.role === 'STATE_ADMIN' && req.user!.stateCode !== bill.stateCode) {
        return res.status(403).json({ error: 'You can only update bills for your state' });
      }

      Object.assign(bill, updates);
      await bill.save();

      const updatedBill = await Bill.findById(billId)
        .populate('binRegistrationId')
        .populate('userId');

      res.json({ message: 'Bill updated successfully', bill: updatedBill });
    } catch (error) {
      console.error('Update bill error:', error);
      res.status(500).json({ error: 'Failed to update bill' });
    }
  }
);

// Get user dashboard statistics
router.get('/user/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get active bins count
    const activeBins = await BinRegistration.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    // Get all user's bins for bill queries
    const userBins = await BinRegistration.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).select('_id');

    const binIds = userBins.map(bin => bin._id);

    // Get bills due soon (pending bills with due date within next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const dueSoon = await Bill.countDocuments({
      binRegistrationId: { $in: binIds },
      status: 'PENDING',
      dueDate: { $gte: now, $lte: nextWeek }
    });

    // Get total paid amount (all completed payments)
    const totalPaidResult = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' }
        }
      }
    ]);

    const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].totalPaid : 0;

    // Get payments this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthCount = await Payment.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'COMPLETED',
      paidAt: { $gte: thisMonthStart, $lte: thisMonthEnd }
    });

    res.json({
      stats: {
        totalPaid,
        activeBins,
        dueSoon,
        thisMonth: thisMonthCount
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

export default router;
