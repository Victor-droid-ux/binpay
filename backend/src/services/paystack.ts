import axios from 'axios';
import crypto from 'crypto';

interface PaystackInitializeData {
  email: string;
  amount: number; // in kobo
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!;
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not set');
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializePayment(data: PaystackInitializeData): Promise<PaystackResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack initialize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  async verifyPayment(reference: string): Promise<PaystackResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack verify error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  async listBanks(): Promise<PaystackResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack list banks error:', error.response?.data || error.message);
      throw new Error('Failed to get bank list');
    }
  }

  async createTransferRecipient(data: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
  }): Promise<PaystackResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Paystack create recipient error:', error.response?.data || error.message);
      throw new Error('Failed to create transfer recipient');
    }
  }
}

export const paystackService = new PaystackService();
