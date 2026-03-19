import { Router, Response } from "express";
import { body, param } from "express-validator";
import {
  Bill,
  Payment,
  BinRegistration,
  State,
  Notification,
  User,
} from "../models";
import {
  authenticate,
  AuthRequest,
  authorize,
  authorizeStateAdmin,
} from "../middleware/auth";
import { validate } from "../middleware/validator";
import { generateBinId } from "../utils/binId";
import {
  generateBillForBin,
  generateMonthlyBillsForState,
} from "../utils/billGenerator";
import bcrypt from "bcryptjs";
import { sendEmail } from "../services/email";
import { sendSMS } from "../services/sms";
import { BinRegistrationStatus } from "../models/BinRegistration";

const router = Router();

// STATE ADMIN: Approve address registration
router.patch(
  "/addresses/:addressId/approve",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  validate([param("addressId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;
      const address = await BinRegistration.findById(addressId);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      if (address.status !== BinRegistrationStatus.PENDING) {
        return res
          .status(400)
          .json({ error: "Address is not pending approval" });
      }
      address.status = BinRegistrationStatus.APPROVED;
      address.isActive = true;
      // Generate bin ID if not already present
      if (!address.binId) {
        address.binId = await generateBinId(address.stateCode);
      }
      await address.save();

      // Notify the user of approval and their bin ID
      if (address.userId) {
        const user = await User.findById(address.userId);
        if (user) {
          await Notification.create({
            userId: user._id,
            title: "Address Approved ✅",
            message: `Your address (${address.address}, ${address.lgaName}, ${address.stateCode}) has been approved. Your Bin ID is: ${address.binId}`,
            type: "ADDRESS_APPROVED",
            isRead: false,
            metadata: {
              address: address.address,
              lgaName: address.lgaName,
              stateCode: address.stateCode,
              binId: address.binId,
              addressId: address._id.toString(),
            },
          });
        }
      }

      res.json({ message: "Address approved", address });
    } catch (error) {
      console.error("Approve address error:", error);
      res.status(500).json({ error: "Failed to approve address" });
    }
  },
);

// STATE ADMIN: Reject address registration
router.patch(
  "/addresses/:addressId/reject",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  validate([param("addressId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;
      const address = await BinRegistration.findById(addressId);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      if (address.status !== BinRegistrationStatus.PENDING) {
        return res
          .status(400)
          .json({ error: "Address is not pending approval" });
      }
      address.status = BinRegistrationStatus.REJECTED;
      address.isActive = false;
      await address.save();

      // Notify the user of rejection
      if (address.userId) {
        const user = await User.findById(address.userId);
        if (user) {
          await Notification.create({
            userId: user._id,
            title: "Address Registration Rejected ❌",
            message: `Your address registration (${address.address}, ${address.lgaName}, ${address.stateCode}) has been rejected. Please contact your state admin for more information.`,
            type: "ADDRESS_REJECTED",
            isRead: false,
            metadata: {
              address: address.address,
              lgaName: address.lgaName,
              stateCode: address.stateCode,
              addressId: address._id.toString(),
            },
          });
        }
      }

      res.json({ message: "Address rejected", address });
    } catch (error) {
      console.error("Reject address error:", error);
      res.status(500).json({ error: "Failed to reject address" });
    }
  },
);

// Send bulk overdue notifications to users in a state
router.post(
  "/notifications/overdue/:stateCode",
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { stateCode } = req.params;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }

      const overdueBills = await Bill.find({ stateCode, status: "OVERDUE" });
      if (!overdueBills.length) {
        return res.json({ message: "No overdue bills found", sent: 0 });
      }

      const userIds = [
        ...new Set(
          overdueBills.map((b) => b.userId?.toString()).filter(Boolean),
        ),
      ];

      if (!userIds.length) {
        return res.json({
          message: "No users with overdue bills found",
          sent: 0,
        });
      }

      const users = await User.find({ _id: { $in: userIds } });

      const overdueBillsPopulated = await Bill.find({
        stateCode,
        status: "OVERDUE",
      }).populate("binRegistrationId");

      await Promise.all(
        overdueBillsPopulated.map(async (bill) => {
          const user = users.find(
            (u) => u._id.toString() === bill.userId.toString(),
          );
          if (!user) return;
          const bin = bill.binRegistrationId;
          let addressInfo = "(address not found)";
          if (
            bin &&
            typeof bin === "object" &&
            "address" in bin &&
            "lgaName" in bin &&
            "stateCode" in bin
          ) {
            addressInfo = `${(bin as any).address}, ${(bin as any).lgaName}, ${(bin as any).stateCode}`;
          }
          const message = `Your bill (${bill.billNumber}) for address: ${addressInfo} is overdue. Please pay as soon as possible to avoid penalties.`;

          await Notification.create({
            userId: user._id,
            title: "Overdue Bill Alert",
            message,
            type: "OVERDUE_BILL",
            isRead: false,
            metadata: { stateCode, billId: bill._id, address: addressInfo },
          });

          if (user.email) {
            const subject = "Overdue Waste Bill Payment Reminder";
            const html = `<p>Dear ${user.firstName},</p>
              <p>This is a reminder that your waste bill <b>(${bill.billNumber})</b> for <b>${addressInfo}</b> is overdue. Please pay as soon as possible to avoid penalties or service disruption.</p>
              <p>If you have already paid, please ignore this message.</p>
              <p>Thank you,<br/>Bin-Pay Team</p>`;
            const text = `Dear ${user.firstName},\n\nThis is a reminder that your waste bill (${bill.billNumber}) for ${addressInfo} is overdue.\n\nThank you,\nBin-Pay Team`;
            await sendEmail({ to: user.email, subject, html, text });
          }
        }),
      );

      res.json({
        message: `Notifications and emails sent to ${users.length} users`,
        sent: users.length,
      });
    } catch (error) {
      console.error("Send bulk overdue notifications error:", error);
      res.status(500).json({ error: "Failed to send overdue notifications" });
    }
  },
);

// Get notifications for the logged-in STATE_ADMIN
// FIX: removed the role check that blocked SUPER_ADMIN; also fixed to only
// return notifications belonging to the requesting user (not all admins)
router.get(
  "/notifications",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Fetch admin notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
);

// Mark a single admin notification as read
router.put(
  "/notifications/:notificationId/read",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.userId;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({ notification });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// Notify state admin that user's bin is full
router.post(
  "/notify-bin-full",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findById(userId);
      if (!user || !user.stateCode) {
        return res.status(400).json({ error: "User or state not found" });
      }

      const binRegistration = await BinRegistration.findOne({
        userId: user._id,
        stateCode: user.stateCode,
        isActive: true,
      }).sort({ createdAt: -1 });

      if (!binRegistration) {
        return res
          .status(400)
          .json({ error: "Please link your bin before notifying your admin" });
      }
      const addressInfo = `${binRegistration.address}, ${binRegistration.lgaName}, ${binRegistration.stateCode}`;

      const stateAdmins = await User.find({
        role: "STATE_ADMIN",
        stateCode: user.stateCode,
        isActive: true,
      });

      if (!stateAdmins.length) {
        return res
          .status(404)
          .json({ error: "No state admin found for your state" });
      }

      const notificationMessage = `User ${user.firstName} ${user.lastName} (${user.email}) from address: ${addressInfo} reports their bin is full and requests waste pickup.`;

      await Promise.all(
        stateAdmins.map(async (admin) => {
          await Notification.create({
            userId: admin._id,
            title: "Bin Full Alert",
            message: notificationMessage,
            type: "BIN_FULL",
            isRead: false,
            metadata: {
              reportedBy: user._id,
              reportedByName: `${user.firstName} ${user.lastName}`,
              reportedByEmail: user.email,
              address: addressInfo,
            },
          });

          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: "Bin Full Alert - Waste Pickup Request",
              html: `<p>${notificationMessage}</p>`,
              text: notificationMessage,
            });
          }

          if (admin.phone) {
            await sendSMS({ to: admin.phone, message: notificationMessage });
          }
        }),
      );

      res.json({ message: "State admin has been notified." });
    } catch (error) {
      console.error("Notify bin full error:", error);
      res.status(500).json({ error: "Failed to notify state admin" });
    }
  },
);

// Get all states
router.get("/states", async (req, res: Response) => {
  try {
    const { isActive } = req.query;
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    const states = await State.find(where).sort({ name: 1 });
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
      }),
    );
    res.json({ states: statesWithCounts });
  } catch (error) {
    console.error("Get states error:", error);
    res.status(500).json({ error: "Failed to get states" });
  }
});

// Get state details with LGAs and zones
router.get("/states/:stateCode", async (req, res: Response) => {
  try {
    const { stateCode } = req.params;
    const state = await State.findOne({ code: stateCode });
    if (!state) {
      return res.status(404).json({ error: "State not found" });
    }
    const [billCount, paymentCount] = await Promise.all([
      Bill.countDocuments({ stateCode: state.code }),
      Payment.countDocuments({ stateCode: state.code }),
    ]);
    res.json({
      state: {
        ...state.toObject(),
        _count: { bills: billCount, payments: paymentCount },
      },
    });
  } catch (error) {
    console.error("Get state error:", error);
    res.status(500).json({ error: "Failed to get state" });
  }
});

// Get dashboard stats for state admin
router.get(
  "/stats/:stateCode",
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      const [
        totalBills,
        paidBills,
        pendingBills,
        overdueBills,
        totalUsers,
        activeUsers,
      ] = await Promise.all([
        Bill.countDocuments({ stateCode: state.code }),
        Bill.countDocuments({ stateCode: state.code, status: "PAID" }),
        Bill.countDocuments({ stateCode: state.code, status: "PENDING" }),
        Bill.countDocuments({ stateCode: state.code, status: "OVERDUE" }),
        BinRegistration.distinct("userId", { stateCode: state.code }).then(
          (ids) => ids.length,
        ),
        User.countDocuments({
          _id: {
            $in: await BinRegistration.distinct("userId", {
              stateCode: state.code,
            }),
          },
          lastLogin: { $gte: thirtyDaysAgo },
        }),
      ]);

      const completedPayments = await Payment.find({
        stateCode: state.code,
        status: "SUCCESS",
      });
      const totalRevenue = completedPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      const monthlyPayments = await Payment.find({
        stateCode: state.code,
        status: "SUCCESS",
        paidAt: { $gte: firstDayOfMonth },
      });
      const monthlyRevenue = monthlyPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      const collectionRate =
        totalBills > 0 ? ((paidBills / totalBills) * 100).toFixed(2) : "0";

      res.json({
        stats: {
          totalBills,
          paidBills,
          pendingBills,
          overdueBills,
          collectionRate: parseFloat(collectionRate),
          totalRevenue,
          monthlyRevenue,
          totalUsers,
          activeUsers,
        },
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to get statistics" });
    }
  },
);

// Update monthly bill amount for a state (STATE_ADMIN only)
router.put(
  "/billing/monthly-amount",
  authenticate,
  authorizeStateAdmin,
  validate([body("amount").isNumeric().isFloat({ min: 0 })]),
  async (req: AuthRequest, res) => {
    try {
      const stateCode = req.user!.stateCode;
      const { amount } = req.body;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }
      state.monthlyBillAmount = amount;
      await state.save();
      res.json({
        message: "Monthly bill amount updated successfully",
        state: {
          code: state.code,
          name: state.name,
          monthlyBillAmount: state.monthlyBillAmount,
        },
      });
    } catch (error) {
      console.error("Update bill amount error:", error);
      res.status(500).json({ error: "Failed to update bill amount" });
    }
  },
);

// Get all bills for state admin
router.get(
  "/bills/:stateCode",
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { status, page = "1", limit = "20", search } = req.query;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      const where: any = { stateCode: state.code };
      if (status) where.status = status;
      if (search) {
        where.$or = [{ billNumber: new RegExp(search as string, "i") }];
      }
      const [bills, total] = await Promise.all([
        Bill.find(where)
          .populate("binRegistrationId")
          .populate("userId", "firstName lastName email phone")
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
      console.error("Get bills error:", error);
      res.status(500).json({ error: "Failed to get bills" });
    }
  },
);

// Get all payments for state admin
router.get(
  "/payments/:stateCode",
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { status, page = "1", limit = "20" } = req.query;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      const where: any = { stateCode: state.code };
      if (status) where.status = status;
      const [payments, total] = await Promise.all([
        Payment.find(where)
          .populate({
            path: "billId",
            populate: { path: "binRegistrationId" },
          })
          .populate("userId", "firstName lastName email phone")
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
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Failed to get payments" });
    }
  },
);

// Get all users for state admin
router.get(
  "/users/:stateCode",
  authenticate,
  authorizeStateAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { stateCode } = req.params;
      const { page = "1", limit = "20", search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }
      const userIds = await BinRegistration.distinct("userId", {
        stateCode: state.code,
      });
      const where: any = { _id: { $in: userIds }, role: "USER" };
      if (search) {
        where.$or = [
          { email: new RegExp(search as string, "i") },
          { firstName: new RegExp(search as string, "i") },
          { lastName: new RegExp(search as string, "i") },
          { phone: new RegExp(search as string, "i") },
        ];
      }
      const [users, total] = await Promise.all([
        User.find(where)
          .select(
            "email phone firstName lastName isActive isVerified lastLogin createdAt",
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(where),
      ]);
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
        }),
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
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  },
);

// SUPER ADMIN ROUTES

router.get(
  "/super/state-admins",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const stateAdmins = await User.find({ role: "STATE_ADMIN" })
        .select(
          "email phone firstName lastName stateCode permissions isActive lastLogin createdAt",
        )
        .sort({ createdAt: -1 });
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
        }),
      );
      res.json({ stateAdmins: stateAdminsWithStates });
    } catch (error) {
      console.error("Get state admins error:", error);
      res.status(500).json({ error: "Failed to get state admins" });
    }
  },
);

router.post(
  "/super/state-admins",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate([
    body("email").isEmail().normalizeEmail(),
    body("phone").matches(/^\+?[1-9]\d{1,14}$/),
    body("password").isLength({ min: 8 }),
    body("firstName").notEmpty().trim(),
    body("lastName").notEmpty().trim(),
    body("stateCode").notEmpty(),
    body("permissions").optional().isArray(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const {
        email,
        phone,
        password,
        firstName,
        lastName,
        stateCode,
        permissions,
      } = req.body;
      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Email or phone already registered" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const stateAdmin = await User.create({
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: "STATE_ADMIN",
        stateCode,
        permissions: permissions || [],
        isActive: true,
        isVerified: true,
      });
      res.status(201).json({
        message: "State admin created successfully",
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
      console.error("Create state admin error:", error);
      res.status(500).json({ error: "Failed to create state admin" });
    }
  },
);

router.patch(
  "/super/state-admins/:adminId/toggle-status",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate([param("adminId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;
      const admin = await User.findOne({ _id: adminId, role: "STATE_ADMIN" });
      if (!admin) {
        return res.status(404).json({ error: "State admin not found" });
      }
      admin.isActive = !admin.isActive;
      await admin.save();
      res.json({
        message: `State admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
        stateAdmin: {
          id: admin._id.toString(),
          email: admin.email,
          isActive: admin.isActive,
        },
      });
    } catch (error) {
      console.error("Toggle admin status error:", error);
      res.status(500).json({ error: "Failed to toggle admin status" });
    }
  },
);

router.put(
  "/super/state-admins/:adminId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate([
    param("adminId").notEmpty(),
    body("email").optional().isEmail(),
    body("phone").optional().isMobilePhone("any"),
    body("firstName").optional().trim().notEmpty(),
    body("lastName").optional().trim().notEmpty(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;
      const { email, phone, firstName, lastName } = req.body;
      const admin = await User.findOne({ _id: adminId, role: "STATE_ADMIN" });
      if (!admin) {
        return res.status(404).json({ error: "State admin not found" });
      }
      if (email && email !== admin.email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: adminId },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }
      if (email) admin.email = email;
      if (phone) admin.phone = phone;
      if (firstName) admin.firstName = firstName;
      if (lastName) admin.lastName = lastName;
      await admin.save();
      res.json({
        message: "State admin updated successfully",
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
      console.error("Update admin error:", error);
      res.status(500).json({ error: "Failed to update state admin" });
    }
  },
);

router.delete(
  "/super/state-admins/:adminId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate([param("adminId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;
      const admin = await User.findOne({ _id: adminId, role: "STATE_ADMIN" });
      if (!admin) {
        return res.status(404).json({ error: "State admin not found" });
      }
      await User.deleteOne({ _id: adminId });
      res.json({ message: "State admin deleted successfully" });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({ error: "Failed to delete state admin" });
    }
  },
);

router.get(
  "/super/stats",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const lastDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      );

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
        User.countDocuments({ role: "USER" }),
        User.countDocuments({ role: "STATE_ADMIN" }),
        Bill.countDocuments(),
        Bill.countDocuments({ status: "PAID" }),
        Payment.countDocuments({ status: "SUCCESS" }),
      ]);

      const completedPayments = await Payment.find({ status: "SUCCESS" });
      const totalRevenue = completedPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      const monthlyPayments = await Payment.find({
        status: "SUCCESS",
        paidAt: { $gte: firstDayOfMonth },
      });
      const monthlyRevenue = monthlyPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      const lastMonthPayments = await Payment.find({
        status: "SUCCESS",
        paidAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
      });
      const lastMonthRevenue = lastMonthPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      const revenueGrowth =
        lastMonthRevenue > 0
          ? parseFloat(
              (
                ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) *
                100
              ).toFixed(1),
            )
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
      console.error("Get platform stats error:", error);
      res.status(500).json({ error: "Failed to get platform statistics" });
    }
  },
);

router.get(
  "/super/state-revenues",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const states = await State.find({ isActive: true });

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
            Bill.countDocuments({ stateCode: state.code, status: "PAID" }),
            Bill.countDocuments({ stateCode: state.code, status: "PENDING" }),
            Bill.countDocuments({ stateCode: state.code, status: "OVERDUE" }),
            BinRegistration.distinct("userId", { stateCode: state.code }).then(
              (ids) => ids.length,
            ),
            User.countDocuments({
              _id: {
                $in: await BinRegistration.distinct("userId", {
                  stateCode: state.code,
                }),
              },
              lastLogin: { $gte: thirtyDaysAgo },
            }),
          ]);

          const completedPayments = await Payment.find({
            stateCode: state.code,
            status: "SUCCESS",
          });
          const totalRevenue = completedPayments.reduce(
            (sum, p) => sum + p.amount,
            0,
          );

          const monthlyPayments = await Payment.find({
            stateCode: state.code,
            status: "SUCCESS",
            paidAt: { $gte: firstDayOfMonth },
          });
          const monthlyRevenue = monthlyPayments.reduce(
            (sum, p) => sum + p.amount,
            0,
          );
          const collectionRate =
            totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

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
        }),
      );

      res.json({ stateRevenues: stateRevenueData });
    } catch (error) {
      console.error("Get state revenues error:", error);
      res.status(500).json({ error: "Failed to get state revenue data" });
    }
  },
);

// Register a new address (USER or ADMIN)
router.post(
  "/addresses/register",
  authenticate,
  authorize("USER", "STATE_ADMIN", "SUPER_ADMIN"),
  validate([
    body("lgaName").notEmpty().trim(),
    body("address").notEmpty().trim(),
    body("customerRef").optional().trim(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { lgaName, address, customerRef } = req.body;
      const user = req.user!;
      let stateCode = "";
      let submitter: any;

      if (user.role === "USER") {
        const userDoc = await User.findById(user.userId);
        if (!userDoc || !userDoc.stateCode) {
          return res.status(400).json({
            error:
              "User must be assigned to a state. Please update your profile with your state.",
          });
        }
        stateCode = userDoc.stateCode;
        submitter = userDoc;
      } else {
        const adminUser = await User.findById(user.userId);
        if (!adminUser || !adminUser.stateCode) {
          return res
            .status(400)
            .json({ error: "State admin must be assigned to a state" });
        }
        stateCode = adminUser.stateCode;
        submitter = adminUser;
      }

      const state = await State.findOne({ code: stateCode });
      if (!state) {
        return res.status(404).json({ error: "State not found" });
      }

      const lga = state.lgas.find((l) => l.name === lgaName);
      if (!lga) {
        return res.status(404).json({ error: "LGA not found in this state" });
      }

      const normalizedAddress = address.trim().toLowerCase();

      const existingAddress = await BinRegistration.findOne({
        stateCode: state.code,
        address: normalizedAddress,
      });
      if (existingAddress) {
        return res.status(400).json({
          error: "This address is already registered",
          binId: existingAddress.binId,
        });
      }

      const binId = await generateBinId(state.code);

      const binRegistration = await BinRegistration.create({
        binId,
        stateCode: state.code,
        lgaName: lga.name,
        address: normalizedAddress,
        customerRef,
        isActive: false,
        status: BinRegistrationStatus.PENDING,
        userId: user.userId,
      });

      // Notify all state admins for approval
      const stateAdmins = await User.find({
        role: "STATE_ADMIN",
        stateCode: state.code,
        isActive: true,
      });

      const notificationMessage = `New address registration submitted by ${submitter.firstName} ${submitter.lastName} (${submitter.email}) for approval: ${normalizedAddress}, ${lga.name}, ${state.code}`;

      await Promise.all(
        stateAdmins.map(async (admin) => {
          await Notification.create({
            userId: admin._id,
            title: "New Address Registration Pending",
            message: notificationMessage,
            type: "ADDRESS_REGISTRATION",
            isRead: false,
            metadata: {
              submittedBy: user.userId,
              address: normalizedAddress,
              lgaName: lga.name,
              stateCode: state.code,
              binId: binRegistration.binId,
              // FIX: store the MongoDB _id so the notification-tab can pass it
              // to approveAddress/rejectAddress which expect the document _id
              addressId: binRegistration._id.toString(),
            },
          });

          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: "New Address Registration Pending Approval",
              html: `<p>Dear ${admin.firstName},</p>
                  <p>A new address registration has been submitted for approval:</p>
                  <ul>
                    <li><b>Address:</b> ${normalizedAddress}</li>
                    <li><b>LGA:</b> ${lga.name}</li>
                    <li><b>State:</b> ${state.name} (${state.code})</li>
                    <li><b>Submitted by:</b> ${submitter.firstName} ${submitter.lastName} (${submitter.email})</li>
                    <li><b>Bin ID:</b> ${binRegistration.binId}</li>
                  </ul>
                  <p>Please review and approve/reject this address in your admin dashboard.</p>
                  <p>Thank you,<br/>Bin-Pay Team</p>`,
              text: `New address registration from ${submitter.firstName} ${submitter.lastName}:\nAddress: ${normalizedAddress}\nLGA: ${lga.name}\nBin ID: ${binRegistration.binId}`,
            });
          }
        }),
      );

      res.status(201).json({
        message:
          "Address registration submitted for approval. You will be notified once reviewed.",
        binRegistration: {
          binId: binRegistration.binId,
          stateCode: binRegistration.stateCode,
          lgaName: binRegistration.lgaName,
          address: binRegistration.address,
          customerRef: binRegistration.customerRef,
          status: binRegistration.status,
          isActive: binRegistration.isActive,
          registeredAt: binRegistration.registeredAt,
        },
      });
    } catch (error) {
      console.error("Address registration error:", error);
      res.status(500).json({ error: "Failed to register address" });
    }
  },
);

// Look up a single address by its binId string — used as a fallback for old
// notifications that don't carry addressId in their metadata
router.get(
  "/addresses/by-bin/:binId",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const { binId } = req.params;
      const address = await BinRegistration.findOne({ binId }).populate(
        "userId",
        "firstName lastName email phone",
      );
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json({ address });
    } catch (error) {
      console.error("Get address by binId error:", error);
      res.status(500).json({ error: "Failed to get address" });
    }
  },
);

// STATE ADMIN: Get all registered addresses in their state
router.get(
  "/addresses",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const stateAdmin = req.user!;
      let stateCode: string | undefined;

      if (stateAdmin.role === "SUPER_ADMIN") {
        stateCode = req.query.stateCode as string | undefined;
      } else {
        const adminUser = await User.findById(stateAdmin.userId);
        if (!adminUser || !adminUser.stateCode) {
          return res
            .status(400)
            .json({ error: "State admin must be assigned to a state" });
        }
        stateCode = adminUser.stateCode;
      }

      const query: any = {};
      if (stateCode) query.stateCode = stateCode;

      const addresses = await BinRegistration.find(query)
        .populate("userId", "firstName lastName email phone")
        .sort({ createdAt: -1 });

      res.json({ addresses });
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to get addresses" });
    }
  },
);

// STATE ADMIN: Update address information
router.put(
  "/addresses/:addressId",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  validate([
    param("addressId").notEmpty(),
    body("address").optional().isString(),
    body("lgaName").optional().isString(),
    body("customerRef").optional().isString(),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;
      const { address, lgaName, customerRef } = req.body;

      const stateAdmin = req.user!;
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res
          .status(400)
          .json({ error: "State admin must be assigned to a state" });
      }

      const binRegistration = await BinRegistration.findById(addressId);
      if (!binRegistration) {
        return res.status(404).json({ error: "Address not found" });
      }

      if (binRegistration.stateCode !== adminUser.stateCode) {
        return res
          .status(403)
          .json({ error: "Cannot update address from another state" });
      }

      if (address !== undefined)
        binRegistration.address = address.trim().toLowerCase();
      if (lgaName !== undefined) binRegistration.lgaName = lgaName;
      if (customerRef !== undefined) binRegistration.customerRef = customerRef;

      await binRegistration.save();

      const updatedAddress = await BinRegistration.findById(addressId).populate(
        "userId",
        "firstName lastName email phone",
      );

      res.json({
        message: "Address updated successfully",
        address: updatedAddress,
      });
    } catch (error) {
      console.error("Update address error:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  },
);

// STATE ADMIN: Toggle address active status
router.patch(
  "/addresses/:addressId/toggle-status",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  validate([param("addressId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const { addressId } = req.params;
      const stateAdmin = req.user!;
      const adminUser = await User.findById(stateAdmin.userId);
      if (!adminUser || !adminUser.stateCode) {
        return res
          .status(400)
          .json({ error: "State admin must be assigned to a state" });
      }

      const binRegistration = await BinRegistration.findById(addressId);
      if (!binRegistration) {
        return res.status(404).json({ error: "Address not found" });
      }

      if (binRegistration.stateCode !== adminUser.stateCode) {
        return res
          .status(403)
          .json({ error: "Cannot modify address from another state" });
      }

      binRegistration.isActive = !binRegistration.isActive;
      await binRegistration.save();

      const updatedAddress = await BinRegistration.findById(addressId).populate(
        "userId",
        "firstName lastName email phone",
      );

      res.json({
        message: `Address ${binRegistration.isActive ? "activated" : "deactivated"} successfully`,
        address: updatedAddress,
      });
    } catch (error) {
      console.error("Toggle address status error:", error);
      res.status(500).json({ error: "Failed to toggle address status" });
    }
  },
);

// STATE ADMIN: Generate monthly bills
router.post(
  "/bills/generate",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const adminUser = await User.findById(req.user!.userId);
      if (!adminUser?.stateCode)
        return res
          .status(400)
          .json({ error: "State admin must be assigned to a state" });
      const result = await generateMonthlyBillsForState(adminUser.stateCode);
      res.json({
        message: "Bills generated",
        stateCode: adminUser.stateCode,
        ...result,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Failed to generate bills" });
    }
  },
);

router.post(
  "/bills/generate/:binId",
  authenticate,
  authorize("STATE_ADMIN", "SUPER_ADMIN"),
  validate([param("binId").notEmpty()]),
  async (req: AuthRequest, res) => {
    try {
      const binReg = await BinRegistration.findOne({ binId: req.params.binId });
      if (!binReg) return res.status(404).json({ error: "Bin not found" });
      const bill = await generateBillForBin(binReg._id);
      res.json({ message: "Bill generated", bill });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Failed to generate bill" });
    }
  },
);

export default router;
