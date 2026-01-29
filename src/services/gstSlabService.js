import api from "./api";

const gstSlabService = {
  getSlabs: async () => {
    const res = await api.get("/api/gst-slabs");
    return res.data.data.gst;
  },
  createSlab: async (payload) => {
    const res = await api.post("/api/gst-slabs", payload);
    return res.data.data.gst;
  },
  updateSlab: async (id, payload) => {
    const res = await api.put(`/api/gst-slabs/${id}`, payload);
    return res.data.data.gst;
  },
  deleteSlab: async (id) => {
    const res = await api.delete(`/api/gst-slabs/${id}`);
    return res.data;
  }
};
 
export default gstSlabService;
