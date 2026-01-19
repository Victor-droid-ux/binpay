# Email Service Setup Guide

## ✅ Implementation Status

The email service for password reset functionality has been **successfully implemented** and is ready for use.

### What's Been Completed:

1. **Email Service Utility** (`backend/src/services/email.ts`)
   - Nodemailer transporter configuration
   - Beautiful HTML email templates
   - Password reset email function
   - Welcome email function (bonus)
   - Error handling and logging

2. **Backend Integration** (`backend/src/routes/auth.ts`)
   - Updated forgot-password endpoint to send emails
   - 6-digit reset code generation
   - 15-minute expiration
   - Security-focused responses

3. **Dependencies Installed**
   - nodemailer v6.9.16
   - @types/nodemailer v6.4.17
   - 84 packages successfully added

4. **Frontend Pages** (Already Complete)
   - `/forgot-password` - User password reset
   - `/admin/forgot-password` - State admin reset
   - `/super-admin/forgot-password` - Super admin reset

---

## 🔧 SMTP Configuration Required

To enable email sending, you need to configure SMTP credentials in your `.env` file.

### For Gmail (Recommended for Development):

#### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Follow the setup wizard

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Click "Generate"
4. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Update .env File
Open `backend/.env` and update these lines:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # Use the 16-char app password WITHOUT spaces
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=binpay.notifications@gmail.com
SMTP_PASS=xyzw1234abcd5678
```

#### Step 4: Restart Backend
```bash
cd backend
npm run dev
```

You should see:
```
✅ Email service ready
```

Instead of:
```
❌ Email service error: Invalid login
```

---

## 📧 Email Features

### Password Reset Email
- **Subject:** "Bin-Pay Password Reset Code"
- **Content:**
  - Personalized greeting with user's first name
  - 6-digit reset code in a styled box
  - Security warnings (15-minute expiry, don't share code)
  - Step-by-step instructions
  - Professional Bin-Pay branding

### Welcome Email (Bonus)
- **Subject:** "Welcome to Bin-Pay!"
- **Content:**
  - Welcome message
  - Feature highlights
  - "Get Started" button
  - Professional design

---

## 🧪 Testing the Email Flow

### Test Password Reset:

1. **Ensure backend is running with valid SMTP credentials**
   ```bash
   cd backend
   npm run dev
   ```
   Verify you see: `✅ Email service ready`

2. **Go to forgot password page**
   - User: http://localhost:3000/forgot-password
   - Admin: http://localhost:3000/admin/forgot-password
   - Super Admin: http://localhost:3000/super-admin/forgot-password

3. **Enter registered email** (e.g., `admin@binpay.ng`)

4. **Check your email inbox**
   - Email should arrive within seconds
   - Subject: "Bin-Pay Password Reset Code"
   - Contains 6-digit code

5. **Enter code and new password**
   - Code is valid for 15 minutes
   - Password must be at least 8 characters

6. **Success!**
   - Password is updated
   - You can now login with new password

---

## 🔒 Security Features

- **Reset codes are 6 digits** - Easy to type, secure enough
- **15-minute expiration** - Prevents old codes from being used
- **One-time use** - Code is cleared after successful reset
- **Secure responses** - Doesn't reveal if email exists or not
- **Hashed passwords** - Bcrypt with salt rounds
- **SMTP over TLS** - Encrypted email transmission (port 587)

---

## 🎨 Email Template Preview

The password reset email includes:
- 🗑️ Bin-Pay logo and branding
- Green gradient header
- Large, centered 6-digit code
- Warning box with important security info
- Step-by-step instructions
- Professional footer
- Responsive design (works on mobile)

---

## 🚀 Alternative SMTP Providers

If you don't want to use Gmail, here are alternatives:

### SendGrid (Free tier: 100 emails/day)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Mailgun (Free tier: 5,000 emails/month)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_password
```

---

## 🐛 Troubleshooting

### Error: "Invalid login: 535 Username and Password not accepted"
**Solution:** 
- Make sure you're using an **App Password**, not your regular Gmail password
- Remove all spaces from the app password
- Enable 2-Step Verification first

### Error: "ECONNREFUSED"
**Solution:**
- Check your firewall settings
- Verify SMTP_PORT is 587 (not 465 or 25)
- Try using your phone's hotspot to rule out network blocks

### Error: "Email service error: getaddrinfo ENOTFOUND"
**Solution:**
- Check SMTP_HOST is correct (smtp.gmail.com)
- Verify internet connection

### Emails not arriving
**Solution:**
- Check spam/junk folder
- Verify SMTP_USER email is correct
- Check backend console for "📧 Email sent:" message
- Try sending to a different email address

---

## 📝 Code Reference

### Send Password Reset Email
```typescript
// In backend/src/routes/auth.ts
const emailSent = await sendPasswordResetEmail(
  email,
  resetCode,
  user.firstName || 'User'
);
```

### Send Welcome Email
```typescript
// Can be added to registration endpoint
import { sendWelcomeEmail } from '../services/email';

await sendWelcomeEmail(email, firstName);
```

---

## ✨ Next Steps

1. **Configure SMTP credentials** in `.env`
2. **Test password reset flow** end-to-end
3. **Optional:** Add welcome emails to registration
4. **Optional:** Add payment confirmation emails
5. **Production:** Use a dedicated email service (SendGrid, Mailgun, etc.)

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify `.env` configuration
3. Check backend console logs
4. Ensure MongoDB is running
5. Restart backend server after .env changes

---

**Status:** ✅ **Ready to Use** (Just configure SMTP credentials)

**Backend:** Running on http://localhost:5000  
**Frontend:** Running on http://localhost:3000  
**Email Service:** Implemented and waiting for SMTP config
