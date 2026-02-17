import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../services/productService";
import "./productPage.scss";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoClose } from "react-icons/io5";

const ProductPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    sizeId: "",
    price: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndSizes();
  }, []);

  const fetchCategoriesAndSizes = async () => {
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
      console.error("Error fetching categories/sizes:", error);
    }
  };

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

  const handleEditClick = (product, e) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      categoryId: product.category?.id || "",
      sizeId: product.productSizes?.[0]?.size?.id || "",
      price: product.productSizes?.[0]?.price || "",
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: "",
      sizeId: "",
      price: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const vendorData = JSON.parse(localStorage.getItem("vendorData"));

      const updateData = {
        name: formData.name,
        categoryId: formData.categoryId,
        vendorId: vendorData?.id,
        sizes: [
          {
            sizeId: formData.sizeId,
            price: parseFloat(formData.price),
          },
        ],
      };

      await productService.updateProduct(editingProduct.id, updateData);

      fetchProducts();
      handleModalClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await productService.deleteProduct(productId);
      fetchProducts();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product");
    } finally {
      setLoading(false);
    }
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

                <div className="product-details">
                  <div className="product-size">
                    {getProductSize(product)} inch
                  </div>

                  <div className="product-actions">
                    <button
                      className="edit-btn"
                      onClick={(e) => handleEditClick(product, e)}
                    >
                      <CiEdit />
                    </button>

                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteProduct(product.id, e)}
                    >
                      <CiTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close-btn" onClick={handleModalClose}>
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
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

              <div className="form-group">
                <label>Size *</label>
                <select
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
                <label>Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleModalClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
