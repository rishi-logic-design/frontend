import api from "./api";

const paymentService = {
  createPayment: async (paymentData) => {
    try {
      const response = await api.post("/api/payments", paymentData);
      return response.data.data;
    } catch (error) {
      console.error("Payment creation error:", error);
      throw error.response?.data || error;
    }
  },

  getPayments: async (params = {}) => {
    try {
      const response = await api.get("/api/payments", { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/api/payments/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updatePayment: async (id, paymentData) => {
    try {
      const response = await api.put(`/api/payments/${id}`, paymentData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deletePayment: async (id) => {
    try {
      const response = await api.delete(`/api/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPaymentStats: async (params = {}) => {
    try {
      const response = await api.get("/api/payments/stats", { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCustomerOutstanding: async (customerId) => {
    try {
      const response = await api.get(
        `/api/payments/customer/${customerId}/outstanding`,
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCustomerPendingInvoices: async (customerId) => {
    try {
      const response = await api.get(
        `/api/payments/customer/${customerId}/invoices`,
      );

      console.log("Pending invoices response:", response.data);

      // Handle the response structure properly
      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Combine bills and challans into a single invoices array
        const invoices = [...(data.bills || []), ...(data.challans || [])];

        return {
          invoices: invoices,
          totalPending: data.totalPending || 0,
          bills: data.bills || [],
          challans: data.challans || [],
        };
      }

      return {
        invoices: [],
        totalPending: 0,
        bills: [],
        challans: [],
      };
    } catch (error) {
      console.error("Error fetching pending invoices:", error);
      throw error.response?.data || error;
    }
  },
};

export default paymentService;
