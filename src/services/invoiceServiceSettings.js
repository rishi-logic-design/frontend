import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("vendorToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const invoiceSettingsService = {
  getInvoiceSettings: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/vendor/invoice-settings`,
        getAuthHeaders(),
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
      throw error;
    }
  },

  updateInvoiceSettings: async (payload) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/vendor/invoice-settings`,
        payload,
        getAuthHeaders(),
      );
      return response.data.data;
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      throw error;
    }
  },

  getNextInvoiceNumber: async (requestedNumber = null) => {
    try {
      const url = requestedNumber
        ? `${API_BASE_URL}/vendor/invoice-settings/next-number?requestedNumber=${requestedNumber}`
        : `${API_BASE_URL}/vendor/invoice-settings/next-number`;

      const response = await axios.get(url, getAuthHeaders());
      return response.data.data;
    } catch (error) {
      console.error("Error getting next invoice number:", error);
      throw error;
    }
  },

  checkInvoiceNumber: async (number) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/vendor/invoice-settings/check-number?number=${number}`,
        getAuthHeaders(),
      );
      return response.data.data;
    } catch (error) {
      console.error("Error checking invoice number:", error);
      throw error;
    }
  },

  getTemplatePreview: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/vendor/invoice-settings/template-preview`,
        getAuthHeaders(),
      );
      console.log(response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error getting template preview:", error);
      throw error;
    }
  },
};

export default invoiceSettingsService;
