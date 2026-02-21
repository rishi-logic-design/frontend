import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import purchaseService from "../../services/purchaseService";
import "./purchaseList.scss";
const PurchaseList = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    partialCount: 0,
  });
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getPurchases({ size: 1000 });
      const rows = data?.data?.rows || data?.rows || data?.data || [];
      if (!Array.isArray(rows)) {
        console.error("Purchases is not an array:", rows);
        setPurchases([]);
        return;
      }
      setPurchases(rows);

      const newStats = rows.reduce(
        (acc, p) => {
          const amt = parseFloat(p.totalAmount || 0);
          const paid = parseFloat(p.paidAmount || 0);
          acc.totalAmount += amt;
          acc.paidAmount += paid;
          acc.pendingAmount += amt - paid;

          const status = (p.status || "unpaid").toLowerCase();
          if (status === "paid") acc.paidCount++;
          else if (status === "partial") acc.partialCount++;
          else acc.unpaidCount++;

          return acc;
        },
        {
          totalCount: rows.length,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          partialCount: 0,
          unpaidCount: 0,
        },
      );
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPurchases = purchases
    .filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      const vendorName = p.seller?.vendorName || p.Vendor?.name || "";
      const matchesSearch =
        !searchTerm ||
        (p.purchaseNumber || "").toLowerCase().includes(searchLower) ||
        vendorName.toLowerCase().includes(searchLower) ||
        (p.prefix || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ||
        (p.status || "unpaid").toLowerCase() === statusFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "purchase" && !p.isUploaded && !p.billUrl) ||
        (activeTab === "uploaded" && (p.isUploaded || !!p.billUrl));

      return matchesSearch && matchesStatus && matchesTab;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc")
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      if (sortBy === "date-asc")
        return new Date(a.purchaseDate) - new Date(b.purchaseDate);
      if (sortBy === "amount-desc")
        return parseFloat(b.totalAmount) - parseFloat(a.totalAmount);
      if (sortBy === "amount-asc")
        return parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
      return 0;
    });

  const handlePayClick = (purchase) => {
    navigate("/vendor/add-payment-made", { state: { purchase } });
  };

  const [modal, setModal] = useState({
    show: false,
    type: "confirm",
    message: "",
    onConfirm: null,
  });

  const handleDelete = async (id) => {
    setModal({
      show: true,
      type: "confirm",
      message:
        "Are you sure you want to delete this purchase? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await purchaseService.deletePurchase(id);
          setModal({
            show: true,
            type: "success",
            message: "Purchase deleted successfully!",
          });
          fetchPurchases();
        } catch (error) {
          setModal({
            show: true,
            type: "error",
            message: error.message || "Failed to delete purchase",
          });
        }
      },
    });
  };

  const totalPages = Math.ceil(filteredPurchases.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedPurchases = filteredPurchases.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  return (
    <div className="purchase-list-page">
      {modal.show && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal ${modal.type}`}>
            <h3>
              {modal.type === "confirm"
                ? "Confirm Delete"
                : modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}
            </h3>
            <p>{modal.message}</p>
            <div className="modal-actions">
              {modal.type === "confirm" ? (
                <>
                  <button
                    className="cancel-btn"
                    onClick={() => setModal({ ...modal, show: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="confirm-btn red"
                    onClick={() => {
                      modal.onConfirm();
                      setModal({ ...modal, show: false });
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  className="close-btn"
                  onClick={() => setModal({ ...modal, show: false })}
                >
                  Ok
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-header-container">
        <div className="header-info">
          <h1>Purchase Management</h1>
          <p>Track and manage your vendor purchase bills and payments</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-dark"
            onClick={() => navigate("/vendor/new-purchase")}
          >
            + Create New Purchase
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/vendor/upload-purchase")}
          >
            Upload Bill
          </button>
        </div>
      </div>

      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Total Purchases</span>
            <h3 className="value">{stats.totalCount}</h3>
          </div>
          <div className="stat-icon total">
            <FaSearch />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Total Amount</span>
            <h3 className="value">{formatCurrency(stats.totalAmount)}</h3>
          </div>
          <div className="stat-icon amount">₹</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Paid Amount</span>
            <h3 className="value positive">
              {formatCurrency(stats.paidAmount)}
            </h3>
          </div>
          <div className="stat-icon paid">✓</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Pending Balance</span>
            <h3 className="value negative">
              {formatCurrency(stats.pendingAmount)}
            </h3>
          </div>
          <div className="stat-icon pending">!</div>
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`tab-btn ${activeTab === "purchase" ? "active" : ""}`}
          onClick={() => setActiveTab("purchase")}
        >
          Purchase Bill
        </button>
        <button
          className={`tab-btn ${activeTab === "uploaded" ? "active" : ""}`}
          onClick={() => setActiveTab("uploaded")}
        >
          Uploaded Bill
        </button>
      </div>

      <div className="main-content-card">
        <div className="toolbar-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search Invoice, Seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="purchase-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Seller Name</th>
                    <th>Total (₹)</th>
                    <th>Paid (₹)</th>
                    <th>Balance (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((p) => {
                      const isPaid = (p.status || "").toLowerCase() === "paid";
                      const totalAmt = parseFloat(p.totalAmount || 0);
                      const paidAmt = parseFloat(p.paidAmount || 0);
                      const balance = parseFloat(
                        p.pendingAmount ?? totalAmt - paidAmt,
                      );

                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="inv-no">
                              {p.prefix || ""}
                              {p.purchaseNumber}
                            </span>
                          </td>
                          <td>{formatDate(p.purchaseDate)}</td>
                          <td className="seller-name">
                            {p.seller?.vendorName || p.Vendor?.name || "N/A"}
                          </td>
                          <td className="amt-cell">
                            {formatCurrency(totalAmt).replace("₹", "")}
                          </td>
                          <td className="amt-cell text-success">
                            {formatCurrency(paidAmt).replace("₹", "")}
                          </td>
                          <td
                            className={`amt-cell ${balance > 0 ? "text-danger" : ""}`}
                          >
                            {formatCurrency(balance).replace("₹", "")}
                          </td>
                          <td>
                            <span
                              className={`status-badge-new ${(
                                p.status || "unpaid"
                              ).toLowerCase()}`}
                            >
                              {p.status || "unpaid"}
                            </span>
                          </td>
                          <td className="action-cell">
                            <div className="action-btns-group">
                              {!isPaid && (
                                <button
                                  className="pay-btn"
                                  onClick={() => handlePayClick(p)}
                                >
                                  Pay
                                </button>
                              )}
                              <button className="edit-btn" title="Edit">
                                <FaEdit />
                              </button>
                              <button
                                className="delete-btn"
                                title="Delete"
                                onClick={() => handleDelete(p.id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        No purchase records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="table-footer">
          <div className="rows-selector">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="page-nav-btn"
            >
              {"<"}
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="page-nav-btn"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;
