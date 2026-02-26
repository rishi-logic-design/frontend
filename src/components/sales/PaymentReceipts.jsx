import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaSort,
  FaDownload,
  FaEllipsisV,
  FaEdit,
  FaPrint,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import paymentService from "../../services/paymentService";
import { toast } from "react-toastify";
import "./paymentReceipts.scss";

const PaymentReceipts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    cashAmount: 0,
    chequeAmount: 0,
    upiAmount: 0,
    netBankingAmount: 0,
    totalCount: 0,
    cashCount: 0,
    chequeCount: 0,
    upiCount: 0,
    netBankingCount: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments({ limit: 1000, page: 1 });
      const list = data?.rows || data?.data || data || [];
      setPayments(list);
      calculateStats(list);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments. Please try again.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    const s = {
      totalAmount: 0,
      cashAmount: 0,
      chequeAmount: 0,
      upiAmount: 0,
      netBankingAmount: 0,
      totalCount: list.length,
      cashCount: 0,
      chequeCount: 0,
      upiCount: 0,
      netBankingCount: 0,
    };
    list.forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      s.totalAmount += amt;
      const mode = (p.method || "").toLowerCase();
      if (mode === "cash") {
        s.cashAmount += amt;
        s.cashCount++;
      } else if (mode === "cheque") {
        s.chequeAmount += amt;
        s.chequeCount++;
      } else if (mode === "upi" || mode === "online") {
        s.upiAmount += amt;
        s.upiCount++;
      } else {
        s.netBankingAmount += amt;
        s.netBankingCount++;
      }
    });
    setStats(s);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filtered = payments
    .filter((p) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (p.partyName || "").toLowerCase().includes(search) ||
        (p.receiptNumber || "").toString().includes(search);
      const mode = (p.method || "").toLowerCase();
      const matchesMode =
        paymentModeFilter === "all" || mode.includes(paymentModeFilter);
      return matchesSearch && matchesMode;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc")
        return (
          new Date(b.paymentDate || b.createdAt) -
          new Date(a.paymentDate || a.createdAt)
        );
      if (sortBy === "date-asc")
        return (
          new Date(a.paymentDate || a.createdAt) -
          new Date(b.paymentDate || b.createdAt)
        );
      if (sortBy === "amount-desc")
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      if (sortBy === "amount-asc")
        return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="payment-receipts-page">
      <div className="receipts-header">
        <div className="header-left">
          <h1 className="page-title">Payment Receipts</h1>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            <FaCalendarAlt /> <span>01/04/2025 → 31/03/2026</span>
          </div>
          <button
            className="create-btn"
            onClick={() => navigate("/vendor/add-payment")}
          >
            <FaPlus /> <span>Record Payment</span>
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div
            className={`stat-card ${paymentModeFilter === "all" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("all")}
          >
            <span className="stat-label">All ({stats.totalCount})</span>
            <span className="stat-value">
              ₹{stats.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "cash" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("cash")}
          >
            <span className="stat-label">Cash ({stats.cashCount})</span>
            <span className="stat-value">
              ₹{stats.cashAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "upi" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("upi")}
          >
            <span className="stat-label">UPI ({stats.upiCount})</span>
            <span className="stat-value">
              ₹{stats.upiAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "cheque" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("cheque")}
          >
            <span className="stat-label">Cheque ({stats.chequeCount})</span>
            <span className="stat-value">
              ₹{stats.chequeAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      <div className="main-card">
        <div className="search-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by receipt no or party name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            <button
              className="filter-btn"
              onClick={() => setShowSort(!showSort)}
            >
              <FaSort /> Sort by
            </button>
          </div>
        </div>

        <div className="receipts-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <table className="receipts-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((p) => (
                    <tr key={p._id || p.id}>
                      <td className="receipt-no">
                        {p.receiptNumber || p.id || "N/A"}
                      </td>
                      <td>{formatDate(p.paymentDate || p.createdAt)}</td>
                      <td>
                        {p.partyName || p.customer?.customerName || "N/A"}
                      </td>
                      <td className="amount">
                        ₹{(parseFloat(p.amount) || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className="payment-mode-badge">
                          {p.method || "N/A"}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="icon-btn"
                            onClick={() =>
                              navigate(
                                `/vendor/add-payment?paymentId=${p._id || p.id}`,
                              )
                            }
                          >
                            <FaEdit />
                          </button>
                          <button className="icon-btn">
                            <FaPrint />
                          </button>
                          <button className="icon-btn">
                            <FaEllipsisV />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="page-info">
            {startIndex + 1}-
            {Math.min(startIndex + rowsPerPage, filtered.length)} of{" "}
            {filtered.length}
          </div>
          <div className="page-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FaChevronLeft />
            </button>
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipts;
