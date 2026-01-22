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
    productCategory: "",
    productSize: "",
    productLength: "",
    price: "",
  });

  const [errors, setErrors] = useState({});

  const getVendorId = () => {
    // First check vendorData
    const vendorData = localStorage.getItem("vendorData");
    if (vendorData) {
      try {
        const parsed = JSON.parse(vendorData);
        const id = parsed.vendorId || parsed._id || parsed.id;
        if (id) {
          console.log("VendorId from vendorData:", id);
          return id;
        }
      } catch (e) {
        console.error("Error parsing vendor data:", e);
      }
    }

    // Then check userData
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const id = parsed.vendorId || parsed._id || parsed.id;
        if (id) {
          console.log("VendorId from userData:", id);
          return id;
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    console.error("VendorId not found in localStorage!");
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
        return;
      }

      console.log("Fetching data with vendorId:", vendorId);

      const [categoriesData, sizesData, customersData] = await Promise.all([
        productService.getCategories(vendorId),
        productService.getSizes(vendorId),
        customerService.getCustomers(vendorId), // FIXED: Now passing vendorId
      ]);

      console.log("Fetched Categories:", categoriesData);
      console.log("Fetched Sizes:", sizesData);
      console.log("Fetched Customers:", customersData);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setSizes(Array.isArray(sizesData) ? sizesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);

      if (!categoriesData || categoriesData.length === 0) {
        console.warn("No categories found for this vendor");
      }
      if (!sizesData || sizesData.length === 0) {
        console.warn("No sizes found for this vendor");
      }
      if (!customersData || customersData.length === 0) {
        console.warn("No customers found for this vendor");
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);

      // Better error display
      let errorMessage = "Failed to load form data";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      alert(errorMessage + ". Please check console for details.");
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
    if (!formData.productCategory) {
      newErrors.productCategory = "Please select a product category";
    }
    if (!formData.productSize) {
      newErrors.productSize = "Please select product size";
    }
    if (!formData.productLength) {
      newErrors.productLength = "Please enter product length";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        customerId: formData.customer,
        challanDate: new Date().toISOString().slice(0, 10),
        items: [
          {
            categoryId: formData.productCategory,
            sizeId: formData.productSize,
            qty: Number(formData.productLength),
            pricePerUnit: Number(formData.price),
          },
        ],
      };

      console.log("Creating challan with payload:", payload);

      const challan = await challanService.createChallan(payload);

      alert("Challan created successfully!");
      navigate(`/vendor/challan-details/${challan.id || challan._id}`);
    } catch (error) {
      console.error("Create challan error:", error);

      let errorMessage = "Failed to create challan";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-challan-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Add Challan</h1>
      </div>

      <div className="page-content">
        {!loading &&
          (!Array.isArray(customers) ||
            customers.length === 0 ||
            !Array.isArray(categories) ||
            categories.length === 0 ||
            !Array.isArray(sizes) ||
            sizes.length === 0) && (
            <div className="warning-message">
              {(!Array.isArray(customers) || customers.length === 0) && (
                <p>⚠️ No customers found. Please add customers first.</p>
              )}
              {(!Array.isArray(categories) || categories.length === 0) && (
                <p>
                  ⚠️ No product categories found. Please add categories first.
                </p>
              )}
              {(!Array.isArray(sizes) || sizes.length === 0) && (
                <p>⚠️ No product sizes found. Please add sizes first.</p>
              )}
            </div>
          )}

        <form onSubmit={handleSubmit} className="challan-form">
          <div className="form-group">
            <label htmlFor="customer">Customer *</label>
            <select
              id="customer"
              name="customer"
              value={formData.customer.rows}
              onChange={handleChange}
              className={`form-input ${errors.customer ? "error" : ""}`}
              disabled={
                loading || !Array.isArray(customers) || customers.length === 0
              }
              required
            >
              <option value="">
                {!Array.isArray(customers) || customers.length === 0
                  ? "No customers available"
                  : "Select Customer"}
              </option>
              {Array.isArray(customers) &&
                customers.map((customer) => (
                  <option
                    key={customer._id || customer.id}
                    value={customer._id || customer.id}
                  >
                    {customer.name ||
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

          <div className="form-group">
            <label htmlFor="productCategory">Product Category *</label>
            <select
              id="productCategory"
              name="productCategory"
              value={formData.productCategory}
              onChange={handleChange}
              className={`form-input ${errors.productCategory ? "error" : ""}`}
              disabled={
                loading || !Array.isArray(categories) || categories.length === 0
              }
              required
            >
              <option value="">
                {!Array.isArray(categories) || categories.length === 0
                  ? "No categories available"
                  : "Select Product Category"}
              </option>
              {Array.isArray(categories) &&
                categories.map((category) => (
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="productSize">Product Size *</label>
              <select
                id="productSize"
                name="productSize"
                value={formData.productSize}
                onChange={handleChange}
                className={`form-input ${errors.productSize ? "error" : ""}`}
                disabled={
                  loading || !Array.isArray(sizes) || sizes.length === 0
                }
                required
              >
                <option value="">
                  {!Array.isArray(sizes) || sizes.length === 0
                    ? "No sizes available"
                    : "Select Product Size"}
                </option>
                {Array.isArray(sizes) &&
                  sizes.map((size) => (
                    <option
                      key={size._id || size.id}
                      value={size._id || size.id}
                    >
                      {size.label || size.size || "Unnamed Size"}
                    </option>
                  ))}
              </select>
              {errors.productSize && (
                <span className="error-text">{errors.productSize}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="productLength">Product Length *</label>
              <input
                type="number"
                id="productLength"
                name="productLength"
                value={formData.productLength}
                onChange={handleChange}
                placeholder="Enter Product Length"
                className={`form-input ${errors.productLength ? "error" : ""}`}
                disabled={loading}
                required
                step="0.01"
                min="0"
              />
              {errors.productLength && (
                <span className="error-text">{errors.productLength}</span>
              )}
            </div>
          </div>

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

          <button
            type="submit"
            className="submit-btn"
            disabled={
              loading ||
              !Array.isArray(customers) ||
              customers.length === 0 ||
              !Array.isArray(categories) ||
              categories.length === 0 ||
              !Array.isArray(sizes) ||
              sizes.length === 0
            }
          >
            {loading ? "Generating..." : "Generate Challan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewChallan;
