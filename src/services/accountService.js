import api from "./api";

const accountService = {
  getAccounts: async (params = {}) => {
    try {
      const response = await api.get("/api/accounts", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createAccount: async (data) => {
    try {
      const response = await api.post("/api/accounts", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateAccount: async (id, data) => {
    try {
      const response = await api.put(`/api/accounts/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteAccount: async (id) => {
    try {
      const response = await api.delete(`/api/accounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  adjustBalance: async (data) => {
    try {
      const response = await api.post("/api/accounts/adjust-balance", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  contraEntry: async (data) => {
    try {
      const response = await api.post("/api/accounts/contra-entry", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getAccountLedger: async (id, params = {}) => {
    try {
      const response = await api.get(`/api/accounts/${id}/ledger`, { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default accountService;
