import api from "./api";

const debitNoteService = {
  getDebitNotes: async (params = {}) => {
    try {
      const response = await api.get("/api/debit-notes", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDebitNoteById: async (id) => {
    try {
      const response = await api.get(`/api/debit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createDebitNote: async (data) => {
    try {
      const response = await api.post("/api/debit-notes", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateDebitNote: async (id, data) => {
    try {
      const response = await api.put(`/api/debit-notes/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteDebitNote: async (id) => {
    try {
      const response = await api.delete(`/api/debit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default debitNoteService;
