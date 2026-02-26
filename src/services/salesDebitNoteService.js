import api from "./api";

const salesDebitNoteService = {
  getSalesDebitNotes: async (params = {}) => {
    try {
      const response = await api.get("/api/sales-debit-notes", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSalesDebitNoteById: async (id) => {
    try {
      const response = await api.get(`/api/sales-debit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createSalesDebitNote: async (data) => {
    try {
      const response = await api.post("/api/sales-debit-notes", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateSalesDebitNote: async (id, data) => {
    try {
      const response = await api.put(`/api/sales-debit-notes/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteSalesDebitNote: async (id) => {
    try {
      const response = await api.delete(`/api/sales-debit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/api/sales-debit-notes/${id}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  recordPayment: async (data) => {
    try {
      const response = await api.post(
        "/api/sales-debit-notes/record-payment",
        data,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default salesDebitNoteService;
