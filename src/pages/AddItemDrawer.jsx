import React, { useState, useEffect } from "react";
import { FaTimes, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./addItemDrawer.scss";

const AddItemDrawer = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    showDescription: false,
    salePrice: "",
    unit: "",
    gst: "",
    hsn: "",
    category: "",
    purchasePrice: "0",
    openingStock: "0",
    customFields: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        showDescription: !!initialData.description,
        salePrice: initialData.salePrice || "",
        unit: initialData.unit || "",
        gst: initialData.gst || "",
        hsn: initialData.hsn || "",
        category: initialData.category?.name || "",
        purchasePrice: initialData.purchasePrice || "0",
        openingStock: initialData.openingStock || "0",
        customFields: initialData.customFields || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        showDescription: false,
        salePrice: "",
        unit: "",
        gst: "",
        hsn: "",
        category: "",
        purchasePrice: "0",
        openingStock: "0",
        customFields: [],
      });
    }
    setTouched({ name: false });
  }, [initialData, isOpen]);

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [showStocks, setShowStocks] = useState(true);
  const [touched, setTouched] = useState({ name: false });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true });
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`add-item-drawer-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div className="add-item-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{initialData ? "Edit Item" : "Add New Item"}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-body">
          {/* Base Information Section */}
          <div className="form-section container-box">
            <div className="form-group">
              <label className="required-label">Item Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                className={touched.name && !formData.name.trim() ? "error" : ""}
              />
              {touched.name && !formData.name.trim() && (
                <span className="error-text">required!</span>
              )}
            </div>

            <div className="description-toggle">
              <button
                type="button"
                className="add-desc-btn"
                onClick={() =>
                  setFormData({
                    ...formData,
                    showDescription: !formData.showDescription,
                  })
                }
              >
                + Add Description
              </button>
              {formData.showDescription && (
                <textarea
                  name="description"
                  placeholder="Enter Description"
                  value={formData.description}
                  onChange={handleChange}
                />
              )}
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label className="required-label">Sale Price *</label>
                <div className="input-with-symbol simple-input">
                  <span>₹</span>
                  <input
                    type="number"
                    name="salePrice"
                    placeholder="Enter Price"
                    value={formData.salePrice}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group flex-1">
                <label>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="">Select Unit</option>
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="BOX">BOX</option>
                  <option value="BDL">BDL</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>GST %</label>
                <select name="gst" value={formData.gst} onChange={handleChange}>
                  <option value="">Select GST</option>
                  <option value="0">GST@0%</option>
                  <option value="5">GST@5%</option>
                  <option value="12">GST@12%</option>
                  <option value="18">GST@18%</option>
                  <option value="28">GST@28%</option>
                </select>
              </div>
              <div className="form-group flex-1">
                <label className="has-action">
                  HSN
                  <span className="action-link">
                    <FaSearch /> Search
                  </span>
                </label>
                <input
                  type="text"
                  name="hsn"
                  placeholder="Enter HSN"
                  value={formData.hsn}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id || cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className="add-custom-btn">
              + Add Custom Field
            </button>
          </div>

          {/* Additional Information Section */}
          <div className="form-collapsible container-box">
            <div
              className="collapsible-header"
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            >
              <div className="title">
                Additional Information{" "}
                {showAdditionalInfo ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>
            {showAdditionalInfo && (
              <div className="collapsible-content">
                <div className="form-group">
                  <label>Purchase Price</label>
                  <div className="input-with-symbol simple-input light">
                    <span>₹</span>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stocks Section */}
          <div className="form-collapsible container-box">
            <div
              className="collapsible-header"
              onClick={() => setShowStocks(!showStocks)}
            >
              <div className="title">
                Stocks {showStocks ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>
            {showStocks && (
              <div className="collapsible-content">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Opening Stock</label>
                    <input
                      type="number"
                      name="openingStock"
                      value={formData.openingStock}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="drawer-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemDrawer;
