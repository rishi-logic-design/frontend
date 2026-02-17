import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./paymentReceipts.scss";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaSort,
  FaDownload,
  FaEllipsisV,
  FaEdit,
  FaEnvelope,
  FaPrint,
  FaTrash,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import paymentService from "../../services/paymentService";

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

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Date range filter
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let paymentsData = await paymentService.getPayments({
        limit: 10000,
        page: 1,
      });
      console.log("Payments data:", paymentsData);

      let paymentsList =
        paymentsData?.rows || paymentsData?.data || paymentsData || [];
      const total = paymentsData?.total || paymentsList.length;

      console.log(
        `Fetched ${paymentsList.length} payments out of ${total} total`,
      );

      if (paymentsList.length < total && paymentsData?.rows) {
        const totalPages = Math.ceil(total / paymentsList.length);
        console.log(`Need to fetch ${totalPages} pages total`);

        for (let page = 2; page <= totalPages; page++) {
          const pageData = await paymentService.getPayments({
            limit: 10000,
            page,
          });
          const pagePayments = pageData?.rows || pageData?.data || [];
          paymentsList = [...paymentsList, ...pagePayments];
          console.log(
            `Fetched page ${page}, total now: ${paymentsList.length}`,
          );
        }
      }

      console.log("Final extracted payments:", paymentsList.length);
      setPayments(paymentsList);
      calculateStats(paymentsList);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsList) => {
    const stats = {
      totalAmount: 0,
      cashAmount: 0,
      chequeAmount: 0,
      upiAmount: 0,
      netBankingAmount: 0,
      totalCount: paymentsList.length,
      cashCount: 0,
      chequeCount: 0,
      upiCount: 0,
      netBankingCount: 0,
    };

    paymentsList.forEach((payment) => {
      const amount = payment.amount || 0;
      stats.totalAmount += amount;

      const mode = (payment.paymentMode || "").toLowerCase();
      if (mode === "cash") {
        stats.cashAmount += amount;
        stats.cashCount++;
      } else if (mode === "cheque") {
        stats.chequeAmount += amount;
        stats.chequeCount++;
      } else if (mode === "upi") {
        stats.upiAmount += amount;
        stats.upiCount++;
      } else if (mode === "net banking" || mode === "netbanking") {
        stats.netBankingAmount += amount;
        stats.netBankingCount++;
      }
    });

    setStats(stats);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "unsettled").toLowerCase();
    return (
      <span className={`status-badge ${statusLower}`}>
        {statusLower.charAt(0).toUpperCase() + statusLower.slice(1)}
      </span>
    );
  };

  const getPaymentModeBadge = (mode) => {
    const modeLower = (mode || "").toLowerCase();
    const modeClass = modeLower.replace(/\s+/g, "-");
    return (
      <span className={`payment-mode-badge ${modeClass}`}>{mode || "N/A"}</span>
    );
  };

  const filteredPayments = payments
    .filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (payment.partyName || "").toLowerCase().includes(searchLower) ||
        (payment.receiptNumber || "").toString().includes(searchLower) ||
        (payment.paymentMode || "").toLowerCase().includes(searchLower);

      const matchesMode =
        paymentModeFilter === "all" ||
        (payment.paymentMode || "").toLowerCase() ===
          paymentModeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (payment.status || "unsettled").toLowerCase() ===
          statusFilter.toLowerCase();

      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        matchesDate =
          paymentDate >= dateRange.start && paymentDate <= dateRange.end;
      }

      return matchesSearch && matchesMode && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.paymentDate || b.createdAt) -
            new Date(a.paymentDate || a.createdAt)
          );
        case "date-asc":
          return (
            new Date(a.paymentDate || a.createdAt) -
            new Date(b.paymentDate || b.createdAt)
          );
        case "amount-desc":
          return (b.amount || 0) - (a.amount || 0);
        case "amount-asc":
          return (a.amount || 0) - (b.amount || 0);
        case "party-asc":
          return (a.partyName || "").localeCompare(b.partyName || "");
        case "party-desc":
          return (b.partyName || "").localeCompare(a.partyName || "");
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [paymentModeFilter, statusFilter, searchTerm, sortBy, dateRange]);

  const applyQuickFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start, end;

    switch (filter) {
      case "today":
        start = new Date(today);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case "this-week":
        start = new Date(today);
        start.setDate(start.getDate() - today.getDay());
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "this-month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case "last-month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "all":
        setDateRange({ start: null, end: null });
        setShowDatePicker(false);
        return;
      default:
        return;
    }

    setDateRange({ start, end });
    setShowDatePicker(false);
  };

  const handleDeletePayment = async (paymentId) => {
    if (
      !window.confirm("Are you sure you want to delete this payment receipt?")
    ) {
      return;
    }

    try {
      await paymentService.deletePayment(paymentId);
      alert("Payment receipt deleted successfully!");
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment receipt");
    }
  };

  const handlePrintPDF = (paymentId) => {
    console.log("Print PDF for payment:", paymentId);
    alert("Print PDF functionality coming soon!");
  };

  const handleSendEmail = (paymentId) => {
    console.log("Send email for payment:", paymentId);
    alert("Email functionality coming soon!");
  };

  return (
    <div className="payment-receipts-page">
      {/* Header */}
      <div className="receipts-header">
        <div className="header-left">
          <h1 className="page-title">Payment Receipts</h1>
        </div>
        <button
          className="create-btn"
          onClick={() => navigate("/vendor/add-payment")}
        >
          <FaPlus />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Stats Cards with Date Filter */}
      <div className="stats-section">
        <div className="stats-grid">
          <div
            className={`stat-card ${paymentModeFilter === "all" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("all")}
          >
            <div className="stat-info">
              <span className="stat-label">All ({stats.totalCount})</span>
              <span className="stat-value">
                ₹{stats.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "cash" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("cash")}
          >
            <div className="stat-info">
              <span className="stat-label">Cash ({stats.cashCount})</span>
              <span className="stat-value">
                ₹{stats.cashAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "cheque" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("cheque")}
          >
            <div className="stat-info">
              <span className="stat-label">Cheque ({stats.chequeCount})</span>
              <span className="stat-value">
                ₹{stats.chequeAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "upi" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("upi")}
          >
            <div className="stat-info">
              <span className="stat-label">UPI ({stats.upiCount})</span>
              <span className="stat-value">
                ₹{stats.upiAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${paymentModeFilter === "net banking" ? "active" : ""}`}
            onClick={() => setPaymentModeFilter("net banking")}
          >
            <div className="stat-info">
              <span className="stat-label">
                Net Banking ({stats.netBankingCount})
              </span>
              <span className="stat-value">
                ₹{stats.netBankingAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="date-filter-container">
          <button
            className="date-filter-btn"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <FaCalendarAlt />
            <span>
              {dateRange.start && dateRange.end
                ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                : "Filter by Date"}
            </span>
          </button>

          {showDatePicker && (
            <div className="calendar-dropdown">
              <div className="quick-filters">
                <button onClick={() => applyQuickFilter("today")}>Today</button>
                <button onClick={() => applyQuickFilter("yesterday")}>
                  Yesterday
                </button>
                <button onClick={() => applyQuickFilter("this-week")}>
                  This Week
                </button>
                <button onClick={() => applyQuickFilter("this-month")}>
                  This Month
                </button>
                <button onClick={() => applyQuickFilter("last-month")}>
                  Last Month
                </button>
                <button onClick={() => applyQuickFilter("all")}>
                  All Time
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by receipt no, party name, or payment mode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          {/* Payment Mode Filter */}
          <div className="filter-dropdown-container">
            <button
              className="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              <span>Payment Mode</span>
            </button>
            {showFilters && (
              <div className="filter-dropdown">
                <button
                  className={paymentModeFilter === "all" ? "active" : ""}
                  onClick={() => {
                    setPaymentModeFilter("all");
                    setShowFilters(false);
                  }}
                >
                  All Modes
                </button>
                <button
                  className={paymentModeFilter === "cash" ? "active" : ""}
                  onClick={() => {
                    setPaymentModeFilter("cash");
                    setShowFilters(false);
                  }}
                >
                  Cash
                </button>
                <button
                  className={paymentModeFilter === "cheque" ? "active" : ""}
                  onClick={() => {
                    setPaymentModeFilter("cheque");
                    setShowFilters(false);
                  }}
                >
                  Cheque
                </button>
                <button
                  className={paymentModeFilter === "upi" ? "active" : ""}
                  onClick={() => {
                    setPaymentModeFilter("upi");
                    setShowFilters(false);
                  }}
                >
                  UPI
                </button>
                <button
                  className={
                    paymentModeFilter === "net banking" ? "active" : ""
                  }
                  onClick={() => {
                    setPaymentModeFilter("net banking");
                    setShowFilters(false);
                  }}
                >
                  Net Banking
                </button>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-dropdown-container">
            <button
              className="filter-btn"
              onClick={() => setShowSort(!showSort)}
            >
              <FaSort />
              <span>Sort By</span>
            </button>
            {showSort && (
              <div className="sort-dropdown">
                <button
                  className={sortBy === "date-desc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("date-desc");
                    setShowSort(false);
                  }}
                >
                  Newest First
                </button>
                <button
                  className={sortBy === "date-asc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("date-asc");
                    setShowSort(false);
                  }}
                >
                  Oldest First
                </button>
                <button
                  className={sortBy === "amount-desc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("amount-desc");
                    setShowSort(false);
                  }}
                >
                  Highest Amount
                </button>
                <button
                  className={sortBy === "amount-asc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("amount-asc");
                    setShowSort(false);
                  }}
                >
                  Lowest Amount
                </button>
                <button
                  className={sortBy === "party-asc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("party-asc");
                    setShowSort(false);
                  }}
                >
                  Party Name (A-Z)
                </button>
                <button
                  className={sortBy === "party-desc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("party-desc");
                    setShowSort(false);
                  }}
                >
                  Party Name (Z-A)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="receipts-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="empty-message">No payment receipts found</p>
          </div>
        ) : (
          <table className="receipts-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Party Name</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment) => (
                <tr key={payment._id || payment.id}>
                  <td className="receipt-no">{payment.id || "N/A"}</td>
                  <td>
                    {formatDate(payment.paymentDate || payment.createdAt)}
                  </td>
                  <td>
                    {payment.customer?.customerName ||
                      payment.customer?.businessName ||
                      "N/A"}
                  </td>
                  <td className="amount">
                    ₹{(payment.amount || 0).toLocaleString("en-IN")}
                    {payment.unusedAmount > 0 && (
                      <div className="unused-amount">
                        (₹{payment.unusedAmount.toLocaleString("en-IN")} Unused)
                      </div>
                    )}
                  </td>
                  <td>{getPaymentModeBadge(payment.method)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="icon-btn"
                        onClick={() =>
                          navigate(
                            `/vendor/add-payment?paymentId=${payment._id || payment.id}`,
                          )
                        }
                        title="Edit Receipt"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          handlePrintPDF(payment._id || payment.id)
                        }
                        title="Print PDF"
                      >
                        <FaPrint />
                      </button>
                      <div className="menu-container">
                        <button
                          className="icon-btn"
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === payment._id ? null : payment._id,
                            )
                          }
                          title="More options"
                        >
                          <FaEllipsisV />
                        </button>
                        {activeMenu === payment._id && (
                          <div className="action-menu">
                            <button
                              onClick={() => {
                                handleSendEmail(payment._id || payment.id);
                                setActiveMenu(null);
                              }}
                            >
                              <FaEnvelope /> Send Email
                            </button>
                            <button
                              onClick={() => {
                                handleDeletePayment(payment._id || payment.id);
                                setActiveMenu(null);
                              }}
                              className="delete-btn"
                            >
                              <FaTrash /> Delete Receipt
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredPayments.length > 0 && (
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
              <option value="100">100</option>
              <option value="999999">All</option>
            </select>
          </div>
          <div className="page-info">
            {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} of{" "}
            {filteredPayments.length}
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
      )}
    </div>
  );
};

export default PaymentReceipts;
