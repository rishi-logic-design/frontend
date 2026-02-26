import api from "./api";

const ledgerService = {
  getLedgerSummary: async (partyId, type = "customer", params = {}) => {
    try {
      const response = await (type === "customer"
        ? api.get(`/api/ledger/customers/${partyId}`, { params })
        : api.get(`/api/ledger/vendors/${partyId}`, { params }));
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCustomerLedger: async (customerId, params = {}) => {
    try {
      const response = await api.get(`/api/ledger/customers/${customerId}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getVendorLedger: async (vendorId, params = {}) => {
    try {
      const response = await api.get(`/api/ledger/vendors/${vendorId}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getLedgerCustomers: async (params = {}) => {
    try {
      const response = await api.get("/api/ledger/customers", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getLedgerVendors: async (params = {}) => {
    try {
      const response = await api.get("/api/ledger/vendors", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  exportLedger: async (exportData) => {
    try {
      const response = await api.post("/api/ledger/export", exportData, {
        responseType: exportData.format === "pdf" ? "blob" : "json",
      });

      if (exportData.format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ledger_${exportData.customerId}_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ledger_${exportData.customerId}_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default ledgerService;
