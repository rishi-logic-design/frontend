import api from "../services/api";

const productService = {
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("/api/products/categories", categoryData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCategories: async (vendorId) => {
    try {
      const params = vendorId ? { vendorId } : {};
      const response = await api.get("/api/products/categories", { params });

      console.log("API Response for categories:", response.data);

      // Handle different response formats
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in getCategories:", error);
      throw error.response?.data || error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(
        `/api/products/categories/${id}`,
        categoryData,
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/api/products/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Size Management
  createSize: async (sizeData) => {
    try {
      const response = await api.post("/api/products/sizes", sizeData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSizes: async (vendorId) => {
    try {
      const params = vendorId ? { vendorId } : {};
      const response = await api.get("/api/products/sizes", { params });

      console.log("API Response for sizes:", response.data);

      // Handle different response formats
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in getSizes:", error);
      throw error.response?.data || error;
    }
  },

  updateSize: async (id, sizeData) => {
    try {
      const response = await api.put(`/api/products/sizes/${id}`, sizeData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteSize: async (id) => {
    try {
      const response = await api.delete(`/api/products/sizes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await api.post("/api/products", productData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProducts: async () => {
    try {
      const response = await api.get("/api/products");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await api.get(`/api/products/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/api/products/${id}`, productData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Stock Management
  changeStock: async (stockData) => {
    try {
      const response = await api.post("/api/products/stock/change", stockData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default productService;
