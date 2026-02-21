import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaSort,
  FaFileInvoice,
  FaDownload,
  FaEllipsisV,
} from "react-icons/fa";
import billService from "../../services/billService";
import "./billsList.scss";

const BillsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalSales: 0,
    unpaid: 0,
    paid: 0,
    partiallyPaid: 0,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [billToCancel, setBillToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [location.state?.refresh]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownOpen &&
        !event.target.closest(".status-dropdown-container")
      ) {
        setStatusDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const billsData = await billService.getBills({ size: 1000 });

      const bills =
        billsData?.rows || (Array.isArray(billsData) ? billsData : []);
      setBills(bills);
      calculateStats(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setBills([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (billsData) => {
    const stats = {
      totalSales: 0,
      unpaid: 0,
      paid: 0,
      partiallyPaid: 0,
    };

    billsData.forEach((bill) => {
      const total = parseFloat(bill.totalAmount || bill.total || 0);
      stats.totalSales += total;

      const status = bill.status?.toLowerCase()?.replace(" ", "_") || "pending";

      if (status === "paid") {
        stats.paid += total;
      } else if (status === "unpaid" || status === "pending") {
        stats.unpaid += total;
      } else if (status === "partially_paid" || status === "partial") {
        stats.partiallyPaid += total;
      }
    });

    setStats(stats);
  };

  const getStatusCount = (statusToCount) => {
    const targetStatus = statusToCount?.toLowerCase();

    return bills.filter((b) => {
      const bStatus = b.status?.toLowerCase()?.replace(" ", "_") || "pending";

      if (targetStatus === "unpaid" || targetStatus === "pending") {
        return bStatus === "unpaid" || bStatus === "pending";
      }

      if (targetStatus === "partially_paid" || targetStatus === "partial") {
        return bStatus === "partially_paid" || bStatus === "partial";
      }

      return bStatus === targetStatus;
    }).length;
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
    const statusMap = {
      paid: { label: "Paid", class: "paid" },
      unpaid: { label: "Unpaid", class: "unpaid" },
      pending: { label: "Pending", class: "unpaid" },
      partial: { label: "Partially", class: "partial" },
      cancelled: { label: "Cancelled", class: "cancelled" },
    };
    const statusKey = status?.toLowerCase()?.trim();
    const statusInfo = statusMap[statusKey] ||
      statusMap[status] || { label: status || "Pending", class: "unpaid" };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleStatusChange = (bill, newStatus) => {
    setStatusDropdownOpen(null);

    if (newStatus === "paid" || newStatus === "partially_paid") {
      navigate(
        `/vendor/add-payment?billId=${bill._id || bill.id}&action=${newStatus}`,
      );
      return;
    }

    if (newStatus === "cancelled") {
      setBillToCancel(bill);
      setShowCancelModal(true);
      return;
    }
  };

  const handleConfirmCancel = async () => {
    if (!billToCancel) return;
    try {
      setCancelLoading(true);
      await billService.editBill(billToCancel._id || billToCancel.id, {
        status: "cancelled",
      });
      await fetchBills();
      setShowCancelModal(false);
      setBillToCancel(null);
    } catch (error) {
      console.error("Error cancelling bill:", error);
      alert("Failed to cancel bill. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setBillToCancel(null);
  };

  const filteredBills = bills
    .filter((bill) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        bill.billNumber?.toLowerCase().includes(searchLower) ||
        bill.billNo?.toLowerCase().includes(searchLower) ||
        bill.customerName?.toLowerCase().includes(searchLower) ||
        bill.customer?.customerName?.toLowerCase().includes(searchLower);

      const billStatusRaw = bill.status?.toLowerCase() || "pending";
      const billStatus = billStatusRaw.replace(" ", "_");
      const filterValue = statusFilter.toLowerCase();

      const matchesStatus =
        filterValue === "all" ||
        billStatus === filterValue ||
        (filterValue === "partially_paid" && billStatus === "partial") ||
        (filterValue === "pending" &&
          (billStatus === "pending" || billStatus === "unpaid"));

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.billDate || b.createdAt) -
            new Date(a.billDate || a.createdAt)
          );
        case "date-asc":
          return (
            new Date(a.billDate || a.createdAt) -
            new Date(b.billDate || b.createdAt)
          );
        case "amount-desc":
          return (
            parseFloat(b.totalAmount || 0) - parseFloat(a.totalAmount || 0)
          );
        case "amount-asc":
          return (
            parseFloat(a.totalAmount || 0) - parseFloat(b.totalAmount || 0)
          );
        case "invoice-no":
          return (a.billNumber || a.billNo || "").localeCompare(
            b.billNumber || b.billNo || "",
          );
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredBills.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, sortBy]);

  return (
    <div className="bills-list-page">
      <div className="bills-header">
        <div className="header-left">
          <h1 className="page-title">Invoices</h1>
        </div>
        <button
          className="create-btn"
          onClick={() => navigate("/vendor/new-bill")}
        >
          <FaPlus />
          <span>Create Invoice</span>
        </button>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div
            className={`stat-card ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
            style={{ cursor: "pointer" }}
          >
            <div className="stat-info">
              <span className="stat-label">Total ({bills.length})</span>
              <span className="stat-value">
                ₹{stats.totalSales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${statusFilter === "unpaid" || statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
            style={{ cursor: "pointer" }}
          >
            <div className="stat-info">
              <span className="stat-label">
                Unpaid ({getStatusCount("unpaid")})
              </span>
              <span className="stat-value">
                ₹{stats.unpaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${statusFilter === "paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("paid")}
            style={{ cursor: "pointer" }}
          >
            <div className="stat-info">
              <span className="stat-label">
                Paid ({getStatusCount("paid")})
              </span>
              <span className="stat-value">
                ₹{stats.paid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card ${statusFilter === "partially_paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("partially_paid")}
            style={{ cursor: "pointer" }}
          >
            <div className="stat-info">
              <span className="stat-label">
                Partially Paid ({getStatusCount("partially_paid")})
              </span>
              <span className="stat-value">
                ₹{stats.partiallyPaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <div className="filter-dropdown-container">
            <button
              className="filter-btn"
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSort(false);
              }}
            >
              <FaFilter />
              Filters
            </button>
            {showFilters && (
              <div className="filter-dropdown">
                <button
                  className={statusFilter === "all" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("all");
                    setShowFilters(false);
                  }}
                >
                  All Invoices
                </button>
                <button
                  className={statusFilter === "pending" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("pending");
                    setShowFilters(false);
                  }}
                >
                  Pending / Unpaid
                </button>
                <button
                  className={statusFilter === "paid" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("paid");
                    setShowFilters(false);
                  }}
                >
                  Paid
                </button>
                <button
                  className={statusFilter === "partially_paid" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("partially_paid");
                    setShowFilters(false);
                  }}
                >
                  Partially Paid
                </button>
                <button
                  className={statusFilter === "cancelled" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("cancelled");
                    setShowFilters(false);
                  }}
                >
                  Cancelled
                </button>
              </div>
            )}
          </div>

          <div className="sort-dropdown-container">
            <button
              className="filter-btn"
              onClick={() => {
                setShowSort(!showSort);
                setShowFilters(false);
              }}
            >
              <FaSort />
              Sort by
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
                  Date (Newest First)
                </button>
                <button
                  className={sortBy === "date-asc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("date-asc");
                    setShowSort(false);
                  }}
                >
                  Date (Oldest First)
                </button>
                <button
                  className={sortBy === "amount-desc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("amount-desc");
                    setShowSort(false);
                  }}
                >
                  Amount (High to Low)
                </button>
                <button
                  className={sortBy === "amount-asc" ? "active" : ""}
                  onClick={() => {
                    setSortBy("amount-asc");
                    setShowSort(false);
                  }}
                >
                  Amount (Low to High)
                </button>
                <button
                  className={sortBy === "invoice-no" ? "active" : ""}
                  onClick={() => {
                    setSortBy("invoice-no");
                    setShowSort(false);
                  }}
                >
                  Invoice Number
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bills-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : filteredBills.length > 0 ? (
          <table className="bills-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Buyer Name</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill) => (
                <tr key={bill._id || bill.id}>
                  <td className="invoice-no">{bill.billNumber || "N/A"}</td>
                  <td>{formatDate(bill.billDate || bill.createdAt)}</td>
                  <td>
                    {bill.customerName || bill.customer?.customerName || "N/A"}
                  </td>
                  <td className="amount">
                    ₹{(bill.total || bill.totalAmount || 0).toLocaleString()}
                  </td>
                  <td>
                    <div className="status-dropdown-container">
                      {/* Show status badge always */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {getStatusBadge(bill.status || "partial")}

                        {(bill.status === "pending" ||
                          bill.status === "partial" ||
                          bill.status === "cancelled") && (
                          <button
                            className={`status-dropdown-trigger ${bill.status || "partial"}`}
                            onClick={() => {
                              if (
                                statusDropdownOpen === (bill._id || bill.id)
                              ) {
                                setStatusDropdownOpen(null);
                              } else {
                                setStatusDropdownOpen(bill._id || bill.id);
                              }
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "0 2px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="currentColor"
                              style={{ opacity: 0.6 }}
                            >
                              <path d="M6 8L2 4h8L6 8z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Dropdown menu — only Cancelled option */}
                      {statusDropdownOpen === (bill._id || bill.id) &&
                        (bill.status === "pending" ||
                          bill.status === "unpaid" ||
                          bill.status === "partially_paid") && (
                          <div className="status-dropdown-menu">
                            <button
                              className="status-option cancelled"
                              onClick={() =>
                                handleStatusChange(bill, "cancelled")
                              }
                            >
                              Cancelled
                            </button>
                          </div>
                        )}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {/* Hide Record Payment when paid or cancelled */}
                      {bill.status !== "paid" &&
                        bill.status !== "cancelled" && (
                          <button
                            className="record-payment-btn"
                            onClick={() =>
                              navigate(
                                `/vendor/add-payment?billId=${bill._id || bill.id}`,
                              )
                            }
                          >
                            Record Payment
                          </button>
                        )}
                      <button
                        className="icon-btn"
                        onClick={async () => {
                          try {
                            await billService.downloadPDF(bill._id || bill.id);
                          } catch (error) {
                            console.error("Error downloading PDF:", error);
                            alert("Failed to download PDF");
                          }
                        }}
                        title="Download PDF"
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          navigate(
                            `/vendor/bill-details/${bill._id || bill.id}`,
                          )
                        }
                        title="More options"
                      >
                        <FaEllipsisV />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FaFileInvoice className="empty-icon" />
            <p className="empty-message">
              No Invoice available, Create new Invoice
            </p>
            <button
              className="create-btn-empty"
              onClick={() => navigate("/vendor/new-bill")}
            >
              <FaPlus />
              <span>Create Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
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
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="999999">All</option>
          </select>
        </div>
        <div className="page-info">
          {startIndex + 1}–{Math.min(endIndex, filteredBills.length)} of{" "}
          {filteredBills.length}
        </div>
        <div className="page-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="First page"
          >
            «
          </button>
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ←
          </button>
          {/* Page number buttons */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(
              1,
              Math.min(currentPage - 2, totalPages - 4),
            );
            const page = start + i;
            if (page > totalPages) return null;
            return (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            →
          </button>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Last page"
          >
            »
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && billToCancel && (
        <div className="cancel-modal-overlay" onClick={handleCloseCancelModal}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#FEF3C7" />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="#D97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="cancel-modal-title">Cancel Invoice?</h2>
            <p className="cancel-modal-desc">
              Are you sure you want to cancel invoice{" "}
              <strong>{billToCancel.billNumber}</strong>? This action cannot be
              undone.
            </p>
            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-btn-no"
                onClick={handleCloseCancelModal}
                disabled={cancelLoading}
              >
                No, Keep It
              </button>
              <button
                className="cancel-modal-btn-yes"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsList;
