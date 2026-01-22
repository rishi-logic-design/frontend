import api from "../services/api";

const challanService = {

  createChallan: async (payload) => {
    try {
      const response = await api.post("/api/challans",payload);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getChallans: async () => {
    try {
      const response = await api.get("/api/challans");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getChallanById: async (id) => {
    try {
      const response = await api.get(`/api/challans/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPendingCollectionTotal: async () => {
    try {
      const response = await api.get("/api/challans/pending-total");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markChallanPaid: async (id) => {
    try {
      const response = await api.put(`/api/challans/${id}/mark-paid`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  sendWhatsAppReminder: async (id) => {
    try {
      const response = await api.post(`/api/challans/${id}/send-whatsapp`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/api/challans/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteChallan: async (id) => {
    try {
      const response = await api.delete(`/api/challans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default challanService;
