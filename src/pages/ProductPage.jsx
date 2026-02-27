import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import productService from "../services/productService";
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiUpload,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiX,
  FiFilter,
  FiLoader,
  FiGrid,
  FiPackage,
} from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";
import { toast } from "react-toastify";
import "./productPage.scss";

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
    if (e) e.stopPropagation();
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

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const vendorData = JSON.parse(localStorage.getItem("vendorData"));
      const updateData = {
        name: formData.name,
        categoryId: formData.categoryId,
        vendorId: vendorData?.id,
        sizes: [{ sizeId: formData.sizeId, price: parseFloat(formData.price) }],
      };
      await productService.updateProduct(editingProduct.id, updateData);
      toast.success("Product updated successfully");
      fetchProducts();
      handleDrawerClose();
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        "Permanent Action: Are you sure you want to delete this product?",
      )
    )
      return;
    try {
      setLoading(true);
      await productService.deleteProduct(productId);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="product-page-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="header-bar">
        <div className="title-area">
          <h1>
            Inventory Repository{" "}
            <span className="count-badge">{totalItems} Products</span>
          </h1>
          <p>Manage your product catalog, pricing, and stock variants.</p>
        </div>
        <div className="toolbar-actions">
          <button className="btn import-btn">
            <FiUpload /> Bulk Import
          </button>
          <button className="btn export-btn">
            <RiFileExcel2Line /> Export
          </button>
          <button
            className="btn create-btn"
            onClick={() => navigate("/vendor/add-product")}
          >
            <FiPlus /> New Product
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, category, or SKU..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button className="filter-btn">
          <FiFilter />
        </button>
      </div>

      <div className="table-card">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product Identification</th>
              <th>Collection / Category</th>
              <th>Dimension (Inch)</th>
              <th>Market Price</th>
              <th style={{ textAlign: "right" }}>Management</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div style={{ padding: "60px", textAlign: "center" }}>
                    <FiLoader className="spin" /> Cataloging Products...
                  </div>
                </td>
              </tr>
            ) : currentProducts.length > 0 ? (
              <AnimatePresence>
                {currentProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="name-cell">
                      <span className="p-name">{product.name}</span>
                      <span className="p-id">
                        ID: {String(product.id).slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="category-cell">
                      <span className="cat-badge">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td>{getProductSize(product)}'</td>
                    <td className="price-cell">₹{getProductPrice(product)}</td>
                    <td className="action-cell">
                      <div className="action-btns"> 
                        <button
                          className="edit"
                          onClick={(e) => handleEditClick(product, e)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="delete"
                          onClick={(e) => handleDeleteProduct(product.id, e)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <tr>
                <td colSpan="5">
                  <div style={{ padding: "60px", textAlign: "center" }}>
                    No products match your criteria.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination-footer">
          <div className="page-left">
            <span>Display rows</span>
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
            <span>
              {totalItems > 0
                ? `${startIndex + 1}-${endIndex} of ${totalItems}`
                : "0 items"}
            </span>
          </div>
          <div className="page-right">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <FiChevronLeft />
            </button>
            <button className="active">{currentPage}</button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <AnimatePresence>
        {showEditDrawer && (
          <div className="drawer-overlay" onClick={handleDrawerClose}>
            <motion.div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="drawer-header">
                <h2>Product Details</h2>
                <button className="close-btn" onClick={handleDrawerClose}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="drawer-form">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category Assignment</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    required
                  >
                    <option value="">Choose Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Base Size (Dimension)</label>
                  <select
                    name="sizeId"
                    value={formData.sizeId}
                    onChange={(e) =>
                      setFormData({ ...formData, sizeId: e.target.value })
                    }
                    required
                  >
                    <option value="">Choose Size</option>
                    {sizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.inches} Inch
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Selling Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
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
                    Discard
                  </button>
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <FiLoader className="spin" /> : "Update Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductPage;
