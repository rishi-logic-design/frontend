import api from "./api";

const vendorVendorService = {
  getVendors: async (params = {}) => {
    try {
      const response = await api.get("/api/vendor/vendors", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getVendorById: async (id) => {
    try {
      const response = await api.get(`/api/vendor/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createVendor: async (data) => {
    try {
      const response = await api.post("/api/vendor/vendors", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateVendor: async (id, data) => {
    try {
      const response = await api.put(`/api/vendor/vendors/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteVendor: async (id) => {
    try {
      const response = await api.delete(`/api/vendor/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default vendorVendorService;
