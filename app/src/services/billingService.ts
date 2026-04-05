import api from './api';
import type { ApiResponse, Invoice, Payment } from '@/types';

interface InvoiceFilter {
  page?: number;
  limit?: number;
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateInvoiceData {
  patientId: number;
  appointmentId?: number;
  dueDate: string;
  taxPercent?: number;
  discountAmount?: number;
  notes?: string;
  items: {
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface ProcessPaymentData {
  invoiceId: number;
  paymentAmount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export const billingService = {
  getInvoices: async (filters: InvoiceFilter): Promise<{ invoices: Invoice[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Invoice[]>>('/billing/invoices', {
      params: filters,
    });
    return {
      invoices: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const response = await api.get<ApiResponse<Invoice>>(`/billing/invoices/${id}`);
    return response.data.data;
  },

  createInvoice: async (data: CreateInvoiceData): Promise<{ invoiceId: number; invoiceNumber: string }> => {
    const response = await api.post<ApiResponse<{ invoiceId: number; invoiceNumber: string }>>(
      '/billing/invoices',
      data
    );
    return response.data.data;
  },

  processPayment: async (data: ProcessPaymentData): Promise<{ paymentId: number }> => {
    const response = await api.post<ApiResponse<{ paymentId: number }>>('/billing/payments', data);
    return response.data.data;
  },

  getPayments: async (filters?: { page?: number; limit?: number; invoiceId?: string; patientId?: string }): Promise<{ payments: Payment[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Payment[]>>('/billing/payments', {
      params: filters,
    });
    return {
      payments: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getBillingStatistics: async (params?: { dateFrom?: string; dateTo?: string }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/billing/statistics', {
      params,
    });
    return response.data.data;
  },
};
