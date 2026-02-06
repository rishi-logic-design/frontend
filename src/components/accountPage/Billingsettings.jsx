import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./billingSettings.scss";
import invoiceSettingsService from "../../services/invoiceServiceSettings";

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
      alert("Failed to load billing settings");
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
    e.preventDefault();

    if (!validateForm()) return;

    // Show confirmation for resetting count
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
      alert("Billing settings updated successfully!");
      await loadSettings();
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert(
        error.response?.data?.message || "Failed to update billing settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setFormData({ ...formData, invoiceTemplate: templateId });
    setShowTemplateModal(false);
  };

  if (loading) {
    return (
      <div className="billing-settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading billing settings...</p>
        </div>
      </div>
    );
  }

  const selectedTemplate = templatePreview?.templates?.find(
    (t) => t.id === formData.invoiceTemplate,
  );

  return (
    <div className="billing-settings-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Billing Settings</h1>
      </div>

      <div className="page-content">
        <form className="settings-form" onSubmit={handleSubmit}>
          {/* Current Invoice Info */}
          <div className="info-card">
            <h3 className="card-title">Current Invoice Status</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Next Invoice Number</span>
                <span className="info-value">
                  {settings?.prefix}
                  {String(settings?.currentCount).padStart(
                    String(settings?.startCount).length,
                    "0",
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Invoices Created</span>
                <span className="info-value">
                  {settings?.usedNumbers?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Prefix Settings */}
          <div className="form-section">
            <label className="form-label">
              Invoice Prefix
              <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.prefix ? "error" : ""}`}
              value={formData.prefix}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prefix: e.target.value.toUpperCase(),
                })
              }
              placeholder="INV"
              maxLength={10}
            />
            {errors.prefix && (
              <span className="error-text">{errors.prefix}</span>
            )}
            <p className="form-hint">
              Prefix appears before invoice number (e.g., INV, BILL, etc.)
            </p>
          </div>

          {/* Start Count Settings */}
          <div className="form-section">
            <label className="form-label">
              Starting Count Number
              <span className="required">*</span>
            </label>
            <input
              type="number"
              className={`form-input ${errors.startCount ? "error" : ""}`}
              value={formData.startCount}
              onChange={(e) =>
                setFormData({ ...formData, startCount: e.target.value })
              }
              min="1"
            />
            {errors.startCount && (
              <span className="error-text">{errors.startCount}</span>
            )}
            <p className="form-hint warning">
              ⚠️ Changing this will reset all invoice numbers. Use with caution!
            </p>
          </div>

          {/* Template Selection */}
          <div className="form-section">
            <label className="form-label">Invoice Template</label>
            <div className="template-selector">
              <div className="selected-template">
                <div className="template-info">
                  <h4>{selectedTemplate?.name || "Select Template"}</h4>
                  <p>{selectedTemplate?.description || ""}</p>
                </div>
                <button
                  type="button"
                  className="change-template-btn"
                  onClick={() => setShowTemplateModal(true)}
                >
                  Change Template
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="preview-section">
          <h3 className="preview-title">Invoice Number Preview</h3>
          <div className="preview-card">
            <div className="preview-number">
              {formData.prefix}
              {String(parseInt(formData.startCount) || 1001).padStart(
                String(formData.startCount).length || 4,
                "0",
              )}
            </div>
            <p className="preview-label">Next invoice will use this number</p>
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowTemplateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Invoice Template</h2>
              <button
                className="close-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="templates-grid">
                {templatePreview?.templates?.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${
                      formData.invoiceTemplate === template.id ? "selected" : ""
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="template-preview">
                      <img
                        src={template.preview}
                        alt={template.name}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3E${template.name}%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="template-details">
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                    </div>
                    {formData.invoiceTemplate === template.id && (
                      <div className="selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSettings;
