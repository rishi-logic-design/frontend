import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./gstSlabs.scss";

const GSTSlabs = () => {
  const navigate = useNavigate();
  const [slabs, setSlabs] = useState([
    { id: 1, name: "5%", percentage: 5 },
    { id: 2, name: "12%", percentage: 12 },
    { id: 3, name: "18%", percentage: 18 },
    { id: 4, name: "28%", percentage: 28 },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
  });

  const handleAdd = () => {
    setEditingSlab(null);
    setFormData({ name: "", percentage: "" });
    setShowModal(true);
  };

  const handleEdit = (slab) => {
    setEditingSlab(slab);
    setFormData({ name: slab.name, percentage: slab.percentage });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setSlabs(slabs.filter((slab) => slab.id !== id));
  };

  const handleSave = () => {
    if (editingSlab) {
      setSlabs(
        slabs.map((slab) =>
          slab.id === editingSlab.id
            ? { ...slab, name: formData.name, percentage: formData.percentage }
            : slab,
        ),
      );
    } else {
      setSlabs([
        ...slabs,
        {
          id: Date.now(),
          name: formData.name,
          percentage: formData.percentage,
        },
      ]);
    }
    setShowModal(false);
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
          <h1>GST SLABS</h1>
        </div>
        <button className="add-btn" onClick={handleAdd}>
          +
        </button>
      </div>

      <div className="slabs-container">
        {slabs.map((slab) => (
          <div key={slab.id} className="slab-item">
            <span className="slab-name">{slab.name}</span>
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
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add/Edit SLABS</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>SLABS Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your Amount"
              />
            </div>

            <div className="form-group">
              <label>Percentage</label>
              <input
                type="number"
                value={formData.percentage}
                onChange={(e) =>
                  setFormData({ ...formData, percentage: e.target.value })
                }
                placeholder="Enter Percentage"
              />
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTSlabs;
