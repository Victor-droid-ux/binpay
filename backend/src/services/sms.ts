import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;

// Only initialize if credentials are provided
if (accountSid && authToken && fromNumber) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS service initialized');
  } catch (error: any) {
    console.error('❌ Twilio initialization error:', error.message);
  }
} else {
  console.log('⚠️ Twilio SMS not configured (credentials missing)');
}

export interface SendSMSOptions {
  to: string;
  message: string;
}

export const sendSMS = async (options: SendSMSOptions): Promise<boolean> => {
  if (!twilioClient) {
    console.log('⚠️ SMS not sent - Twilio not configured');
    return false;
  }

  try {
    // Format phone number (ensure it has country code)
    let phoneNumber = options.to.trim();
    if (!phoneNumber.startsWith('+')) {
      // Assume Nigerian number if no country code
      phoneNumber = '+234' + phoneNumber.replace(/^0+/, '');
    }

    const message = await twilioClient.messages.create({
      body: options.message,
      from: fromNumber,
      to: phoneNumber,
    });

    console.log('📱 SMS sent:', message.sid, 'to', phoneNumber);
    return true;
  } catch (error: any) {
    console.error('❌ SMS send failed:', error.message);
    return false;
  }
};

export const sendPasswordResetSMS = async (
  phone: string,
  resetCode: string,
  userName: string
): Promise<boolean> => {
  const message = `Hello ${userName},

Your Bin-Pay password reset code is: ${resetCode}

This code expires in 15 minutes.

If you didn't request this, please ignore this message.

- Bin-Pay Team`;

  return sendSMS({ to: phone, message });
};

export const sendPaymentConfirmationSMS = async (
  phone: string,
  amount: number,
  billNumber: string,
  transactionRef: string
): Promise<boolean> => {
  const message = `Payment Successful! ✅

Amount: ₦${amount.toLocaleString()}
Bill: ${billNumber}
Ref: ${transactionRef}

Thank you for using Bin-Pay!

Need help? Contact support.`;

  return sendSMS({ to: phone, message });
};

export const sendBillReminderSMS = async (
  phone: string,
  billNumber: string,
  amount: number,
  dueDate: Date
): Promise<boolean> => {
  const formattedDate = dueDate.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = `Bill Reminder 🗑️

Bill #${billNumber}
Amount: ₦${amount.toLocaleString()}
Due: ${formattedDate}

Pay now at: http://localhost:3000/dashboard

- Bin-Pay`;

  return sendSMS({ to: phone, message });
};

export const sendNewBillSMS = async (
  phone: string,
  billNumber: string,
  amount: number,
  dueDate: Date
): Promise<boolean> => {
  const formattedDate = dueDate.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = `New Bill Created 📄

Bill #${billNumber}
Amount: ₦${amount.toLocaleString()}
Due: ${formattedDate}

View & Pay: http://localhost:3000/dashboard

- Bin-Pay`;

  return sendSMS({ to: phone, message });
};

export const sendWelcomeSMS = async (phone: string, firstName: string): Promise<boolean> => {
  const message = `Welcome to Bin-Pay, ${firstName}! 🗑️

Your account is ready. Pay waste bills easily online.

Login: http://localhost:3000/login

Need help? We're here for you!

- Bin-Pay Team`;

  return sendSMS({ to: phone, message });
};

export default {
  sendSMS,
  sendPasswordResetSMS,
  sendPaymentConfirmationSMS,
  sendBillReminderSMS,
  sendNewBillSMS,
  sendWelcomeSMS,
};
