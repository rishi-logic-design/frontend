import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiPackage,
  FiCheck,
  FiX,
  FiTag,
  FiMaximize2,
  FiDollarSign,
  FiLoader,
  FiInfo,
  FiBriefcase,
  FiGrid,
} from "react-icons/fi";
import productService from "../../services/productService";
import { toast } from "react-toastify";
import "./addProduct.scss";

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    sizeId: "",
    price: "",
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const vendorData = JSON.parse(localStorage.getItem("vendorData"));
      const vendorId = vendorData?.id;

      const [categoriesRes, sizesRes] = await Promise.all([
        productService.getCategories(vendorId),
        productService.getSizes(vendorId),
      ]);

      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      setSizes(Array.isArray(sizesRes) ? sizesRes : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (
      !formData.productName ||
      !formData.categoryId ||
      !formData.sizeId ||
      !formData.price
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.productName,
        categoryId: Number(formData.categoryId),
        productSizes: [
          {
            sizeId: Number(formData.sizeId),
            price: parseFloat(formData.price),
            stock: 0,
          },
        ],
      };

      await productService.createProduct(payload);
      toast.success("New product registered successfully!");
      navigate("/vendor/product");
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Failed to register new product");
    } finally {
      setLoading(false);
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
      className="add-product-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Bar */}
      <div className="header-bar">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/product")}
        >
          <FiArrowLeft /> <span>Inventory</span>
        </button>
        <div className="title-group">
          <h1 className="title">Register New Stock</h1>
          <p className="subtitle">
            Onboard a new item into your digital warehouse.
          </p>
        </div>
      </div>

      <div className="onboarding-layout">
        {/* Left Aspect - Summary/Preview */}
        <aside className="onboarding-aside">
          <motion.div className="preview-hero" variants={itemVariants}>
            <div className="icon-box">
              <FiPackage />
            </div>
            <h3>Item Identification</h3>
            <p>
              Registering products accurately ensures seamless billing and
              inventory tracking.
            </p>

            <div className="live-preview-card">
              <div className="preview-header">LIVE PREVIEW</div>
              <div className="p-card">
                <div className="p-badge">NEW ITEM</div>
                <strong>{formData.productName || "Unnamed Product"}</strong>
                <div className="p-details">
                  <span>
                    Cat:{" "}
                    {categories.find((c) => c.id == formData.categoryId)
                      ?.name || "N/A"}
                  </span>
                  <span>
                    Size:{" "}
                    {sizes.find((s) => s.id == formData.sizeId)?.inches || "0"}"
                  </span>
                </div>
                <div className="p-price">₹{formData.price || "0.00"}</div>
              </div>
            </div>
          </motion.div>

          <motion.div className="onboarding-tip" variants={itemVariants}>
            <FiInfo />
            <div className="text">
              <strong>Catalog Note</strong>
              <span>
                Prices can be adjusted later within the product repository
                section.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Aspect - Registration Form */}
        <main className="onboarding-main">
          <motion.div className="config-card" variants={itemVariants}>
            <div className="card-header">
              <FiBriefcase /> <span>Product Specifications</span>
            </div>

            <form onSubmit={handleSave} className="registration-form">
              <div className="form-body">
                <div className="input-group full">
                  <label>
                    <FiTag /> Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g. Premium Silk Texture V2"
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label>
                      <FiGrid /> Collection / Category
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>
                      <FiMaximize2 /> Dimension (Inches)
                    </label>
                    <select
                      name="sizeId"
                      value={formData.sizeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Size</option>
                      {sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.inches} Inch
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>
                      <FiDollarSign /> Base Unit Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="actions-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate("/vendor/product")}
                >
                  <FiX /> Discard
                </button>
                <button
                  type="submit"
                  className={`primary-btn ${loading ? "btn-loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <FiLoader className="spin" />
                  ) : (
                    <>
                      <FiCheck /> Complete Registration
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

export default AddProduct;
