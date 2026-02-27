import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiPlus,
  FiPercent,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiInfo,
  FiTag,
  FiLoader,
  FiGrid,
  FiActivity,
} from "react-icons/fi";
import gstSlabService from "../../services/gstSlabService";
import { toast } from "react-toastify";
import "./gstSlabs.scss";

const GstSlabs = () => {
  const navigate = useNavigate();

  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const data = await gstSlabService.getSlabs();
      setSlabs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch GST slabs", err);
    } finally {
      setLoading(false);
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
      toast.error("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      if (editingSlab) {
        await gstSlabService.updateSlab(editingSlab.id, {
          slabName: formData.slabName,
          rate: Number(formData.rate),
        });
        toast.success("GST Slab updated!");
      } else {
        await gstSlabService.createSlab({
          slabName: formData.slabName,
          rate: Number(formData.rate),
        });
        toast.success("New GST Slab added!");
      }

      setShowModal(false);
      loadSlabs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this GST slab? Items using this slab will be affected.",
    );

    if (!confirmDelete) return;

    try {
      await gstSlabService.deleteSlab(id);
      toast.success("Slab deleted successfully");
      loadSlabs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete GST slab");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="gst-slabs-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="header-bar">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          <FiArrowLeft /> <span>Settings</span>
        </button>
        <div className="title-group">
          <h1 className="title">Taxations (GST Slabs)</h1>
          <p className="subtitle">
            Manage tax rates for your dynamic inventory and items.
          </p>
        </div>
        <button className="add-master-btn" onClick={handleAdd}>
          <FiPlus /> <span>New Slab</span>
        </button>
      </div>

      <div className="slabs-layout">
        {/* Left Aspect - Summary */}
        <aside className="slabs-aside">
          <motion.div className="status-card" variants={itemVariants}>
            <div className="icon-box">
              <FiPercent />
            </div>
            <h3>Tax Framework</h3>
            <p>
              Configure GST slabs that will be applied during billing and
              purchase entries.
            </p>

            <div className="mini-stats">
              <div className="stat">
                <span>Active Slabs</span>
                <strong>{slabs.length}</strong>
              </div>
              <div className="stat">
                <span>Compliance</span>
                <strong>Standard</strong>
              </div>
            </div>
          </motion.div>

          <motion.div className="info-tip" variants={itemVariants}>
            <FiInfo />
            <div className="text">
              <strong>Pro Tip</strong>
              <span>
                Use descriptive names like "Services (18%)" or "Essential (5%)"
                for better clarity.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Aspect - List */}
        <main className="slabs-main">
          <motion.div className="list-wrapper" variants={itemVariants}>
            <div className="list-header">
              <div className="col">
                <FiGrid /> Slab Configuration
              </div>
              <div className="col">
                <FiPercent /> Rate
              </div>
              <div className="col action">Manage</div>
            </div>

            <div className="slabs-body">
              {loading && slabs.length === 0 ? (
                <div className="loading-state">
                  <FiLoader className="spin" /> Syncing Tax Slabs...
                </div>
              ) : slabs.length === 0 ? (
                <div className="empty-state">
                  <FiTag />
                  <h3>No GST Slabs Found</h3>
                  <p>Start by adding your first tax configuration.</p>
                  <button onClick={handleAdd}>Create Now</button>
                </div>
              ) : (
                <AnimatePresence>
                  {slabs.map((slab) => (
                    <motion.div
                      key={slab.id}
                      className="slab-row"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <div className="col name">
                        <div className="slab-icon">
                          <FiPercent />
                        </div>
                        <span>{slab.slabName}</span>
                      </div>
                      <div className="col rate">
                        <div className="rate-badge">
                          <strong>{slab.rate}</strong>%
                        </div>
                      </div>
                      <div className="col action">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(slab)}
                          title="Edit Slab"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(slab.id)}
                          title="Delete Slab"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Modal Overhaul */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>
                  {editingSlab ? "Update Tax Slab" : "Define New Tax Slab"}
                </h2>
                <button className="close-x" onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="input-field">
                  <label>
                    <FiTag /> Label Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Standard (18%)"
                    value={formData.slabName}
                    onChange={(e) =>
                      setFormData({ ...formData, slabName: e.target.value })
                    }
                  />
                </div>

                <div className="input-field">
                  <label>
                    <FiActivity /> Percentage Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <FiLoader className="spin" />
                  ) : editingSlab ? (
                    "Save Changes"
                  ) : (
                    "Create Slab"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GstSlabs;
