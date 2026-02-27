import api from "./api";

const reportService = {
  getProductWiseSalesReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/product-wise-sales", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProductWisePurchaseReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/product-wise-purchase", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPartyWiseSalesReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/party-wise-sales", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPartyWisePurchaseReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/party-wise-purchase", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getGSTSalesReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/gst-sales", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getGSTPurchaseReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/gst-purchase", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getInvoiceDetailsReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/invoice-details", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPurchaseDetailsReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/purchase-details", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getCurrentStockReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/current-stock", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDeliveryChallanReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/delivery-challan", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDeliveryChallanDetailsReport: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/challan-details", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getActivityLogs: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/activity-logs", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBulkExports: async (params = {}) => {
    try {
      const response = await api.get("/api/reports/bulk-exports", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createBulkExport: async (data) => {
    try {
      const response = await api.post("/api/reports/bulk-exports", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default reportService;
