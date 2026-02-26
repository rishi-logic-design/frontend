import api from "./api";

const purchaseService = {
  createPurchase: async (purchaseData) => {
    try {
      const response = await api.post("/api/purchases", purchaseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPurchases: async (params) => {
    try {
      const response = await api.get("/api/purchases", { params });
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

  updatePurchaseStatus: async (id, status) => {
    try {
      const response = await api.patch(`/api/purchases/${id}/status`, {
        status,
      });
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

  uploadPurchaseBill: async (formData) => {
    try {
      const response = await api.post("/api/purchases/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default purchaseService;
