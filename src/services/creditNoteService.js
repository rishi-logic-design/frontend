import api from "./api";

const creditNoteService = {
  getCreditNotes: async (params = {}) => {
    try {
      const response = await api.get("/api/credit-notes", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getCreditNoteById: async (id) => {
    try {
      const response = await api.get(`/api/credit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createCreditNote: async (data) => {
    try {
      const response = await api.post("/api/credit-notes", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateCreditNote: async (id, data) => {
    try {
      const response = await api.put(`/api/credit-notes/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteCreditNote: async (id) => {
    try {
      const response = await api.delete(`/api/credit-notes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/api/credit-notes/${id}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default creditNoteService;
