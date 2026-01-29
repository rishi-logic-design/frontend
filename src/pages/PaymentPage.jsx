import React, { useState, useEffect } from "react";
import paymentService from "../services/paymentService";
import "./paymentPage.scss";

const PaymentPage = () => {
  const [activeBook, setActiveBook] = useState("cashbook");
  const [activeTab, setActiveTab] = useState("credit");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [activeBook, activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        type: activeTab,
        bookType: activeBook,
      };
      const data = await paymentService.getPayments(params);
      if (Array.isArray(data)) {
        setPayments(data);
      } else if (Array.isArray(data?.payments)) {
        setPayments(data.payments);
      } else {
        setPayments([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch payments");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        type: activeTab,
        bookType: activeBook,
      };
      const data = await paymentService.getPaymentStats(params);
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    await fetchStats();
    setRefreshing(false);
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredPayments.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPayments.map((p) => p._id));
    }
  };

  const toggleCardExpansion = async (id) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
      // Optionally fetch detailed info when expanding
      try {
        const details = await paymentService.getPaymentById(id);
        // Update the payment in the list with detailed info
        setPayments((prev) =>
          prev.map((p) => (p._id === id ? { ...p, ...details } : p)),
        );
      } catch (err) {
        console.error("Error fetching payment details:", err);
      }
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await paymentService.deletePayment(id);
        setPayments((prev) => prev.filter((p) => p._id !== id));
        if (expandedCard === id) {
          setExpandedCard(null);
        }
      } catch (err) {
        alert("Failed to delete payment: " + err.message);
      }
    }
  };

  const handleEditPayment = (payment) => {
    // Navigate to edit page or open modal
    console.log("Edit payment:", payment);
    // You can implement edit functionality here
  };

  const filteredPayments = payments.filter((payment) =>
    payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="payment-page">
      {/* Header */}
      <div className="payment-header">
        <div className="header-content">
          <div className="book-tabs">
            <button
              className={`book-tab ${activeBook === "cashbook" ? "active" : ""}`}
              onClick={() => setActiveBook("cashbook")}
            >
              Cash Book
              <span className="add-icon">+</span>
            </button>
            <button
              className={`book-tab ${activeBook === "bankbook" ? "active" : ""}`}
              onClick={() => setActiveBook("bankbook")}
            >
              Bank Book
              <span className="add-icon">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credit/Debit Tabs */}
      <div className="tabs-container">
        <div className="tabs-left">
          <button
            className={`tab ${activeTab === "credit" ? "active" : ""}`}
            onClick={() => setActiveTab("credit")}
          >
            Credit
          </button>
          <button
            className={`tab ${activeTab === "debit" ? "active" : ""}`}
            onClick={() => setActiveTab("debit")}
          >
            Debit
          </button>
        </div>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <svg
            className={refreshing ? "spinning" : ""}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M15 9a6 6 0 1 1-6-6M15 3v6h-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{stats.totalCount || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">
              {formatCurrency(stats.totalAmount)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value pending">
              {stats.pendingCount || 0}
            </span>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-section">
        <div className="search-container">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M13 13L16 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <button className="filter-button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M2 4.5h14M4 9h10M6.5 13.5h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {selectedItems.length > 0 && (
          <button className="bulk-action-button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M15 6l-1.5 10.5H4.5L3 6M7.5 9v6M10.5 9v6M12 3H6L4.5 6h9L12 3z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete ({selectedItems.length})
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="2" />
            <path
              d="M24 14v12M24 30h.01"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={fetchPayments}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPayments.length === 0 && (
        <div className="empty-container">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="24" stroke="#d1d5db" strokeWidth="2" />
            <path
              d="M32 20v16M32 44h.01"
              stroke="#d1d5db"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="empty-message">No payments found</p>
          <p className="empty-submessage">
            {searchQuery
              ? "Try adjusting your search"
              : "Add your first payment to get started"}
          </p>
        </div>
      )}

      {/* Transactions Grid */}
      {!loading && !error && filteredPayments.length > 0 && (
        <div className="transactions-grid">
          {filteredPayments.map((payment) => (
            <div key={payment._id} className="transaction-card">
              <div className="card-header">
                <div className="header-left">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(payment._id)}
                      onChange={() => handleSelectItem(payment._id)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <div
                    className={`status-indicator ${payment.status || "active"}`}
                  ></div>
                  <span className="company-name">
                    {payment.customerName || "Unknown Customer"}
                  </span>
                </div>
                <button
                  className="info-button"
                  onClick={() => toggleCardExpansion(payment._id)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                      transform:
                        expandedCard === payment._id
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <path
                      d="M5 7.5l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="card-preview">
                <div className="preview-item">
                  <span className="preview-label">Amount</span>
                  <span className="preview-value">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Date</span>
                  <span className="preview-value">
                    {formatDate(payment.paymentDate || payment.createdAt)}
                  </span>
                </div>
              </div>

              {expandedCard === payment._id && (
                <div className="card-details">
                  <div className="details-section">
                    <div className="detail-row">
                      <span className="detail-label">Customer Name</span>
                      <span className="detail-value">
                        {payment.customerName || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Date</span>
                      <span className="detail-value">
                        {formatDate(payment.paymentDate || payment.createdAt)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Type</span>
                      <span className="detail-value">
                        {payment.paymentMethod || "Cash"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Reference</span>
                      <span className="detail-value">
                        {payment.referenceNumber || "N/A"}
                      </span>
                    </div>
                    {payment.description && (
                      <div className="detail-row">
                        <span className="detail-label">Description</span>
                        <span className="detail-value">
                          {payment.description}
                        </span>
                      </div>
                    )}
                    <div className="detail-row amount-row">
                      <span className="detail-label">Amount</span>
                      <span className="amount-value">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-button edit"
                      onClick={() => handleEditPayment(payment)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDeletePayment(payment._id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13 4l-1.2 9H4.2L3 4M6 7v5M10 7v5M11 2H5L4 4h8l-1-2z"
                          stroke="currentColor"
                          strokeWidth="1.5"
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
