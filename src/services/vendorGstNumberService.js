import api from "./api";

const vendorGstNumberService = {
  getGstNumber: async () => {
    const res = await api.get("/api/vendor-gst-numbers");
    return res.data.data;
  },

  saveGstNumber: async (payload) => {
    const res = await api.post("/api/vendor-gst-numbers", payload);
    return res.data.data;
  },
};

export default vendorGstNumberService;
