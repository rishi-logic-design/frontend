import api from "../services/api";

const customerService = {
  createCustomer: async (customerData) => {
    try {
      const response = await api.post("/api/customers", customerData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // FIXED: Added vendorId parameter
  getCustomers: async (vendorId) => {
    try {
      // If vendorId is provided, send it as query parameter
      const params = vendorId ? { vendorId } : {};
      const response = await api.get("/api/customers", { params });

      // Log to debug what we're getting
      console.log("API Response for customers:", response.data);

      // Handle different response formats
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in getCustomers:", error);
      throw error.response?.data || error;
    }
  },

  getCustomerById: async (id) => {
    try {
      const response = await api.get(`/api/customers/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.put(`/api/customers/${id}`, customerData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await api.delete(`/api/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchCustomers: async (searchQuery) => {
    try {
      const response = await api.get("/api/customers/search", {
        params: { q: searchQuery },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCustomerCountByVendor: async () => {
    try {
      const response = await api.get("/api/customers/count-by-vendor");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  addTransaction: async (customerId, transactionData) => {
    try {
      const response = await api.post(
        `/api/customers/${customerId}/transactions`,
        transactionData,
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTransactionReport: async (params) => {
    try {
      const response = await api.get("/api/customers/transactions/report", {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default customerService;
