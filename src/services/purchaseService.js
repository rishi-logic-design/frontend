import api from "./api";

const purchaseService = {
  createPurchase: async (purchaseData) => {
    try {
      const response = await api.post("/api/purchases/create", purchaseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPurchases: async (params) => {
    try {
      const response = await api.get("/api/purchases/list", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPurchaseById: async (id) => {
    try {
      const response = await api.get(`/api/purchases/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deletePurchase: async (id) => {
    try {
      const response = await api.delete(`/api/purchases/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default purchaseService;
