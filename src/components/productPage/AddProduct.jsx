import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addProduct.scss";
import productService from "../../services/productService";
import { FiChevronsLeft } from "react-icons/fi";

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
      alert("Please fill all required fields");
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
      navigate("/vendor/product");
    } catch (error) {
      console.error("Create product error:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-header">
        <h1>
          Add Product <span className="version-badge">v2</span>
        </h1>
      </div>

      <div className="add-product-card">
        <form onSubmit={handleSave}>
          <span className="form-section-title">Product details</span>

          <div className="add-form-grid">
            <div className="form-group full-width">
              <label htmlFor="productName">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="Enter Product Name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoryId">
                Category <span className="required">*</span>
              </label>
              <select
                id="categoryId"
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

            <div className="form-group">
              <label htmlFor="sizeId">
                Size (Inch) <span className="required">*</span>
              </label>
              <select
                id="sizeId"
                name="sizeId"
                value={formData.sizeId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Size</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.inches} inch
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Base Price <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
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

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
