import api from "./api";

const inventoryService = {
  // Stats
  getStats: async () => {
    try {
      const response = await api.get("/api/inventory/stats");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const response = await api.get("/api/inventory/categories");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await api.post(
        "/api/inventory/categories",
        categoryData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(
        `/api/inventory/categories/${id}`,
        categoryData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/api/inventory/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Items
  getItems: async (params = {}) => {
    try {
      const response = await api.get("/api/inventory/items", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createItem: async (itemData) => {
    try {
      const response = await api.post("/api/inventory/items", itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateItem: async (id, itemData) => {
    try {
      const response = await api.put(`/api/inventory/items/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/api/inventory/items/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default inventoryService;
