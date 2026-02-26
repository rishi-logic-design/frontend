import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaFilter,
  FaSortAlphaDown,
  FaPencilAlt,
  FaTrash,
  FaPlus,
  FaBox,
  FaExclamationTriangle,
  FaRupeeSign,
} from "react-icons/fa";
import { toast } from "react-toastify";
import inventoryService from "../services/inventoryService";
import AddItemDrawer from "./AddItemDrawer";
import AddCategoryModal from "./AddCategoryModal";
import "./inventory.scss";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    stockValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [sortOrder, setSortOrder] = useState("A-Z"); // A-Z, Z-A, High Stock, Low Stock
  const [filterCategory, setFilterCategory] = useState("All");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-btn")) {
        setShowSortDropdown(false);
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, sortOrder, activeTab, pageSize]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes, statsRes] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getCategories(),
        inventoryService.getStats(),
      ]);

      if (itemsRes.success) {
        setProducts(itemsRes.data.items || []);
      }
      if (catRes.success) {
        setCategories(catRes.data || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        salePrice: Number(formData.salePrice),
        purchasePrice: Number(formData.purchasePrice),
        openingStock: Number(formData.openingStock),
        unit: formData.unit,
        gst: formData.gst,
        hsn: formData.hsn,
        categoryId: categories.find((c) => c.name === formData.category)?.id,
        customFields: formData.customFields || [],
      };

      if (editingItem) {
        await inventoryService.updateItem(editingItem.id, payload);
      } else {
        await inventoryService.createItem(payload);
      }

      setIsDrawerOpen(false);
      setEditingItem(null);
      fetchProducts();
      toast.success(
        `${formData.name} has been ${editingItem ? "updated" : "added"}.`,
      );
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(error.message || "Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (catData) => {
    try {
      setLoading(true);
      if (editingCategory) {
        await inventoryService.updateCategory(editingCategory.id, catData);
      } else {
        await inventoryService.createCategory(catData);
      }
      fetchProducts();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      toast.success(
        `Category "${catData.name}" has been ${editingCategory ? "updated" : "created"}.`,
      );
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setLoading(true);
      await inventoryService.deleteItem(id);
      fetchProducts();
      toast.success("Item deleted successfully.");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.message || "Failed to delete item.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? (Only empty categories can be deleted)",
      )
    )
      return;
    try {
      setLoading(true);
      await inventoryService.deleteCategory(id);
      fetchProducts();
      toast.success("Category deleted successfully.");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    activeTab === "all"
      ? products
          .filter(
            (p) =>
              (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) &&
              (filterCategory === "All" || p.category?.name === filterCategory),
          )
          .sort((a, b) => {
            if (sortOrder === "A-Z")
              return (a.name || "").localeCompare(b.name || "");
            if (sortOrder === "Z-A")
              return (b.name || "").localeCompare(a.name || "");
            if (sortOrder === "High Stock")
              return (b.currentStock || 0) - (a.currentStock || 0);
            if (sortOrder === "Low Stock")
              return (a.currentStock || 0) - (b.currentStock || 0);
            return 0;
          })
      : categories.filter((c) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  const totalEntries = filteredProducts.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredProducts.slice(
    startIndex,
    startIndex + pageSize,
  );

  return (
    <div className="inventory-page">
      <div className="page-top-header">
        <div className="title-area">
          <h1>
            Inventory <span className="version-badge">v2</span>
          </h1>
        </div>
      </div>

      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon box">
            <FaBox />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{stats.totalItems || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{stats.lowStock || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon money">
            <FaRupeeSign />
          </div>
          <div className="stat-info">
            <span className="stat-label">Stock Value</span>
            <span className="stat-value">
              ₹{(stats.stockValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="inventory-header">
        <div className="tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Items
          </button>
          <button
            className={activeTab === "category" ? "active" : ""}
            onClick={() => setActiveTab("category")}
          >
            Category Wise
          </button>
        </div>
      </div>

      <div className="inventory-card">
        <div className="toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="actions">
            {activeTab === "all" ? (
              <>
                <div
                  className="dropdown-btn"
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowFilterDropdown(false);
                  }}
                >
                  <FaSortAlphaDown /> {sortOrder}{" "}
                  <span className="arrow">▼</span>
                  {showSortDropdown && (
                    <div className="dropdown-menu">
                      <div
                        onClick={() => {
                          setSortOrder("A-Z");
                          setShowSortDropdown(false);
                        }}
                      >
                        Item Name A-Z
                      </div>
                      <div
                        onClick={() => {
                          setSortOrder("Z-A");
                          setShowSortDropdown(false);
                        }}
                      >
                        Item Name Z-A
                      </div>
                      <div
                        onClick={() => {
                          setSortOrder("High Stock");
                          setShowSortDropdown(false);
                        }}
                      >
                        High Stock
                      </div>
                      <div
                        onClick={() => {
                          setSortOrder("Low Stock");
                          setShowSortDropdown(false);
                        }}
                      >
                        Low Stock
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className="dropdown-btn"
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowSortDropdown(false);
                  }}
                >
                  <FaFilter /> {filterCategory} <span className="arrow">▼</span>
                  {showFilterDropdown && (
                    <div className="dropdown-menu">
                      <div
                        onClick={() => {
                          setFilterCategory("All");
                          setShowFilterDropdown(false);
                        }}
                      >
                        All Categories
                      </div>
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setFilterCategory(cat.name);
                            setShowFilterDropdown(false);
                          }}
                        >
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn-add-item-dark"
                  onClick={() => {
                    setEditingItem(null);
                    setIsDrawerOpen(true);
                  }}
                >
                  Add Items
                </button>
              </>
            ) : (
              <button
                className="btn-add-category-dark"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
              >
                Add Category
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              {activeTab === "all" ? (
                <tr>
                  <th width="30%">Item Name</th>
                  <th width="12%">Stock Value</th>
                  <th width="12%">Purchase Price</th>
                  <th width="12%">Sales Price</th>
                  <th width="15%">Stock In Hand</th>
                  <th width="19%">Action</th>
                </tr>
              ) : (
                <tr>
                  <th width="40%">Category</th>
                  <th width="30%">Stock</th>
                  <th width="30%">Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={activeTab === "all" ? "6" : "3"}
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, idx) =>
                  activeTab === "all" ? (
                    <tr key={item._id || item.id || idx}>
                      <td className="item-name">{item.name}</td>
                      <td>₹{(item.stockValue || 0).toLocaleString()}</td>
                      <td>₹{(item.purchasePrice || 0).toLocaleString()}</td>
                      <td>₹{(item.salePrice || 0).toLocaleString()}</td>
                      <td>
                        {item.currentStock || 0} {item.unit || ""}
                      </td>
                      <td>
                        <div className="action-icons">
                          <div
                            className="icon-circle"
                            title="Edit"
                            onClick={() => {
                              setEditingItem(item);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <FaPencilAlt />
                          </div>
                          <div
                            className="icon-circle delete"
                            title="Delete"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <FaTrash />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id || idx}>
                      <td>{item.name}</td>
                      <td>{item.stock || 0}</td>
                      <td>
                        <div className="action-icons">
                          <div
                            className="icon-circle"
                            title="Edit"
                            onClick={() => {
                              setEditingCategory(item);
                              setIsCategoryModalOpen(true);
                            }}
                          >
                            <FaPencilAlt />
                          </div>
                          <div
                            className="icon-circle delete"
                            title="Delete"
                            onClick={() => handleDeleteCategory(item.id)}
                          >
                            <FaTrash />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td colSpan={activeTab === "all" ? "7" : "3"}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="footer">
          <div className="pagination-info">
            <div className="page-size">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span>
              Show {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + pageSize, totalEntries)} of {totalEntries}{" "}
              entries
            </span>
          </div>

          <div className="pagination">
            <button
              className="page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              &lt;
            </button>
            {Array.from(
              { length: Math.ceil(totalEntries / pageSize) },
              (_, i) => i + 1,
            )
              .filter((page) => {
                const totalPages = Math.ceil(totalEntries / pageSize);
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (page >= currentPage - 1 && page <= currentPage + 1)
                  return true;
                return false;
              })
              .map((page, index, array) => {
                const totalPages = Math.ceil(totalEntries / pageSize);
                return (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="pagination-ellipsis">...</span>
                    )}
                    <button
                      className={currentPage === page ? "active" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
            <button
              className="page-nav"
              disabled={
                currentPage === Math.ceil(totalEntries / pageSize) ||
                totalEntries === 0
              }
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <AddItemDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        categories={categories}
        initialData={editingItem}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />
    </div>
  );
};

export default Inventory;
