import api from "./api";

const serviceService = {
  getServices: async (params = {}) => {
    try {
      const response = await api.get("/api/services", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getServiceById: async (id) => {
    try {
      const response = await api.get(`/api/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createService: async (data) => {
    try {
      const response = await api.post("/api/services", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateService: async (id, data) => {
    try {
      const response = await api.put(`/api/services/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteService: async (id) => {
    try {
      const response = await api.delete(`/api/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default serviceService;
