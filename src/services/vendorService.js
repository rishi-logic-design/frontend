import api from "./api";

const vendorService = {
  getAllVendors: async (params = {}) => {
    try {
      const response = await api.get("/vendors", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getVendorById: async (id) => {
    try {
      const response = await api.get(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createVendor: async (vendorData) => {
    try {
      const response = await api.post("/vendors", vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateVendor: async (id, vendorData) => {
    try {
      const response = await api.put(`/vendors/${id}`, vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteVendor: async (id) => {
    try {
      const response = await api.delete(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default vendorService;
