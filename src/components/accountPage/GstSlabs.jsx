import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import gstSlabService from "../../services/gstSlabService";
import "./gstSlabs.scss";

const GstSlabs = () => {
  const navigate = useNavigate();

  const [slabs, setSlabs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);
  const [formData, setFormData] = useState({
    slabName: "",
    rate: "",
  });

  useEffect(() => {
    loadSlabs();
  }, []);

  const loadSlabs = async () => {
    try {
      const data = await gstSlabService.getSlabs();
      setSlabs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch GST slabs", err);
    }
  };

  const handleAdd = () => {
    setEditingSlab(null);
    setFormData({ slabName: "", rate: "" });
    setShowModal(true);
  };

  const handleEdit = (slab) => {
    setEditingSlab(slab);
    setFormData({
      slabName: slab.slabName,
      rate: slab.rate,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.slabName || formData.rate === "") {
      alert("Please fill all fields");
      return;
    }
    try {
      if (editingSlab) {
        await gstSlabService.updateSlab(editingSlab.id, {
          slabName: formData.slabName,
          rate: Number(formData.rate),
        });
      } else {
        await gstSlabService.createSlab({
          slabName: formData.slabName,
          rate: Number(formData.rate),
        });
      }

      setShowModal(false);
      loadSlabs();
    } catch (err) {
      alert(err?.response?.data?.message || "Something went wrong");
    }
  };

  // 🔹 DELETE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this GST slab?",
    );

    if (!confirmDelete) return;

    try {
      await gstSlabService.deleteSlab(id);
      loadSlabs();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete GST slab");
    }
  };

  return (
    <div className="gst-slabs-page">
      <div className="page-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/account")}
          >
            ←
          </button>
          <h1>GST Slabs</h1>
        </div>

        <button className="add-btn" onClick={handleAdd}>
          +
        </button>
      </div>

      <div className="slabs-container">
        {slabs.length === 0 ? (
          <p className="empty-text">No GST slabs found</p>
        ) : (
          slabs.map((slab) => (
            <div key={slab.id} className="slab-item">
              <span className="slab-name">
                {slab.slabName} ({slab.rate}%)
              </span>

              <div className="slab-actions">
                <button onClick={() => handleEdit(slab)}>✎</button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(slab.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSlab ? "Edit GST Slab" : "Add GST Slab"}</h2>

            <div className="form-group">
              <label>Slab Name</label>
              <input
                value={formData.slabName}
                onChange={(e) =>
                  setFormData({ ...formData, slabName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Percentage (%)</label>
              <input
                type="number"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GstSlabs;