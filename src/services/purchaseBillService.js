import api from "./api";

const purchaseBillService = {
  createBill: async (billData) => {
    try {
      const response = await api.post("/api/purchase-bills", billData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  listBills: async (params) => {
    try {
      const response = await api.get("/api/purchase-bills", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBillById: async (id) => {
    try {
      const response = await api.get(`/api/purchase-bills/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteBill: async (id) => {
    try {
      const response = await api.delete(`/api/purchase-bills/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default purchaseBillService;
