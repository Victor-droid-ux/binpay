# Bin-Pay Backend API

Complete backend API for the Bin-Pay waste bill payment system across Nigeria.

## Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - User, State Admin, Super Admin roles
- ✅ **MongoDB Database** - With Mongoose ODM
- ✅ **Payment Gateway** - Paystack integration for payments
- ✅ **Bill Management** - Create, read, update bills
- ✅ **Multi-State Support** - All 36 Nigerian states + FCT
- ✅ **Webhook Handling** - Paystack payment webhooks
- ✅ **RESTful API** - Clean and well-documented endpoints

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Paystack
- **Validation**: express-validator
- **Security**: Helmet, bcryptjs

## Prerequisites

- Node.js (v18+)
- MongoDB (v6+)
- Paystack account (for payment processing)

## Setup Instructions

### 1. Install MongoDB

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Install MongoDB Community Server
- MongoDB will run as a Windows service automatically

Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Configuration

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Update the following in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/binpay
JWT_SECRET=your-super-secret-jwt-key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

### 4. Seed the Database

```bash
npm run seed
```

This will create:
- Super admin account
- 3 initial states (Lagos, FCT, Enugu)
- State admins for each state
- LGAs and zones

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

### 6. Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/me` | Get current user | Yes |
| POST | `/change-password` | Change password | Yes |

### Bills (`/api/bills`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bins/register` | Register a bin | Yes (User) |
| GET | `/bins` | Get user's bins | Yes (User) |
| GET | `/lookup/:binId` | Lookup bill by bin ID | Yes (User) |
| GET | `/bills` | Get all user bills | Yes (User) |
| GET | `/bills/:billId` | Get specific bill | Yes (User) |
| POST | `/bills` | Create bill | Yes (State Admin) |
| PATCH | `/bills/:billId` | Update bill | Yes (State Admin) |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/initialize` | Initialize payment | Yes (User) |
| GET | `/verify/:reference` | Verify payment | Yes (User) |
| POST | `/webhook/paystack` | Paystack webhook | No (Signature verified) |
| GET | `/history` | Get payment history | Yes (User) |
| GET | `/:paymentId` | Get specific payment | Yes (User) |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/states` | Get all states | No |
| GET | `/states/:stateCode` | Get state details | No |
| GET | `/stats/:stateCode` | Get state statistics | Yes (State Admin) |
| GET | `/bills/:stateCode` | Get state bills | Yes (State Admin) |
| GET | `/payments/:stateCode` | Get state payments | Yes (State Admin) |
| GET | `/users/:stateCode` | Get state users | Yes (State Admin) |
| GET | `/super/state-admins` | Get all state admins | Yes (Super Admin) |
| POST | `/super/state-admins` | Create state admin | Yes (Super Admin) |
| PATCH | `/super/state-admins/:id/toggle-status` | Toggle admin status | Yes (Super Admin) |
| GET | `/super/stats` | Platform statistics | Yes (Super Admin) |

## Default Credentials

After seeding, use these credentials:

**Super Admin:**
- Email: `admin@binpay.ng`
- Password: `Admin123!`

**State Admins:**
- Lagos: `admin@lagos.binpay.ng` / `Admin123!`
- FCT: `admin@fct.binpay.ng` / `Admin123!`
- Enugu: `admin@enugu.binpay.ng` / `Admin123!`

## Database Schema

Key models:
- **User** - System users (USER, STATE_ADMIN, SUPER_ADMIN)
- **State** - Nigerian states with waste authority info
- **LGA** - Local Government Areas
- **Zone** - Waste management zones
- **BinRegistration** - Registered waste bins
- **Bill** - Waste bills
- **Payment** - Payment transactions
- **Notification** - User notifications

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Helmet.js security headers
- CORS configuration
- Input validation
- Role-based authorization
- Webhook signature verification

## Payment Flow

1. User initiates payment via `/api/payments/initialize`
2. Backend creates payment record and calls Paystack
3. User completes payment on Paystack
4. Paystack sends webhook to `/api/payments/webhook/paystack`
5. Backend verifies and updates payment status
6. User can verify payment via `/api/payments/verify/:reference`

## Development

View database:
```bash
npm run prisma:studio
```

Reset database:
```bash
npx prisma migrate reset
```

## Deployment

1. Set production environment variables
2. Build the project: `npm run build`
3. Run migrations: `npm run prisma:migrate`
4. Seed database: `npm run prisma:seed`
5. Start server: `npm start`

## Support

For issues or questions, contact the Bin-Pay team.
