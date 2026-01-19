import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { User, State, Bill, Payment, BinRegistration } from '../models';
import { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest, authorize, authorizeStateAdmin } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { generateBinId } from '../utils/binId';
import { 
  generateMonthlyBillsForState, 
  generateBillForBin,
  updateOverdueBills 
} from '../utils/billGenerator';

const router = Router();

// Get all states
router.get('/states', async (req, res) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const states = await State.find(where).sort({ name: 1 });

    // Get counts for each state
    const statesWithCounts = await Promise.all(
      states.map(async (state) => {
        const [billCount, paymentCount] = await Promise.all([
          Bill.countDocuments({ stateCode: state.code }),
          Payment.countDocuments({ stateCode: state.code }),
        ]);

        return {
          ...state.toObject(),
          _count: {
            bills: billCount,
            payments: paymentCount,
            lgas: state.lgas.length,
            zones: state.zones.length,
          },
        };
      })
    );

    res.json({ states: statesWithCounts });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Failed to get states' });
  }
});

// Get state details with LGAs and zones
router.get('/states/:stateCode', async (req, res) => {
  try {
    const { stateCode } = req.params;

    const state = await State.findOne({ code: stateCode });

    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    const [billCount, paymentCount] = await Promise.all([
      Bill.countDocuments({ stateCode: state.code }),
      Payment.countDocuments({ stateCode: state.code }),
    ]);

    res.json({
      state: {
        ...state.toObject(),
        _count: {
          bills: billCount,
          payments: paymentCount,
        },
      },
    });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

// Get dashboard stats for state admin
router.get(
  '/stats/:stateCode',
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;

      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [
        totalBills,
        paidBills,
        pendingBills,
        overdueBills,
        totalUsers,
        activeUsers,
      ] = await Promise.all([
        Bill.countDocuments({ stateCode: state.code }),
        Bill.countDocuments({ stateCode: state.code, status: 'PAID' }),
        Bill.countDocuments({ stateCode: state.code, status: 'PENDING' }),
        Bill.countDocuments({ stateCode: state.code, status: 'OVERDUE' }),
        BinRegistration.distinct('userId', { stateCode: state.code }).then(ids => ids.length),
        User.countDocuments({
          _id: { $in: await BinRegistration.distinct('userId', { stateCode: state.code }) },
          lastLogin: { $gte: thirtyDaysAgo },
        }),
      ]);

      // Get revenue totals
      const completedPayments = await Payment.find({ 
        stateCode: state.code, 
        status: 'SUCCESS' 
      });
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      const monthlyPayments = await Payment.find({
        stateCode: state.code,
        status: 'SUCCESS',
        paidAt: { $gte: firstDayOfMonth },
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      const collectionRate = totalBills > 0 ? ((paidBills / totalBills) * 100).toFixed(2) : 0;

      res.json({
        stats: {
          totalBills,
          paidBills,
          pendingBills,
          overdueBills,
          collectionRate: parseFloat(collectionRate as string),
          totalRevenue,
          monthlyRevenue,
          totalUsers,
          activeUsers,
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
);

// Update monthly bill amount for a state (STATE_ADMIN only)
router.put(
  '/billing/monthly-amount',
  authenticate,
  authorizeStateAdmin,
  validate([
    body('amount').isNumeric().isFloat({ min: 0 }),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const stateCode = req.user!.stateCode;
      const { amount } = req.body;

      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      // Update the monthly bill amount
      state.monthlyBillAmount = amount;
      await state.save();

      res.json({
        message: 'Monthly bill amount updated successfully',
        state: {
          code: state.code,
          name: state.name,
          monthlyBillAmount: state.monthlyBillAmount,
        },
      });
    } catch (error) {
      console.error('Update bill amount error:', error);
      res.status(500).json({ error: 'Failed to update bill amount' });
    }
  }
);

// Get all bills for state admin
router.get(
  '/bills/:stateCode',
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { status, page = '1', limit = '20', search } = req.query;

      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { stateCode: state.code };
      if (status) {
        where.status = status;
      }
      if (search) {
        where.$or = [
          { billNumber: new RegExp(search as string, 'i') },
        ];
      }

      const [bills, total] = await Promise.all([
        Bill.find(where)
          .populate('binRegistrationId')
          .populate('userId', 'firstName lastName email phone')
          .sort({ createdAt: -1 })
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
  }
);

// Get all payments for state admin
router.get(
  '/payments/:stateCode',
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { status, page = '1', limit = '20' } = req.query;

      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { stateCode: state.code };
      if (status) {
        where.status = status;
      }

      const [payments, total] = await Promise.all([
        Payment.find(where)
          .populate({
            path: 'billId',
            populate: { path: 'binRegistrationId' },
          })
          .populate('userId', 'firstName lastName email phone')
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
  }
);

// Get all users for state admin
router.get(
  '/users/:stateCode',
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { page = '1', limit = '20', search } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      // Get user IDs who have bins in this state
      const userIds = await BinRegistration.distinct('userId', { stateCode: state.code });

      const where: any = { _id: { $in: userIds }, role: 'USER' };

      if (search) {
        where.$or = [
          { email: new RegExp(search as string, 'i') },
          { firstName: new RegExp(search as string, 'i') },
          { lastName: new RegExp(search as string, 'i') },
          { phone: new RegExp(search as string, 'i') },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(where)
          .select('email phone firstName lastName isActive isVerified lastLogin createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(where),
      ]);

      // Get counts for each user
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const [billCount, paymentCount, binCount] = await Promise.all([
            Bill.countDocuments({ userId: user._id }),
            Payment.countDocuments({ userId: user._id }),
            BinRegistration.countDocuments({ userId: user._id }),
          ]);

          return {
            ...user.toObject(),
            _count: {
              bills: billCount,
              payments: paymentCount,
              binRegistrations: binCount,
            },
          };
        })
      );

      res.json({
        users: usersWithCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
);

// SUPER ADMIN ROUTES

// Get all state admins (SUPER_ADMIN only)
router.get(
  '/super/state-admins',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const stateAdmins = await User.find({ role: 'STATE_ADMIN' })
        .select('email phone firstName lastName stateCode permissions isActive lastLogin createdAt')
        .sort({ createdAt: -1 });

      // Populate state information
      const stateAdminsWithStates = await Promise.all(
        stateAdmins.map(async (admin) => {
          const state = await State.findOne({ code: admin.stateCode });
          return {
            ...admin.toObject(),
            managedState: state
              ? {
                  name: state.name,
                  code: state.code,
                  authorityName: state.authorityName,
                }
              : null,
          };
        })
      );

      res.json({ stateAdmins: stateAdminsWithStates });
    } catch (error) {
      console.error('Get state admins error:', error);
      res.status(500).json({ error: 'Failed to get state admins' });
    }
  }
);

// Create state admin (SUPER_ADMIN only)
router.post(
  '/super/state-admins',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate([
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('stateCode').notEmpty(),
    body('permissions').optional().isArray(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { email, phone, password, firstName, lastName, stateCode, permissions } = req.body;

      // Check if state exists
      const state = await State.findOne({ code: stateCode });

      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or phone already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const stateAdmin = await User.create({
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'STATE_ADMIN',
        stateCode,
        permissions: permissions || [],
        isActive: true,
        isVerified: true,
      });

      res.status(201).json({
        message: 'State admin created successfully',
        stateAdmin: {
          id: stateAdmin._id.toString(),
          email: stateAdmin.email,
          phone: stateAdmin.phone,
          firstName: stateAdmin.firstName,
          lastName: stateAdmin.lastName,
          role: stateAdmin.role,
          stateCode: stateAdmin.stateCode,
          permissions: stateAdmin.permissions,
          createdAt: stateAdmin.createdAt,
        },
      });
    } catch (error) {
      console.error('Create state admin error:', error);
      res.status(500).json({ error: 'Failed to create state admin' });
    }
  }
);

// Toggle state admin status (SUPER_ADMIN only)
router.patch(
  '/super/state-admins/:adminId/toggle-status',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate([param('adminId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;

      const admin = await User.findOne({
        _id: adminId,
        role: 'STATE_ADMIN',
      });

      if (!admin) {
        return res.status(404).json({ error: 'State admin not found' });
      }

      admin.isActive = !admin.isActive;
      await admin.save();

      res.json({
        message: `State admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
        stateAdmin: {
          id: admin._id.toString(),
          email: admin.email,
          isActive: admin.isActive,
        },
      });
    } catch (error) {
      console.error('Toggle admin status error:', error);
      res.status(500).json({ error: 'Failed to toggle admin status' });
    }
  }
);

// Update state admin details (SUPER_ADMIN only)
router.put(
  '/super/state-admins/:adminId',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate([
    param('adminId').notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;
      const { email, phone, firstName, lastName } = req.body;

      const admin = await User.findOne({
        _id: adminId,
        role: 'STATE_ADMIN',
      });

      if (!admin) {
        return res.status(404).json({ error: 'State admin not found' });
      }

      // Check if email already exists for another user
      if (email && email !== admin.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: adminId } });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      // Update fields if provided
      if (email) admin.email = email;
      if (phone) admin.phone = phone;
      if (firstName) admin.firstName = firstName;
      if (lastName) admin.lastName = lastName;

      await admin.save();

      res.json({
        message: 'State admin updated successfully',
        stateAdmin: {
          id: admin._id.toString(),
          email: admin.email,
          phone: admin.phone,
          firstName: admin.firstName,
          lastName: admin.lastName,
          stateCode: admin.stateCode,
          isActive: admin.isActive,
        },
      });
    } catch (error) {
      console.error('Update admin error:', error);
      res.status(500).json({ error: 'Failed to update state admin' });
    }
  }
);

// Delete state admin (SUPER_ADMIN only)
router.delete(
  '/super/state-admins/:adminId',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate([param('adminId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;

      const admin = await User.findOne({
        _id: adminId,
        role: 'STATE_ADMIN',
      });

      if (!admin) {
        return res.status(404).json({ error: 'State admin not found' });
      }

      // Instead of hard delete, we can soft delete by deactivating
      // Or you can actually delete the user
      await User.deleteOne({ _id: adminId });

      res.json({
        message: 'State admin deleted successfully',
      });
    } catch (error) {
      console.error('Delete admin error:', error);
      res.status(500).json({ error: 'Failed to delete state admin' });
    }
  }
);

// Get platform-wide statistics (SUPER_ADMIN only)
router.get(
  '/super/stats',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [
        totalStates,
        activeStates,
        totalUsers,
        totalStateAdmins,
        totalBills,
        paidBills,
        totalPayments,
      ] = await Promise.all([
        State.countDocuments(),
        State.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'USER' }),
        User.countDocuments({ role: 'STATE_ADMIN' }),
        Bill.countDocuments(),
        Bill.countDocuments({ status: 'PAID' }),
        Payment.countDocuments({ status: 'SUCCESS' }),
      ]);

      // Get revenue totals
      const completedPayments = await Payment.find({ status: 'SUCCESS' });
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      // This month's revenue
      const monthlyPayments = await Payment.find({
        status: 'SUCCESS',
        paidAt: { $gte: firstDayOfMonth },
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      // Last month's revenue
      const lastMonthPayments = await Payment.find({
        status: 'SUCCESS',
        paidAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
      });
      const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate month-over-month growth percentage
      const revenueGrowth = lastMonthRevenue > 0 
        ? parseFloat((((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1))
        : 0;

      res.json({
        stats: {
          totalStates,
          activeStates,
          totalUsers,
          totalStateAdmins,
          totalBills,
          paidBills,
          pendingBills: totalBills - paidBills,
          totalRevenue,
          monthlyRevenue,
          lastMonthRevenue,
          revenueGrowth,
          totalPayments,
        },
      });
    } catch (error) {
      console.error('Get platform stats error:', error);
      res.status(500).json({ error: 'Failed to get platform statistics' });
    }
  }
);

// Get revenue data for all states (SUPER_ADMIN only)
router.get(
  '/super/state-revenues',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get all active states
      const states = await State.find({ isActive: true });

      // Get stats for each state
      const stateRevenueData = await Promise.all(
        states.map(async (state) => {
          const [
            totalBills,
            paidBills,
            pendingBills,
            overdueBills,
            totalUsers,
            activeUsers,
          ] = await Promise.all([
            Bill.countDocuments({ stateCode: state.code }),
            Bill.countDocuments({ stateCode: state.code, status: 'PAID' }),
            Bill.countDocuments({ stateCode: state.code, status: 'PENDING' }),
            Bill.countDocuments({ stateCode: state.code, status: 'OVERDUE' }),
            BinRegistration.distinct('userId', { stateCode: state.code }).then(ids => ids.length),
            User.countDocuments({
              _id: { $in: await BinRegistration.distinct('userId', { stateCode: state.code }) },
              lastLogin: { $gte: thirtyDaysAgo },
            }),
          ]);

          // Get revenue totals
          const completedPayments = await Payment.find({ 
            stateCode: state.code, 
            status: 'SUCCESS' 
          });
          const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

          const monthlyPayments = await Payment.find({
            stateCode: state.code,
            status: 'SUCCESS',
            paidAt: { $gte: firstDayOfMonth },
          });
          const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

          const collectionRate = totalBills > 0 ? ((paidBills / totalBills) * 100) : 0;

          return {
            stateCode: state.code,
            stateName: state.name,
            monthlyRevenue,
            totalRevenue,
            totalBills,
            paidBills,
            pendingBills,
            overdueBills,
            collectionRate: parseFloat(collectionRate.toFixed(2)),
            totalUsers,
            activeUsers,
            lastUpdated: new Date().toISOString(),
          };
        })
      );

      res.json({ stateRevenues: stateRevenueData });
    } catch (error) {
      console.error('Get state revenues error:', error);
      res.status(500).json({ error: 'Failed to get state revenue data' });
    }
  }
);

// STATE ADMIN: Register a new address and generate bin ID
router.post(
  '/addresses/register',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  validate([
    body('lgaName').notEmpty().trim(),
    body('address').notEmpty().trim(),
    body('customerRef').optional().trim(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { lgaName, address, customerRef } = req.body;
      const stateAdmin = req.user!;

      // Get the state admin's state
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res.status(400).json({ error: 'State admin must be assigned to a state' });
      }

      const state = await State.findOne({ code: adminUser.stateCode });
      if (!state) {
        return res.status(404).json({ error: 'State not found' });
      }

      // Verify LGA exists in the state
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

      // Create bin registration (without userId - will be set when user links it)
      const binRegistration = await BinRegistration.create({
        binId,
        stateCode: state.code,
        lgaName: lga.name,
        address: address.trim(),
        customerRef,
        isActive: true,
      });

      res.status(201).json({
        message: 'Address registered successfully with auto-generated bin ID',
        binRegistration: {
          binId: binRegistration.binId,
          stateCode: binRegistration.stateCode,
          lgaName: binRegistration.lgaName,
          address: binRegistration.address,
          customerRef: binRegistration.customerRef,
          isActive: binRegistration.isActive,
          registeredAt: binRegistration.registeredAt,
        },
      });
    } catch (error) {
      console.error('Address registration error:', error);
      res.status(500).json({ error: 'Failed to register address' });
    }
  }
);

// STATE ADMIN: Get all registered addresses in their state
router.get(
  '/addresses',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const stateAdmin = req.user!;

      // Get the state admin's state
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res.status(400).json({ error: 'State admin must be assigned to a state' });
      }

      const addresses = await BinRegistration.find({ 
        stateCode: adminUser.stateCode 
      })
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 });

      res.json({ addresses });
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ error: 'Failed to get addresses' });
    }
  }
);

// STATE ADMIN: Update address information
router.put(
  '/addresses/:addressId',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  validate([
    param('addressId').notEmpty(),
    body('address').optional().isString(),
    body('lgaName').optional().isString(),
    body('customerRef').optional().isString()
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;
      const { address, lgaName, customerRef } = req.body;

      const stateAdmin = req.user!;
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res.status(400).json({ error: 'State admin must be assigned to a state' });
      }

      // Find the address and verify it belongs to the admin's state
      const binRegistration = await BinRegistration.findById(addressId);
      if (!binRegistration) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (binRegistration.stateCode !== adminUser.stateCode) {
        return res.status(403).json({ error: 'Cannot update address from another state' });
      }

      // Update the address
      if (address !== undefined) binRegistration.address = address;
      if (lgaName !== undefined) binRegistration.lgaName = lgaName;
      if (customerRef !== undefined) binRegistration.customerRef = customerRef;

      await binRegistration.save();

      const updatedAddress = await BinRegistration.findById(addressId)
        .populate('userId', 'firstName lastName email phone');

      res.json({ 
        message: 'Address updated successfully',
        address: updatedAddress 
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  }
);

// STATE ADMIN: Toggle address active status
router.patch(
  '/addresses/:addressId/toggle-status',
  authenticate,
  authorize('STATE_ADMIN', 'SUPER_ADMIN'),
  validate([param('addressId').notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;

      const stateAdmin = req.user!;
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res.status(400).json({ error: 'State admin must be assigned to a state' });
      }

      // Find the address and verify it belongs to the admin's state
      const binRegistration = await BinRegistration.findById(addressId);
      if (!binRegistration) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (binRegistration.stateCode !== adminUser.stateCode) {
        return res.status(403).json({ error: 'Cannot modify address from another state' });
      }

      // Toggle the active status
      binRegistration.isActive = !binRegistration.isActive;
      await binRegistration.save();

      const updatedAddress = await BinRegistration.findById(addressId)
        .populate('userId', 'firstName lastName email phone');

      res.json({ 
        message: `Address ${binRegistration.isActive ? 'activated' : 'deactivated'} successfully`,
        address: updatedAddress 
      });
    } catch (error) {
      console.error('Toggle address status error:', error);
      res.status(500).json({ error: 'Failed to toggle address status' });
    }
  }
);

// STATE ADMIN: Generate monthly bills
router.post('/bills/generate', authenticate, authorize('STATE_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
  try {
    const adminUser = await User.findById(req.user!.userId);
    if (!adminUser?.stateCode) return res.status(400).json({ error: 'State admin must be assigned to a state' });
    const result = await generateMonthlyBillsForState(adminUser.stateCode);
    res.json({ message: 'Bills generated', stateCode: adminUser.stateCode, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate bills' });
  }
});

router.post('/bills/generate/:binId', authenticate, authorize('STATE_ADMIN', 'SUPER_ADMIN'), validate([param('binId').notEmpty()]), async (req: AuthRequest, res) => {
  try {
    const binReg = await BinRegistration.findOne({ binId: req.params.binId });
    if (!binReg) return res.status(404).json({ error: 'Bin not found' });
    const bill = await generateBillForBin(binReg._id);
    res.json({ message: 'Bill generated', bill });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate bill' });
  }
});

export default router;

