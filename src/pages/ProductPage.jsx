import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../services/productService";
import "./productPage.scss";

const ProductPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await productService.getProducts();
      console.log("RAW PRODUCT API RESPONSE 👉", res);

      const productList = Array.isArray(res?.products) ? res.products : [];

      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  const getProductSize = (product) => {
    if (
      Array.isArray(product.productSizes) &&
      product.productSizes.length > 0 &&
      product.productSizes[0].size
    ) {
      return product.productSizes[0].size.inches;
    }
    return "-";
  };
  const filteredProducts = products.filter((product) => {
    const name = product.name || "";
    const category = product.category?.name || "";

    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
          {loading ? (
            <p className="page-center">Loading...</p>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">
                    {product.category?.name || "-"}
                  </p>
                </div>

                <div className="product-size">" {getProductSize(product)}</div>
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
