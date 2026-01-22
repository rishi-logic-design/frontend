import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./productPage.scss";

const ProductPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [products] = useState([
    {
      id: 1,
      name: "Mona Silk Touch",
      category: "Mona",
      size: "1.5 inch",
    },
    {
      id: 2,
      name: "Premium Banglory Shine",
      category: "Banglory",
      size: "2.5 inch",
    },
    {
      id: 3,
      name: "SoftWeave Mona",
      category: "Mona",
      size: "1 inch",
    },
    {
      id: 4,
      name: "Mona Spark Luxe",
      category: "Mona",
      size: "1.5 inch",
    },
    {
      id: 5,
      name: "Crystal Mona Texture",
      category: "Mona",
      size: "0.80 inch",
    },
    {
      id: 6,
      name: "Gold Banglory Texture",
      category: "Banglory",
      size: "1.25 inch",
    },
    {
      id: 7,
      name: "Luxury Banglory Fabric",
      category: "Banglory",
      size: "2 inch",
    },
    {
      id: 8,
      name: "Premium Banglory Shine",
      category: "Banglory",
      size: "8 inch",
    },
  ]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddProduct = () => {
    navigate("/vendor/add-product");
  };

  return (
    <div className="product-page">
      <div className="page-header">
        <h1 className="page-title">Product</h1>
        <button className="add-btn" onClick={handleAddProduct}>
          +
        </button>
      </div>

      <div className="page-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Product"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="products-list">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                </div>
                <div className="product-size">{product.size}</div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
