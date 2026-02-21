import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUndo,
} from "react-icons/fa";
import purchaseService from "../../services/purchaseService";
import "./purchaseList.scss";
const PurchaseList = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
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
      const rows = data?.rows || data?.data || [];
      setPurchases(rows);

      // Calculate stats (keeping logic for now if needed elsewhere, but removed from UI)
      const newStats = rows.reduce(
        (acc, p) => {
          const amt = parseFloat(p.totalAmount || 0);
          acc.totalAmount += amt;
          if (p.status?.toLowerCase() === "paid") {
            acc.paidAmount += amt;
          } else {
            acc.pendingAmount += amt;
          }
          return acc;
        },
        {
          totalCount: rows.length,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
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
        (p.status || "paid").toLowerCase() === statusFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "purchase" && !p.isUploaded) ||
        (activeTab === "uploaded" && p.isUploaded);

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

  const totalPages = Math.ceil(filteredPurchases.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedPurchases = filteredPurchases.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  return (
    <div className="purchase-list-page">
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
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-dark"
              onClick={() => navigate("/vendor/new-purchase")}
            >
              Create New
            </button>
            <button className="btn btn-dark">Upload Bill</button>
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
                    <th>Purchase Invoice No</th>
                    <th>Purchase Type</th>
                    <th>Purchase Date</th>
                    <th>Seller Name</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.prefix || ""}
                          {p.purchaseNumber}
                        </td>
                        <td>
                          <span className="type-created">Created</span>
                        </td>
                        <td>{formatDate(p.purchaseDate)}</td>
                        <td>
                          {p.seller?.vendorName || p.Vendor?.name || "N/A"}
                        </td>
                        <td>
                          {formatCurrency(p.totalAmount).replace("₹", "")}
                        </td>
                        <td>
                          <span
                            className={`status-badge-new ${
                              p.status?.toLowerCase() || "unpaid"
                            }`}
                          >
                            {p.status || "Unpaid"}
                          </span>
                        </td>
                        <td className="action-cell">
                          <div className="action-btns-group">
                            <button
                              className="pay-btn"
                              onClick={() => handlePayClick(p)}
                            >
                              Pay
                            </button>
                            <button className="edit-btn">
                              <FaEdit />
                            </button>
                            <button className="delete-btn">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No data available
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
