import api from "./api";

const purchasePaymentService = {
  createPayment: async (paymentData) => {
    try {
      const response = await api.post("/api/purchase-payments", paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  listPayments: async (params = {}) => {
    try {
      const response = await api.get("/api/purchase-payments", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/api/purchase-payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deletePayment: async (id) => {
    try {
      const response = await api.delete(`/api/purchase-payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSellerOutstanding: async (sellerId) => {
    try {
      const response = await api.get(
        `/api/purchase-payments/seller/${sellerId}/outstanding`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSellerPendingPurchases: async (sellerId) => {
    try {
      const response = await api.get(
        `/api/purchase-payments/seller/${sellerId}/purchases`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default purchasePaymentService;
