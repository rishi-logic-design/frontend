import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiPackage,
  FiTag,
  FiMaximize2,
  FiHash,
  FiDollarSign,
  FiCheck,
  FiX,
  FiInfo,
  FiLoader,
  FiAlertTriangle,
  FiFileText,
  FiChevronDown,
  FiGrid,
} from "react-icons/fi";
import challanService from "../../services/challanService";
import productService from "../../services/productService";
import customerService from "../../services/customerService";
import { toast } from "react-toastify";
import "./newChallan.scss";

const NewChallan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    productName: "",
    productCategory: "",
    productSize: "",
    quantity: "",
    price: "",
  });

  const [errors, setErrors] = useState({});

  const getVendorId = () => {
    const vendorData = localStorage.getItem("vendorData");
    if (vendorData) {
      try {
        const parsed = JSON.parse(vendorData);
        const id = parsed.vendorId || parsed._id || parsed.id;
        if (id) return id;
      } catch (e) {
        console.error("Error parsing vendor data:", e);
      }
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const id = parsed.vendorId || parsed._id || parsed.id;
        if (id) return id;
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    return null;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const vendorId = getVendorId();
      if (!vendorId) {
        navigate("/login");
        return;
      }

      const [categoriesData, sizesData, customersData] = await Promise.all([
        productService.getCategories(vendorId),
        productService.getSizes(vendorId),
        customerService.getCustomers(vendorId),
      ]);

      setCustomers(
        customersData?.data?.rows ||
          customersData?.rows ||
          (Array.isArray(customersData) ? customersData : []),
      );
      setCategories(
        categoriesData?.data ||
          (Array.isArray(categoriesData) ? categoriesData : []),
      );
      setSizes(sizesData?.data || (Array.isArray(sizesData) ? sizesData : []));
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer) newErrors.customer = "Required";
    if (!formData.productName.trim()) newErrors.productName = "Required";
    if (!formData.productCategory) newErrors.productCategory = "Required";
    if (!formData.productSize) newErrors.productSize = "Required";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.quantity = "Invalid Qty";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Invalid Price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const selectedSize = sizes.find(
        (sz) => String(sz._id || sz.id) === String(formData.productSize),
      );  
      if (!selectedSize) {
        toast.error("Size variant not recognized.");
        return;
      }

      const payload = {
        customerId: formData.customer,
        challanDate: new Date().toISOString().slice(0, 10),
        items: [
          {
            productId: formData.productCategory,
            productName: formData.productName.trim(),
            categoryId: formData.productCategory,
            size: selectedSize.label || selectedSize.size || "",
            qty: Number(formData.quantity),
            pricePerUnit: Number(formData.price),
            gstPercent: 5,
          },
        ],
      };

      const challan = await challanService.createChallan(payload);
      toast.success("Delivery Challan generated!");
      navigate(`/vendor/challan-details/${challan.id || challan._id}`);
    } catch (error) {
      toast.error(
        error?.message || error?.data?.message || "Failed to generate challan",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredData =
    customers.length > 0 && categories.length > 0 && sizes.length > 0;

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
      className="new-challan-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="header-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> <span>Sales</span>
        </button>
        <div className="title-group">
          <h1 className="title">Generate Delivery Challan</h1>
          <p className="subtitle">
            Issue a formal delivery note for goods transport.
          </p>
        </div>
      </div>

      <div className="challan-layout">
        {/* Left Side: Live Summary and Tips */}
        <aside className="challan-aside">
          <motion.div className="summary-card" variants={itemVariants}>
            <div className="icon-box">
              <FiFileText />
            </div>
            <h3>Challan Summary</h3>
            <p>Verify document details before finalizing the entry.</p>

            <div className="challan-preview">
              <div className="p-label">DOCUMENT PREVIEW</div>
              <div className="p-card">
                <div className="p-badge">DC-2026-LIVE</div>
                <strong>{formData.productName || "Unnamed Product"}</strong>
                <div className="p-details">
                  <span>
                    <FiUser />{" "}
                    {customers.find(
                      (c) => (c._id || c.id) === formData.customer,
                    )?.customerName || "Select Customer"}
                  </span>
                  <span>
                    <FiTag />{" "}
                    {categories.find(
                      (c) => (c._id || c.id) === formData.productCategory,
                    )?.name || "Select Category"}
                  </span>
                </div>
                <div className="p-price">
                  ₹
                  {(
                    (Number(formData.price) || 0) *
                    (Number(formData.quantity) || 0)
                  ).toLocaleString()}
                  <span className="qty">{formData.quantity || "0"} Units</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="compliance-tip" variants={itemVariants}>
            <FiInfo />
            <div className="text">
              <strong>Compliance Check</strong>
              <span>
                Delivery challans are required for moving goods without an
                immediate invoice.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Side: Detailed Entry Form */}
        <main className="challan-main">
          {!loading && !hasRequiredData && (
            <motion.div className="warning-block" variants={itemVariants}>
              {customers.length === 0 && (
                <div className="w-item">
                  <FiAlertTriangle /> No customers registered.
                </div>
              )}
              {categories.length === 0 && (
                <div className="w-item">
                  <FiAlertTriangle /> No product categories found.
                </div>
              )}
              {sizes.length === 0 && (
                <div className="w-item">
                  <FiAlertTriangle /> No size variants defined.
                </div>
              )}
            </motion.div>
          )}

          <motion.div className="config-card" variants={itemVariants}>
            <div className="card-header">
              <FiPackage /> <span>Order Specifications</span>
            </div>

            <form onSubmit={handleSubmit} className="challan-form">
              <div className="form-body">
                {/* Entity Selection Section */}
                <div className="form-section">
                  <div className="section-title">Receiver Details</div>
                  <div className="input-field">
                    <label>
                      <FiUser /> Bill-to Customer
                    </label>
                    <div className="input-container">
                      <select
                        name="customer"
                        value={formData.customer}
                        onChange={handleChange}
                        className={errors.customer ? "error" : ""}
                        disabled={loading || customers.length === 0}
                        required
                      >
                        <option value="">
                          {customers.length === 0
                            ? "No active customers"
                            : "Select Customer Entity"}
                        </option>
                        {customers.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.customerName ||
                              c.businessName ||
                              "Unnamed Customer"}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>
                </div>

                {/* Product Selection Section */}
                <div className="form-section">
                  <div className="section-title">Item Configuration</div>
                  <div className="input-grid">
                    <div className="input-field full-width">
                      <label>
                        <FiTag /> Product Name / Description
                      </label>
                      <div className="input-container">
                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleChange}
                          placeholder="e.g. Premium Basmati Rice 50kg"
                          className={errors.productName ? "error" : ""}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-field">
                      <label>
                        <FiGrid /> Product Category
                      </label>
                      <div className="input-container">
                        <select
                          name="productCategory"
                          value={formData.productCategory}
                          onChange={handleChange}
                          className={errors.productCategory ? "error" : ""}
                          disabled={loading || categories.length === 0}
                          required
                        >
                          <option value="">Choose Catalog</option>
                          {categories.map((cat) => (
                            <option
                              key={cat._id || cat.id}
                              value={cat._id || cat.id}
                            >
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="select-arrow" />
                      </div>
                    </div>

                    <div className="input-field">
                      <label>
                        <FiMaximize2 /> Dimension / Variant
                      </label>
                      <div className="input-container">
                        <select
                          name="productSize"
                          value={formData.productSize}
                          onChange={handleChange}
                          className={errors.productSize ? "error" : ""}
                          disabled={loading || sizes.length === 0}
                          required
                        >
                          <option value="">Select Size</option>
                          {sizes.map((sz) => (
                            <option
                              key={sz._id || sz.id}
                              value={sz._id || sz.id}
                            >
                              {sz.label || sz.size}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="select-arrow" />
                      </div>
                    </div>

                    <div className="input-field">
                      <label>
                        <FiHash /> Shipment Quantity
                      </label>
                      <div className="input-container">
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={errors.quantity ? "error" : ""}
                          disabled={loading}
                          required
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="input-field">
                      <label>
                        <FiDollarSign /> Rate (Excl. Tax)
                      </label>
                      <div className="input-container">
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.00"
                          className={errors.price ? "error" : ""}
                          disabled={loading}
                          required
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="actions-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  <FiX /> Discard
                </button>
                <button
                  type="submit"
                  className={`primary-btn ${loading ? "btn-loading" : ""}`}
                  disabled={loading || !hasRequiredData}
                >
                  {loading ? (
                    <FiLoader className="spin" />
                  ) : (
                    <>
                      <FiCheck /> Generate Delivery Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default NewChallan;
