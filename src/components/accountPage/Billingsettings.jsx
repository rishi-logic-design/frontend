import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiSettings,
  FiFileText,
  FiHash,
  FiLayout,
  FiCheck,
  FiX,
  FiInfo,
  FiAlertTriangle,
  FiLoader,
  FiEye,
} from "react-icons/fi";
import invoiceSettingsService from "../../services/invoiceServiceSettings";
import { toast } from "react-toastify";
import "./billingSettings.scss";

const BillingSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [formData, setFormData] = useState({
    prefix: "",
    startCount: "",
    invoiceTemplate: "",
  });
  const [errors, setErrors] = useState({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadSettings();
    loadTemplatePreview();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await invoiceSettingsService.getInvoiceSettings();
      setSettings(data);
      setFormData({
        prefix: data.prefix || "INV",
        startCount: data.startCount || 1001,
        invoiceTemplate: data.invoiceTemplate || "template1",
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load billing settings");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatePreview = async () => {
    try {
      const data = await invoiceSettingsService.getTemplatePreview();
      setTemplatePreview(data);
    } catch (error) {
      console.error("Failed to load template preview:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.prefix.trim()) {
      newErrors.prefix = "Prefix is required";
    } else if (formData.prefix.length > 10) {
      newErrors.prefix = "Prefix must be 10 characters or less";
    }
    const count = parseInt(formData.startCount);
    if (!formData.startCount || isNaN(count) || count < 1) {
      newErrors.startCount = "Start count must be at least 1";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    if (parseInt(formData.startCount) !== settings.startCount) {
      const confirm = window.confirm(
        "Changing the start count will reset all invoice numbers. Are you sure?",
      );
      if (!confirm) return;
    }

    try {
      setSaving(true);
      const payload = {
        prefix: formData.prefix.toUpperCase().trim(),
        startCount: parseInt(formData.startCount),
        invoiceTemplate: formData.invoiceTemplate,
      };

      await invoiceSettingsService.updateInvoiceSettings(payload);
      toast.success("Billing settings updated!");
      await loadSettings();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setFormData({ ...formData, invoiceTemplate: templateId });
    setShowTemplateModal(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return (
      <div className="billing-settings-v2-loading">
        <FiLoader className="spin" />
        <p>Initializing Billing Systems...</p>
      </div>
    );
  }

  const selectedTemplate = templatePreview?.templates?.find(
    (t) => t.id === formData.invoiceTemplate,
  );

  return (
    <motion.div
      className="billing-settings-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="header-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> <span>Settings</span>
        </button>
        <h1 className="title">Billing Configuration</h1>
      </div>

      <div className="billing-layout">
        {/* Left Column - Current Status */}
        <aside className="status-panel">
          <motion.div className="status-hero" variants={itemVariants}>
            <div className="icon-box">
              <FiFileText />
            </div>
            <h3>Invoice Pulse</h3>
            <p>
              Monitor your next invoice sequence and total transaction count.
            </p>

            <div className="pulse-stats">
              <div className="stat-card">
                <span className="label">Next Sequence</span>
                <span className="value">
                  {settings?.prefix}
                  {String(settings?.currentCount).padStart(
                    String(settings?.startCount).length,
                    "0",
                  )}
                </span>
              </div>
              <div className="stat-card">
                <span className="label">Total Generated</span>
                <span className="value">
                  {settings?.usedNumbers?.length || 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Preview Card */}
          <motion.div className="preview-mini-card" variants={itemVariants}>
            <div className="preview-header">
              <FiEye /> <span>Real-time Preview</span>
            </div>
            <div className="invoice-badge">
              {formData.prefix || "INV"}
              {String(parseInt(formData.startCount) || 1001).padStart(
                String(formData.startCount).length || 4,
                "0",
              )}
            </div>
            <p>Your next invoice will look like this.</p>
          </motion.div>
        </aside>

        {/* Right Column - Configurations */}
        <main className="config-main">
          <motion.div className="config-card" variants={itemVariants}>
            <div className="card-header">
              <FiSettings /> <span>Sequencing Settings</span>
            </div>

            <div className="form-body">
              <div className="input-group">
                <label>
                  <FiHash /> Invoice Prefix
                </label>
                <div className="input-with-hint">
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prefix: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. INV"
                    maxLength={10}
                  />
                  <p className="hint">
                    Prefix displayed before the sequence (e.g., TAX-)
                  </p>
                </div>
                {errors.prefix && (
                  <span className="error-msg">{errors.prefix}</span>
                )}
              </div>

              <div className="input-group">
                <label>
                  <FiLayout /> Starting Count
                </label>
                <div className="input-with-hint">
                  <input
                    type="number"
                    value={formData.startCount}
                    onChange={(e) =>
                      setFormData({ ...formData, startCount: e.target.value })
                    }
                    min="1"
                  />
                  <p className="hint warning">
                    <FiAlertTriangle /> Changing this resets the numbering
                    logic.
                  </p>
                </div>
                {errors.startCount && (
                  <span className="error-msg">{errors.startCount}</span>
                )}
              </div>
            </div>

            <div className="template-section">
              <div className="section-title">
                <FiLayout /> Document Template
              </div>
              <div className="template-picker-card">
                <div className="template-info">
                  <h4>{selectedTemplate?.name || "Standard Template"}</h4>
                  <p>
                    {selectedTemplate?.description ||
                      "Optimized for professional invoicing."}
                  </p>
                </div>
                <button
                  className="change-btn"
                  onClick={() => setShowTemplateModal(true)}
                >
                  Switch Design{" "}
                  <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
                </button>
              </div>
            </div>

            <div className="actions-footer">
              <button className="cancel-btn" onClick={() => navigate(-1)}>
                <FiX /> Cancel
              </button>
              <button
                className={`save-btn ${saving ? "loading" : ""}`}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <FiLoader className="spin" />
                ) : (
                  <>
                    <FiCheck /> Update Configuration
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>Choose Document Style</h2>
                <button
                  className="close-x"
                  onClick={() => setShowTemplateModal(false)}
                >
                  <FiX />
                </button>
              </div>
              <div className="templates-grid">
                {templatePreview?.templates?.map((template) => (
                  <div
                    key={template.id}
                    className={`template-item ${formData.invoiceTemplate === template.id ? "active" : ""}`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="img-box">
                      <img src={template.preview} alt={template.name} />
                      {formData.invoiceTemplate === template.id && (
                        <div className="active-overlay">
                          <FiCheck /> Selected
                        </div>
                      )}
                    </div>
                    <div className="text-box">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BillingSettings;
