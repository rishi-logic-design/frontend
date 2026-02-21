import api from "../services/api";

const billService = {
  getPendingCollectionTotal: async () => {
    try {
      const response = await api.get("/api/bills/pending-total");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBills: async (params = {}) => {
    try {
      const response = await api.get("/api/bills", { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBillById: async (id) => {
    try {
      const response = await api.get(`/api/bills/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markBillPaid: async (id) => {
    try {
      const response = await api.put(`/api/bills/${id}/mark-paid`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  sendWhatsAppReminder: async (id) => {
    try {
      const response = await api.post(`/api/bills/${id}/send-whatsapp`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  getBillHtml: async (id) => {
    try {
      const response = await api.get(`/api/bills/${id}/html`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  downloadPDF: async (id) => {
    try {
      const htmlData = await billService.getBillHtml(id);
      const { html, billNumber } = htmlData;

      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise((resolve) => {
        if (iframe.contentWindow.document.readyState === "complete") {
          resolve();
        } else {
          iframe.onload = resolve;
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      return { success: true, billNumber };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteBill: async (id) => {
    try {
      const response = await api.delete(`/api/bills/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  editBill: async (id, billData) => {
    try {
      const response = await api.put(`/api/bills/${id}`, billData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createBill: async (billData) => {
    try {
      const response = await api.post("/api/bills", billData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  uploadBill: async (billData) => {
    try {
      const response = await api.post("/api/bills/upload", billData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default billService;
