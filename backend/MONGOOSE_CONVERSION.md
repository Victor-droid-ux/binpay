# Prisma to Mongoose Conversion Guide

## Common Patterns

### Find Operations
```typescript
// Prisma
const user = await prisma.user.findFirst({ where: { email } });
const user = await prisma.user.findUnique({ where: { id } });
const users = await prisma.user.findMany({ where: { role: 'USER' } });

// Mongoose
const user = await User.findOne({ email });
const user = await User.findById(id);
const users = await User.find({ role: 'USER' });
```

### Create Operations
```typescript
// Prisma
const user = await prisma.user.create({ data: { email, password } });

// Mongoose
const user = await User.create({ email, password });
```

### Update Operations
```typescript
// Prisma
const user = await prisma.user.update({ 
  where: { id }, 
  data: { isActive: true } 
});

// Mongoose
const user = await User.findByIdAndUpdate(
  id, 
  { isActive: true },
  { new: true } // return updated document
);
// OR
const user = await User.findById(id);
user.isActive = true;
await user.save();
```

### Delete Operations
```typescript
// Prisma
await prisma.user.delete({ where: { id } });

// Mongoose
await User.findByIdAndDelete(id);
```

### Count Operations
```typescript
// Prisma
const count = await prisma.user.count({ where: { role: 'USER' } });

// Mongoose
const count = await User.countDocuments({ role: 'USER' });
```

### Aggregations
```typescript
// Prisma
const result = await prisma.payment.aggregate({
  where: { stateId },
  _sum: { amount: true },
});

// Mongoose
const result = await Payment.aggregate([
  { $match: { stateId } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
// OR simpler for sums
const payments = await Payment.find({ stateId });
const total = payments.reduce((sum, p) => sum + p.amount, 0);
```

### Includes/Populate
```typescript
// Prisma
const bill = await prisma.bill.findFirst({
  where: { id },
  include: { binRegistration: { include: { state: true } } }
});

// Mongoose
const bill = await Bill.findById(id)
  .populate({
    path: 'binRegistrationId',
    populate: { path: 'stateCode' }
  });
```

### Transactions
```typescript
// Prisma
await prisma.$transaction([
  prisma.payment.update({ where: { id }, data: { status: 'SUCCESS' } }),
  prisma.bill.update({ where: { id: billId }, data: { status: 'PAID' } })
]);

// Mongoose
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Payment.findByIdAndUpdate(id, { status: 'SUCCESS' }, { session });
  await Bill.findByIdAndUpdate(billId, { status: 'PAID' }, { session });
});
```

### Pagination
```typescript
// Prisma
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// Mongoose
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });
```

## ID Fields
- Prisma uses `id` (UUID string)
- Mongoose uses `_id` (ObjectId)
- Convert with `user._id.toString()` when needed for JWT tokens
- When querying: `User.findById(id)` handles both string and ObjectId

## Status Enums
Already defined in models:
- `BillStatus`: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
- `PaymentStatus`: 'PENDING' | 'SUCCESS' | 'FAILED'
- `PaymentMethod`: 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'MOBILE_MONEY'
- `UserRole`: 'USER' | 'STATE_ADMIN' | 'SUPER_ADMIN'
