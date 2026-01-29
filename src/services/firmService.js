import api from "./api";

const firmService = {
  getFirm: async () => {
    const res = await api.get("/api/firm");
    return res.data.data?.firm;
  },

  saveFirm: async (payload) => {
    const res = await api.post("/api/firm", payload);
    return res.data.data?.firm;
  },

  updateFirm: async (payload) => {
    const res = await api.put("/api/firm", payload);
    return res.data.data?.firm;
  },

  deleteFirm: async () => {
    const res = await api.delete("/api/firm");
    return res.data;
  },
};

export default firmService;
