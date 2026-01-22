import api from "../services/api";

const billService = {
  getPendingCollectionTotal: async () => {
    try {
      const response = await api.get("/api/bills/pending-total");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBills: async () => {
    try {
      const response = await api.get("/api/bills");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBillById: async (id) => {
    try {
      const response = await api.get(`/api/bills/${id}`);
      console.log(response)
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markBillPaid: async (id) => {
    try {
      const response = await api.put(`/api/bills/${id}/mark-paid`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  sendWhatsAppReminder: async (id) => {
    try {
      const response = await api.post(`/api/bills/${id}/send-whatsapp`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/api/bills/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteBill: async (id) => {
    try {
      const response = await api.delete(`/api/bills/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  editBill: async (id, billData) => {
    try {
      const response = await api.put(`/api/bills/${id}`, billData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createBill: async (billData) => {
    try {
      const response = await api.post("/api/bills", billData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default billService;
