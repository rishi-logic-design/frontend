import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addProduct.scss";

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    size: "",
  });

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

  const handleSave = () => {
    console.log("Product Data:", formData);
    // Add your save logic here
    navigate("/vendor/product");
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
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
