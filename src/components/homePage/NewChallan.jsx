import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import challanService from "../../services/challanService";
import productService from "../../services/productService";
import customerService from "../../services/customerService";
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
        console.log("Vendor ID not found. Please login again.");
        navigate("/login");
        return;
      }

      const [categoriesData, sizesData, customersData] = await Promise.all([
        productService.getCategories(vendorId),
        productService.getSizes(vendorId),
        customerService.getCustomers(vendorId),
      ]);

      let customersList = [];
      if (customersData?.rows && Array.isArray(customersData.rows)) {
        customersList = customersData.rows;
      } else if (Array.isArray(customersData)) {
        customersList = customersData;
      }

      let categoriesList = [];
      if (categoriesData?.data && Array.isArray(categoriesData.data)) {
        categoriesList = categoriesData.data;
      } else if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData;
      }

      let sizesList = [];
      if (sizesData?.data && Array.isArray(sizesData.data)) {
        sizesList = sizesData.data;
      } else if (Array.isArray(sizesData)) {
        sizesList = sizesData;
      }

      setCustomers(customersList);
      setCategories(categoriesList);
      setSizes(sizesList);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = "Please select a customer";
    }
    if (!formData.productName.trim()) {
      newErrors.productName = "Please enter product name";
    }
    if (!formData.productCategory) {
      newErrors.productCategory = "Please select a product category";
    }
    if (!formData.productSize) {
      newErrors.productSize = "Please select product size";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const selectedSize = sizes.find(
        (sz) => String(sz._id || sz.id) === String(formData.productSize),
      );

      console.log(selectedSize);

      if (!selectedSize) {
        console.log("Size not found! Please select again.");
        return;
      }

      const sizeName = selectedSize.label || selectedSize.size || "";

      const payload = {
        customerId: formData.customer,
        challanDate: new Date().toISOString().slice(0, 10),
        items: [
          {
            productId: formData.productCategory,
            productName: formData.productName.trim(),
            categoryId: formData.productCategory,
            size: sizeName,
            qty: Number(formData.quantity),
            pricePerUnit: Number(formData.price),
            gstPercent: 5,
          },
        ],
      };

      console.log("Creating challan with payload:", payload);

      const challan = await challanService.createChallan(payload);

      console.log("Challan created successfully!");
      navigate(`/vendor/challan-details/${challan.id || challan._id}`);
    } catch (error) {
      console.error("Create challan error:", error);

      let errorMessage = "Failed to create challan";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      console.log(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredData =
    customers.length > 0 && categories.length > 0 && sizes.length > 0;

  return (
    <div className="new-challan-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Add Challan</h1>
      </div>

      <div className="page-content">
        {!loading && !hasRequiredData && (
          <div className="warning-message">
            {customers.length === 0 && (
              <p>⚠️ No customers found. Please add customers first.</p>
            )}
            {categories.length === 0 && (
              <p>
                ⚠️ No product categories found. Please add categories first.
              </p>
            )}
            {sizes.length === 0 && (
              <p>⚠️ No product sizes found. Please add sizes first.</p>
            )}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Loading form data...
          </div>
        )}

        <form onSubmit={handleSubmit} className="challan-form">
          <div className="form-group">
            <label htmlFor="customer">Customer *</label>
            <select
              id="customer"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              className={`form-input ${errors.customer ? "error" : ""}`}
              disabled={loading || customers.length === 0}
              required
            >
              <option value="">
                {customers.length === 0
                  ? "No customers available"
                  : "Select Customer"}
              </option>
              {customers.map((customer) => (
                <option
                  key={customer._id || customer.id}
                  value={customer._id || customer.id}
                >
                  {customer.customerName ||
                    customer.name ||
                    customer.businessName ||
                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    "Unnamed Customer"}
                </option>
              ))}
            </select>
            {errors.customer && (
              <span className="error-text">{errors.customer}</span>
            )}
          </div>

          {/* Product Name Input */}
          <div className="form-group">
            <label htmlFor="productName">Product Name *</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="Enter product name (e.g., Gold Milk 1L)"
              className={`form-input ${errors.productName ? "error" : ""}`}
              disabled={loading}
              required
            />
            {errors.productName && (
              <span className="error-text">{errors.productName}</span>
            )}
          </div>

          {/* Product Category Selection */}
          <div className="form-group">
            <label htmlFor="productCategory">Product Category *</label>
            <select
              id="productCategory"
              name="productCategory"
              value={formData.productCategory}
              onChange={handleChange}
              className={`form-input ${errors.productCategory ? "error" : ""}`}
              disabled={loading || categories.length === 0}
              required
            >
              <option value="">
                {categories.length === 0
                  ? "No categories available"
                  : "Select Product Category"}
              </option>
              {categories.map((category) => (
                <option
                  key={category._id || category.id}
                  value={category._id || category.id}
                >
                  {category.name || "Unnamed Category"}
                </option>
              ))}
            </select>
            {errors.productCategory && (
              <span className="error-text">{errors.productCategory}</span>
            )}
          </div>

          {/* Product Size and Quantity Row */}
          <div className="form-row">
            {/* Product Size Selection */}
            <div className="form-group">
              <label htmlFor="productSize">Product Size *</label>
              <select
                id="productSize"
                name="productSize"
                value={formData.productSize}
                onChange={handleChange}
                className={`form-input ${errors.productSize ? "error" : ""}`}
                disabled={loading || sizes.length === 0}
                required
              >
                <option value="">
                  {sizes.length === 0
                    ? "No sizes available"
                    : "Select Product Size"}
                </option>
                {sizes.map((size) => (
                  <option key={size._id || size.id} value={size._id || size.id}>
                    {size.label || size.size || "Unnamed Size"}
                  </option>
                ))}
              </select>
              {errors.productSize && (
                <span className="error-text">{errors.productSize}</span>
              )}
            </div>

            {/* Quantity Input */}
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter Quantity"
                className={`form-input ${errors.quantity ? "error" : ""}`}
                disabled={loading}
                required
                step="0.01"
                min="0"
              />
              {errors.quantity && (
                <span className="error-text">{errors.quantity}</span>
              )}
            </div>
          </div>

          {/* Price Input */}
          <div className="form-group">
            <label htmlFor="price">Price (without GST) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price without GST"
              className={`form-input ${errors.price ? "error" : ""}`}
              disabled={loading}
              required
              step="0.01"
              min="0"
            />
            {errors.price && <span className="error-text">{errors.price}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !hasRequiredData}
          >
            {loading ? "Generating..." : "Generate Challan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewChallan;
