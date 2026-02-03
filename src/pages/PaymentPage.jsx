import React, { useState, useEffect } from "react";
import "./paymentPage.scss";
import paymentService from "../services/paymentService";
import { getCustomerById } from "../services/customerService";
import PaymentModal from "../components/paymentPage/PaymentModal";
import { useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("credit");
  const [activeBook, setActiveBook] = useState("cash");
  const [expandedItem, setExpandedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    subType: "",
    fromDate: "",
    toDate: "",
  });

  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [activeTab, activeBook, filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        type: activeTab,
        method: activeBook === "cash" ? "cash" : "bank",
        ...(filters.status && { status: filters.status }),
        ...(filters.subType && { subType: filters.subType }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      };

      const response = await paymentService.getPayments(params);
      const paymentData = response.rows || response.data || [];
      setPayments(paymentData);
      console.log(response);
      // Calculate stats
      const totalAmount = paymentData.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || 0),
        0,
      );
      setStats({
        totalTransactions: paymentData.length,
        totalAmount: totalAmount,
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
      setStats({
        totalTransactions: 0,
        totalAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = () => {
    navigate("/vendor/add-payment");
  };

  const handleEditPayment = (payment) => {
    setShowModal(true);
    setEditingPayment(null);

    loadPaymentDetails(payment.id);
  };

  const loadPaymentDetails = async (paymentId) => {
    try {
      const fullPayment = await paymentService.getPaymentById(paymentId);

      let customerData = null;
      if (fullPayment.customerId) {
        try {
          customerData = await getCustomerById(fullPayment.customerId);
        } catch (err) {
          console.error("Error fetching customer:", err);
        }
      }

      setEditingPayment({
        ...fullPayment,
        Customer: customerData || fullPayment.Customer,
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await paymentService.deletePayment(id);
        fetchPayments();
        if (expandedItem === id) {
          setExpandedItem(null);
        }
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert("Failed to delete payment");
      }
    }
  };

  const handleSavePayment = async (paymentData) => {
    try {
      if (editingPayment) {
        await paymentService.updatePayment(editingPayment.id, paymentData);
      } else {
        await paymentService.createPayment(paymentData);
      }
      setShowModal(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
      throw error;
    }
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const allIds = filteredData.map((item) => item.id);
    setSelectedItems((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      subType: "",
      fromDate: "",
      toDate: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters = () => {
    return (
      filters.status ||
      filters.subType ||
      filters.fromDate ||
      filters.toDate ||
      searchQuery
    );
  };

  const filteredData = payments.filter((item) => {
    if (!searchQuery) return true;

    const customerName =
      item.Customer?.name ||
      item.Customer?.companyName ||
      item.Customer?.businessName ||
      "";
    const paymentNumber = item.paymentNumber || "";
    const reference = item.reference || "";

    const query = searchQuery.toLowerCase();
    return (
      customerName.toLowerCase().includes(query) ||
      paymentNumber.toLowerCase().includes(query) ||
      reference.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return "💵";
      case "bank":
        return "🏦";
      case "upi":
        return "📱";
      case "cheque":
        return "📝";
      case "card":
        return "💳";
      default:
        return "💰";
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "badge-success",
      pending: "badge-warning",
      failed: "badge-danger",
      cancelled: "badge-secondary",
    };
    return statusColors[status] || "badge-secondary";
  };

  return (
    <div className="payment-page">
      <div className="payment-header">
        <h1 className="page-title">
          {activeBook === "cash" ? "Cash Book" : "Bank Book"}
        </h1>
        <button
          className="add-btn"
          title="Add New Entry"
          onClick={handleAddPayment}
        >
          +
        </button>
      </div>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === "credit" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("credit");
            setExpandedItem(null);
          }}
        >
          Credit
        </button>
        <button
          className={`tab ${activeTab === "debit" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("debit");
            setExpandedItem(null);
          }}
        >
          Debit
        </button>
      </div>

      {/* Summary Section - Always Visible */}
      <div className="summary-section">
        <div className="summary-row">
          <span className="summary-label">Total Transactions</span>
          <span className="summary-value">{stats.totalTransactions}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Total Amount</span>
          <span className="summary-value amount-highlight">
            {formatAmount(stats.totalAmount)}
          </span>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <svg
            className="search-icon-left"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by customer, payment number, or reference"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button
          className={`menu-icon-btn ${showFilters ? "active" : ""} ${hasActiveFilters() ? "has-filters" : ""}`}
          title="Filter options"
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Filters</h3>
            {hasActiveFilters() && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sub Type</label>
              <select
                value={filters.subType}
                onChange={(e) => handleFilterChange("subType", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="cash-deposit">Cash Deposit</option>
                <option value="cash-withdrawal">Cash Withdrawal</option>
                <option value="bank-charges">Bank Charges</option>
                <option value="electricity-bill">Electricity Bill</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="table-header">
        <input
          type="checkbox"
          className="checkbox"
          checked={
            selectedItems.length === filteredData.length &&
            filteredData.length > 0
          }
          onChange={toggleSelectAll}
          title="Select all"
        />
        <span className="header-text">Payment Details</span>
        {selectedItems.length > 0 && (
          <span className="selected-count">
            {selectedItems.length} selected
          </span>
        )}
      </div>

      <div className="entries-container">
        {loading ? (
          <div className="loading-state">
            <p>Loading payments...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <p>No payments found</p>
            {hasActiveFilters() && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredData.map((entry) => (
            <div
              key={entry.id}
              className={`entry-wrapper ${expandedItem === entry.id ? "expanded" : ""}`}
            >
              <div className="entry-row">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedItems.includes(entry.id)}
                  onChange={() => toggleSelectItem(entry.id)}
                />
                <div className={`status-icon ${activeTab}`}>
                  {activeTab === "credit" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#10B981" />
                      <path
                        d="M8 12l3 3 5-6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#EF4444" />
                      <path
                        d="M8 8l8 8M16 8l-8 8"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="entry-info">
                  <span className="entry-name">
                    {entry.customer?.customerName ||
                      entry.customer?.companyName ||
                      entry.customer?.businessName ||
                      "Unknown"}
                  </span>
                  <span className="entry-meta">
                    {getPaymentMethodIcon(entry.method)} {entry.method} •{" "}
                    {formatDate(entry.paymentDate)}
                  </span>
                </div>
                <div className="entry-amount">
                  <span className={`amount ${activeTab}`}>
                    {formatAmount(entry.amount)}
                  </span>
                  <span
                    className={`status-badge ${getStatusBadge(entry.status)}`}
                  >
                    {entry.status}
                  </span>
                </div>
                <button
                  className="info-btn"
                  onClick={() => toggleExpand(entry.id)}
                  title={expandedItem === entry.id ? "Collapse" : "Expand"}
                >
                  {expandedItem === entry.id ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#6B7280"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 12h8"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 8v8M8 12h8"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {expandedItem === entry.id && (
                <div className="entry-details">
                  <div className="details-grid">
                    <div className="detail-row">
                      <span className="detail-label">Payment Number</span>
                      <span className="detail-value">
                        {entry.paymentNumber || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Date</span>
                      <span className="detail-value">
                        {formatDate(entry.paymentDate)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Type</span>
                      <span className="detail-value">
                        {entry.method
                          ? entry.method.charAt(0).toUpperCase() +
                            entry.method.slice(1)
                          : "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Sub Type</span>
                      <span className="detail-value">
                        {entry.subType
                          ? entry.subType
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")
                          : "-"}
                      </span>
                    </div>
                    {entry.reference && (
                      <div className="detail-row">
                        <span className="detail-label">Reference</span>
                        <span className="detail-value">{entry.reference}</span>
                      </div>
                    )}
                    {entry.method === "bank" && (
                      <>
                        {entry.bankName && (
                          <div className="detail-row">
                            <span className="detail-label">Bank Name</span>
                            <span className="detail-value">
                              {entry.bankName}
                            </span>
                          </div>
                        )}
                        {entry.accountNumber && (
                          <div className="detail-row">
                            <span className="detail-label">Account Number</span>
                            <span className="detail-value">
                              {entry.accountNumber}
                            </span>
                          </div>
                        )}
                        {entry.ifscCode && (
                          <div className="detail-row">
                            <span className="detail-label">IFSC Code</span>
                            <span className="detail-value">
                              {entry.ifscCode}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {(entry.method === "upi" || entry.method === "online") &&
                      entry.upiId && (
                        <div className="detail-row">
                          <span className="detail-label">UPI ID</span>
                          <span className="detail-value">{entry.upiId}</span>
                        </div>
                      )}
                    {entry.method === "cheque" && (
                      <>
                        {entry.chequeNumber && (
                          <div className="detail-row">
                            <span className="detail-label">Cheque Number</span>
                            <span className="detail-value">
                              {entry.chequeNumber}
                            </span>
                          </div>
                        )}
                        {entry.chequeDate && (
                          <div className="detail-row">
                            <span className="detail-label">Cheque Date</span>
                            <span className="detail-value">
                              {formatDate(entry.chequeDate)}
                            </span>
                          </div>
                        )}
                        {entry.chequeBankName && (
                          <div className="detail-row">
                            <span className="detail-label">Cheque Bank</span>
                            <span className="detail-value">
                              {entry.chequeBankName}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {entry.note && (
                      <div className="detail-row full-width">
                        <span className="detail-label">Remark</span>
                        <span className="detail-value">{entry.note}</span>
                      </div>
                    )}
                    <div className="detail-row amount-row">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value amount-large">
                        {formatAmount(entry.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button
                      className="edit-btn"
                      title="Edit entry"
                      onClick={() => handleEditPayment(entry)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M14 2l4 4-10 10H4v-4L14 2z"
                          stroke="#6B7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete entry"
                      onClick={() => handleDeletePayment(entry.id)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M3 5h14M8 5V3h4v2m-6 0v11a2 2 0 002 2h4a2 2 0 002-2V5"
                          stroke="#EF4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bottom-tabs">
        <button
          className={`bottom-tab ${activeBook === "cash" ? "active" : ""}`}
          onClick={() => {
            setActiveBook("cash");
            setExpandedItem(null);
            setSelectedItems([]);
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="tab-icon"
          >
            <rect
              x="2"
              y="4"
              width="16"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M6 9h8M6 12h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Cash Book
        </button>
        <button
          className={`bottom-tab ${activeBook === "bank" ? "active" : ""}`}
          onClick={() => {
            setActiveBook("bank");
            setExpandedItem(null);
            setSelectedItems([]);
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="tab-icon"
          >
            <path
              d="M3 7l7-4 7 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M7 16v-6h6v6M10 10V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Bank Book
        </button>
      </div>

      {showModal && (
        <PaymentModal
          payment={editingPayment}
          loading={!editingPayment} 
          type={activeTab}
          method={activeBook === "cash" ? "cash" : "bank"}
          onClose={() => {
            setShowModal(false);
            setEditingPayment(null);
          }}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
};

export default PaymentPage;
