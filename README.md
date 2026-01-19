# Bin-Pay - Waste Bill Payment System for Nigeria 🇳🇬

A comprehensive full-stack platform for managing and paying waste bin bills across all 36 Nigerian states and FCT.

## 📋 Overview

Bin-Pay streamlines waste management billing and payments by connecting users, state waste management authorities, and administrators in a unified platform.

### Key Features

- ✅ **Multi-State Coverage** - All 36 states + FCT supported
- ✅ **Role-Based Access** - User, State Admin, Super Admin portals
- ✅ **Secure Payments** - Paystack integration for card/bank payments
- ✅ **Real-Time Bills** - Automatic bill generation and tracking
- ✅ **Bill Lookup** - Search bills by BIN ID across states
- ✅ **Payment History** - Complete transaction records
- ✅ **Admin Dashboards** - State-level and platform-wide analytics
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
bin-pay-app/
├── backend/          # Express.js + TypeScript API
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & validation
│   │   ├── services/     # Paystack integration
│   │   └── config/       # Database config
│   └── ...
│
└── frontend/         # Next.js 14 + TypeScript
    ├── app/              # App router pages
    │   ├── login/
    │   ├── register/
    │   ├── dashboard/    # User dashboard
    │   ├── admin/        # State admin portal
    │   └── super-admin/  # Platform admin
    ├── components/       # Reusable components
    ├── lib/              # API client & utilities
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB** v6+ ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Paystack Account** ([Sign up](https://dashboard.paystack.com/signup))

### Installation

1. **Clone the repository**
   ```bash
   cd bin-pay-app
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Configure environment (already created)
   # Edit backend/.env with your MongoDB URI and Paystack keys
   
   # Seed database with initial data
   npm run seed
   
   # Start backend server
   npm run dev
   ```
   Backend runs at `http://localhost:5000`

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   
   # Environment already configured at frontend/.env.local
   
   # Start development server
   npm run dev
   ```
   Frontend runs at `http://localhost:3000`

4. **Access the Application**
   - **Homepage**: http://localhost:3000
   - **Super Admin**: http://localhost:3000/super-admin/login
     - Email: `admin@binpay.ng`
     - Password: `Admin123!@#`

## 👥 User Roles

### 1. Regular User
- Register and login
- Search bills by BIN ID
- Make payments
- View payment history
- Manage profile and registered bins

### 2. State Admin
- Manage bills for their assigned state
- View state-level analytics
- Track payments and collections
- Manage users in their state
- Access state reports

### 3. Super Admin (Platform Admin)
- Platform-wide statistics
- Create and manage state admins
- View all states performance
- Access all data and reports

## 🔑 Default Accounts

After running `npm run seed`:

**Super Admin:**
- Email: `admin@binpay.ng`
- Password: `Admin123!@#`

**Test State Admins** (created automatically):
- Lagos: `lagos-admin@lawma.gov.ng` / `Admin123!`
- Enugu: `enugu-admin@eswama.gov.ng` / `Admin123!`
- FCT: `fct-admin@aepb.gov.ng` / `Admin123!`

## 📁 Project Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   └── validator.ts         # Request validation
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── State.ts             # State schema
│   │   ├── BinRegistration.ts  # Bin registration
│   │   ├── Bill.ts              # Bill schema
│   │   ├── Payment.ts           # Payment schema
│   │   └── Notification.ts      # Notification schema
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── bills.ts             # Bill management
│   │   ├── payments.ts          # Payment processing
│   │   └── admin.ts             # Admin endpoints
│   ├── services/
│   │   └── paystack.ts          # Paystack integration
│   ├── utils/
│   │   └── jwt.ts               # JWT utilities
│   ├── seed.ts                  # Database seeding
│   └── server.ts                # Express server
├── .env                         # Environment variables
├── .env.example                 # Environment template
└── package.json
```

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   ├── login/                   # User login
│   ├── register/                # User registration
│   ├── dashboard/               # User dashboard
│   ├── states/                  # States listing
│   ├── admin/
│   │   ├── login/               # State admin login
│   │   └── dashboard/           # State admin portal
│   └── super-admin/
│       ├── login/               # Super admin login
│       └── page.tsx             # Super admin dashboard
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── logo.tsx
│   └── loading-spinner.tsx
├── lib/
│   ├── api.ts                   # API client
│   ├── auth-types.ts            # TypeScript types
│   ├── states-data.ts           # Nigerian states data
│   └── utils.ts                 # Utility functions
├── .env.local                   # Frontend environment
└── package.json
```

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/binpay

# JWT Secrets (change in production!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Paystack (from https://dashboard.paystack.com)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Admin Account
SUPER_ADMIN_EMAIL=admin@binpay.ng
SUPER_ADMIN_PASSWORD=Admin123!@#
```

### Frontend Environment Variables

Already configured at `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🎯 Development Workflow

1. **Start MongoDB**
   ```bash
   # If using local MongoDB (Windows)
   # MongoDB runs automatically as a service
   
   # Or use MongoDB Compass to start/manage
   ```

2. **Run Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Run Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 📦 Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 🧪 API Testing

Use the provided `backend/api-examples.http` file with REST Client extension in VS Code:

```http
### Login as Super Admin
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@binpay.ng",
  "password": "Admin123!@#"
}
```

## 📊 Database Schema

### Collections

- **users** - User accounts (USER, STATE_ADMIN, SUPER_ADMIN)
- **states** - Nigerian states with waste authorities
- **binRegistrations** - Registered waste bins
- **bills** - Generated bills for bins
- **payments** - Payment transactions
- **notifications** - User notifications

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Request validation
- ✅ Secure payment processing

## 🛣️ API Routes

### Public Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/admin/states` - List all states

### Protected Routes (Requires Auth)
- `GET /api/auth/me` - Get current user
- `GET /api/bills` - Get user's bills
- `POST /api/payments/initiate` - Start payment
- `GET /api/payments/verify/:reference` - Verify payment

### State Admin Routes
- `GET /api/admin/states/:stateCode/stats` - State statistics
- `GET /api/admin/bills/:stateCode` - State bills
- `GET /api/admin/payments/:stateCode` - State payments
- `GET /api/admin/users/:stateCode` - State users

### Super Admin Routes
- `GET /api/admin/super/stats` - Platform statistics
- `GET /api/admin/super/state-admins` - All state admins
- `POST /api/admin/super/state-admins` - Create state admin

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Or check Windows Services for "MongoDB Server"
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### Build Errors
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Payments**: Paystack
- **Security**: Helmet, bcryptjs, CORS

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Development Team

Bin-Pay Development Team

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Email: support@binpay.ng
- Documentation: See README files in `/backend` and `/frontend`

---

**Built with ❤️ for Nigeria 🇳🇬**
