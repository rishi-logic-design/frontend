import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../services/productService";
import "./productPage.scss";
import { CiEdit, CiTrash } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import {
  FiSearch,
  FiUpload,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
} from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";

const ROWS_OPTIONS = [10, 20, 50, 100];

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[0]);

  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    sizeId: "",
    price: "",
  });

  const searchTimer = useRef(null);

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

  const getProductPrice = (product) => {
    if (
      Array.isArray(product.productSizes) &&
      product.productSizes.length > 0
    ) {
      return product.productSizes[0].price || 0;
    }
    return 0;
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredProducts = products.filter((product) => {
    const name = product.name || "";
    const category = product.category?.name || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handleEditClick = (product, e) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      categoryId: product.category?.id || "",
      sizeId: product.productSizes?.[0]?.size?.id || "",
      price: product.productSizes?.[0]?.price || "",
    });
    setShowEditDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowEditDrawer(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      handleDrawerClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
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
      <div className="product-header">
        <h1>
          Products <span className="version-badge">v2</span>
        </h1>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="toolbar-actions">
          <button className="action-btn upload-btn" onClick={() => {}}>
            <FiUpload /> <span>Bulk Import</span>
          </button>
          <button className="action-btn excel-btn" onClick={() => {}}>
            <RiFileExcel2Line /> <span>Export (xslx)</span>
          </button>
          <button
            className="action-btn add-btn"
            onClick={() => navigate("/vendor/add-product")}
          >
            <FiPlus /> <span>Create Product</span>
          </button>
        </div>
      </div>

      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Size (Inch)</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  Loading products...
                </td>
              </tr>
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <tr key={product.id}>
                  <td className="name-cell">{product.name}</td>
                  <td className="category-cell">
                    {product.category?.name || "—"}
                  </td>
                  <td>{getProductSize(product)}</td>
                  <td className="price-cell">₹{getProductPrice(product)}</td>
                  <td className="action-cell">
                    <button
                      className="icon-btn edit-icon-btn"
                      onClick={(e) => handleEditClick(product, e)}
                    >
                      <CiEdit />
                    </button>
                    <button
                      className="icon-btn delete-icon-btn"
                      onClick={(e) => handleDeleteProduct(product.id, e)}
                    >
                      <CiTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="product-pagination">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {ROWS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="page-info">
              {totalItems > 0
                ? `${startIndex + 1}-${endIndex} of ${totalItems}`
                : "0-0 of 0"}
            </span>
          </div>
          <div className="pagination-controls">
            <div className="nav-btns">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft />
              </button>
              <button className="active">{currentPage}</button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditDrawer && (
        <div className="drawer-overlay" onClick={handleDrawerClose}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={handleDrawerClose}>
                <IoClose />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="drawer-form">
              <div className="form-group">
                <label>
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Category <span className="required">*</span>
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
              <div className="form-group">
                <label>
                  Size <span className="required">*</span>
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
                      {size.inches} inch
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Price <span className="required">*</span>
                </label>
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
              <div className="drawer-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleDrawerClose}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
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
