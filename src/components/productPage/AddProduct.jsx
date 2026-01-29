import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addProduct.scss";
import productService from "../../services/productService";

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    sizeId: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (!formData.productName || !formData.categoryId || !formData.sizeId) {
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
            price: 0,
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
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Add Product</h1>
      </div>

      <div className="page-content">
        <div className="product-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="Enter Product Name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Category</option>
                <option value="mona">Mona</option>
                <option value="banglory">Banglory</option>
                <option value="silk">Silk</option>
                <option value="cotton">Cotton</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="size">Size</label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Size(INCH)</option>
                <option value="0.5">0.5 inch</option>
                <option value="0.8">0.8 inch</option>
                <option value="1">1 inch</option>
                <option value="1.25">1.25 inch</option>
                <option value="1.5">1.5 inch</option>
                <option value="2">2 inch</option>
                <option value="2.5">2.5 inch</option>
                <option value="3">3 inch</option>
                <option value="4">4 inch</option>
                <option value="5">5 inch</option>
                <option value="8">8 inch</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
