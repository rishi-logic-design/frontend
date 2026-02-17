import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import paymentService from "../../services/paymentService";
import "./billsList.scss";

const BillsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalSales: 0,
    unpaid: 0,
    paid: 0,
    partiallyPaid: 0,
  });

  // Filter and Sort States
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(999999);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAction, setPaymentAction] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");

  useEffect(() => {
    fetchBills();
  }, []);

  // Close dropdown when clicking outside
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
      const billsData = await billService.getBills();
      console.log("Bills data:", billsData);

      const bills = billsData?.rows || billsData || [];
      console.log("Extracted bills:", bills);
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

      if (bill.status === "paid") {
        stats.paid += total;
      } else if (bill.status === "unpaid" || bill.status === "pending") {
        stats.unpaid += total;
      } else if (bill.status === "partially_paid") {
        stats.partiallyPaid += total;
      }
    });

    setStats(stats);
  };

  const getStatusCount = (status) => {
    if (status === "unpaid") {
      return bills.filter(
        (b) => b.status === "unpaid" || b.status === "pending",
      ).length;
    }
    return bills.filter((b) => b.status === status).length;
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
      partially_paid: { label: "Partially Paid", class: "partial" },
      cancelled: { label: "Cancelled", class: "cancelled" },
    };
    const statusInfo = statusMap[status] || { label: status, class: "unpaid" };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleStatusChange = async (bill, newStatus) => {
    setStatusDropdownOpen(null);

    // If status is paid or partial, show payment modal
    if (newStatus === "paid" || newStatus === "partially_paid") {
      setSelectedBill(bill);
      setPaymentAction(newStatus);

      // For paid, set amount to pending amount
      if (newStatus === "paid") {
        const pendingAmount =
          parseFloat(bill.totalAmount || 0) - parseFloat(bill.paidAmount || 0);
        setPaymentAmount(pendingAmount.toString());
      } else {
        setPaymentAmount("");
      }

      setShowPaymentModal(true);
      return;
    }

    // For cancelled or unpaid, directly update status
    try {
      await billService.editBill(bill._id || bill.id, { status: newStatus });
      await fetchBills();
      console.log(
        `✅ Bill ${bill._id || bill.id} status updated to ${newStatus}`,
      );
    } catch (error) {
      console.error("Error updating bill status:", error);
      alert("Failed to update bill status. Please try again.");
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedBill) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const pendingAmount =
      parseFloat(selectedBill.totalAmount || 0) -
      parseFloat(selectedBill.paidAmount || 0);
    if (amount > pendingAmount) {
      alert(
        `Amount cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}`,
      );
      return;
    }

    try {
      // Create payment record
      const paymentData = {
        customerId: selectedBill.customerId || selectedBill.customer?.id,
        type: "credit",
        subType: "customer",
        amount: amount,
        paymentDate: new Date().toISOString().split("T")[0],
        method: paymentMethod,
        note: paymentNote || `Payment for bill ${selectedBill.billNumber}`,
        status: "completed",
        adjustedInvoices: [
          {
            billId: selectedBill._id || selectedBill.id,
            payAmount: amount,
          },
        ],
      };

      console.log("Creating payment:", paymentData);
      await paymentService.createPayment(paymentData);

      // Refresh bills
      await fetchBills();

      // Close modal
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentAmount("");
      setPaymentNote("");

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment. Please try again.");
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedBill(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const filteredBills = bills
    .filter((bill) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        bill.billNumber?.toLowerCase().includes(searchLower) ||
        bill.billNo?.toLowerCase().includes(searchLower) ||
        bill.customerName?.toLowerCase().includes(searchLower) ||
        bill.customer?.customerName?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ||
        bill.status === statusFilter ||
        (statusFilter === "unpaid" && bill.status === "pending");

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

      {/* Stats Cards with Date Filter */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Sales ({bills.length})</span>
              <span className="stat-value">
                ₹{stats.totalSales.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">
                Unpaid ({getStatusCount("unpaid")})
              </span>
              <span className="stat-value">
                ₹{stats.unpaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">
                Paid ({getStatusCount("paid")})
              </span>
              <span className="stat-value">
                ₹{stats.paid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="stat-card">
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
                  className={statusFilter === "paid" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("paid");
                    setShowFilters(false);
                  }}
                >
                  Paid
                </button>
                <button
                  className={statusFilter === "unpaid" ? "active" : ""}
                  onClick={() => {
                    setStatusFilter("unpaid");
                    setShowFilters(false);
                  }}
                >
                  Unpaid
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
                      <button
                        className={`status-dropdown-trigger ${bill.status || "unpaid"}`}
                        onClick={() => {
                          if (statusDropdownOpen === (bill._id || bill.id)) {
                            setStatusDropdownOpen(null);
                          } else {
                            setStatusDropdownOpen(bill._id || bill.id);
                          }
                        }}
                      >
                        {getStatusBadge(bill.status || "unpaid")}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                          style={{ marginLeft: "4px", opacity: 0.6 }}
                        >
                          <path d="M6 8L2 4h8L6 8z" />
                        </svg>
                      </button>

                      {statusDropdownOpen === (bill._id || bill.id) && (
                        <div className="status-dropdown-menu">
                          <button
                            className="status-option unpaid"
                            onClick={() => handleStatusChange(bill, "unpaid")}
                          >
                            Unpaid
                          </button>
                          <button
                            className="status-option paid"
                            onClick={() => handleStatusChange(bill, "paid")}
                          >
                            Paid
                          </button>
                          <button
                            className="status-option partial"
                            onClick={() =>
                              handleStatusChange(bill, "partially_paid")
                            }
                          >
                            Partially Paid
                          </button>
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
                      {bill.status !== "paid" && (
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
      {filteredBills.length > 0 && (
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
            {startIndex + 1}-{Math.min(endIndex, filteredBills.length)} of{" "}
            {filteredBills.length}
          </div>
          <div className="page-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ←
            </button>
            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="payment-modal-overlay" onClick={closePaymentModal}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {paymentAction === "paid"
                  ? "Record Full Payment"
                  : "Record Partial Payment"}
              </h2>
              <button className="close-btn" onClick={closePaymentModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Bill Info */}
              <div className="bill-info-card">
                <div className="info-row">
                  <span className="label">Invoice No:</span>
                  <span className="value">{selectedBill.billNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Customer:</span>
                  <span className="value">
                    {selectedBill.customerName ||
                      selectedBill.customer?.customerName}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Total Amount:</span>
                  <span className="value amount">
                    ₹{(selectedBill.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Paid Amount:</span>
                  <span className="value amount-paid">
                    ₹{(selectedBill.paidAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="info-row highlight">
                  <span className="label">Pending Amount:</span>
                  <span className="value amount-pending">
                    ₹
                    {(
                      parseFloat(selectedBill.totalAmount || 0) -
                      parseFloat(selectedBill.paidAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="payment-form">
                <div className="form-group">
                  <label htmlFor="paymentAmount">
                    Payment Amount *
                    {paymentAction === "paid" && (
                      <span className="hint">(Full pending amount)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    readOnly={paymentAction === "paid"}
                    className={paymentAction === "paid" ? "readonly" : ""}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentNote">Note (Optional)</label>
                  <textarea
                    id="paymentNote"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Add any notes about this payment..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closePaymentModal}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handlePaymentSubmit}>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsList;
