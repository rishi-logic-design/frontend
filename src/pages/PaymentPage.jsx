import React, { useState, useEffect } from "react";
import "./paymentPage.scss";
import paymentService from "../services/paymentService";
import { getCustomerById } from "../services/customerService";
import PaymentModal from "../components/paymentPage/PaymentModal";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";

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
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    subType: "",
    fromDate: "",
    toDate: "",
  });

  const [activeModeFilter, setActiveModeFilter] = useState("All");

  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    cashOpening: "0.00",
    bankOpening: "0.00",
    cashBalance: "0.00",
    bankBalance: "0.00",
    modeStats: {
      All: { count: 0, amount: 0 },
      Cash: { count: 0, amount: 0 },
      Cheque: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      "Net Banking": { count: 0, amount: 0 },
    },
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
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

      // Calculate mode-specific stats
      const modeStats = {
        All: { count: paymentData.length, amount: 0 },
        Cash: { count: 0, amount: 0 },
        Cheque: { count: 0, amount: 0 },
        UPI: { count: 0, amount: 0 },
        "Net Banking": { count: 0, amount: 0 },
      };

      paymentData.forEach((payment) => {
        const amount = parseFloat(payment.amount || 0);
        modeStats.All.amount += amount;

        const mode = (payment.method || payment.paymentMode || "")
          .toLowerCase()
          .trim();
        if (mode === "cash") {
          modeStats.Cash.count++;
          modeStats.Cash.amount += amount;
        } else if (mode === "cheque") {
          modeStats.Cheque.count++;
          modeStats.Cheque.amount += amount;
        } else if (mode === "upi" || mode === "online") {
          modeStats.UPI.count++;
          modeStats.UPI.amount += amount;
        } else {
          modeStats["Net Banking"].count++;
          modeStats["Net Banking"].amount += amount;
        }
      });

      setStats((prev) => ({
        ...prev,
        totalTransactions: paymentData.length,
        totalAmount: modeStats.All.amount,
        modeStats,
      }));
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await paymentService.getPaymentStats();
      setStats((prev) => ({
        ...prev,
        cashOpening: statsData.cashOpening || "0.00",
        bankOpening: statsData.bankOpening || "0.00",
        cashBalance: statsData.cashBalance || "0.00",
        bankBalance: statsData.bankBalance || "0.00",
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSetOpeningBalance = async () => {
    if (!openingBalanceAmount || parseFloat(openingBalanceAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await paymentService.setOpeningBalance(activeBook, openingBalanceAmount);
      setShowOpeningBalanceModal(false);
      setOpeningBalanceAmount("");
      fetchStats();
      fetchPayments();
      toast.success("Opening balance set successfully!");
    } catch (error) {
      console.error("Error setting opening balance:", error);
      toast.error(error.message || "Failed to set opening balance");
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
        toast.error("Failed to delete payment");
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
    setActiveModeFilter("All");
  };

  const hasActiveFilters = () => {
    return (
      filters.status ||
      filters.subType ||
      filters.fromDate ||
      filters.toDate ||
      searchQuery ||
      activeModeFilter !== "All"
    );
  };

  const filteredData = payments.filter((item) => {
    if (activeModeFilter !== "All") {
      const mode = (item.method || item.paymentMode || "").toLowerCase().trim();
      if (activeModeFilter === "Cash" && mode !== "cash") return false;
      if (activeModeFilter === "Cheque" && mode !== "cheque") return false;
      if (activeModeFilter === "UPI" && mode !== "upi" && mode !== "online")
        return false;
      if (activeModeFilter === "Net Banking") {
        if (["cash", "cheque", "upi", "online"].includes(mode)) return false;
      }
    }

    if (!searchQuery) return true;

    const customerName =
      item.Customer?.name ||
      item.Customer?.companyName ||
      item.Customer?.businessName ||
      item.customer?.customerName ||
      item.customer?.companyName ||
      item.customer?.businessName ||
      "";
    const paymentNumber = item.paymentNumber || "";
    const reference = item.reference || "";
    const method = item.method || item.paymentMode || "";

    const query = searchQuery.toLowerCase();
    return (
      customerName.toLowerCase().includes(query) ||
      paymentNumber.toLowerCase().includes(query) ||
      reference.toLowerCase().includes(query) ||
      method.toLowerCase().includes(query)
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
      <div className="dashboard-summary">
        {Object.keys(stats.modeStats).map((mode) => (
          <div
            key={mode}
            className={`summary-card ${activeModeFilter === mode ? "active" : ""} ${mode.toLowerCase().replace(" ", "-")}`}
            onClick={() => setActiveModeFilter(mode)}
          >
            <div className="card-header">
              <span className="mode-name">
                {mode} ({stats.modeStats[mode].count})
              </span>
            </div>
            <div className="card-body">
              <span className="mode-amount">
                {formatAmount(stats.modeStats[mode].amount)}
              </span>
            </div>
          </div>
        ))}
        <div className="date-filter-standalone">
          <button
            className="filter-date-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Filter by Date
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by receipt no, party name, or payment mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-filters">
          <button className="filter-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Payment Mode
          </button>
          <button className="filter-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
            Sort By
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel-overlay">
          <div className="filter-panel-content">
            <div className="filter-header">
              <h3>Date Range</h3>
              <button
                className="close-btn"
                onClick={() => setShowFilters(false)}
              >
                ×
              </button>
            </div>
            <div className="filter-body">
              <div className="filter-row">
                <div className="filter-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                      handleFilterChange("fromDate", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                      handleFilterChange("toDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="filter-actions">
                <button className="clear-btn" onClick={clearFilters}>
                  Clear
                </button>
                <button
                  className="apply-btn"
                  onClick={() => setShowFilters(false)}
                >
                  Apply
                </button>
              </div>
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
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p>No payment receipts found</p>
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
                    {getPaymentMethodIcon(entry.method || entry.paymentMode)}{" "}
                    {entry.method || entry.paymentMode} •{" "}
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

      {showOpeningBalanceModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowOpeningBalanceModal(false)}
        >
          <div
            className="opening-balance-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Set Opening Balance</h2>
              <button
                className="close-modal"
                onClick={() => setShowOpeningBalanceModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Set the opening balance for{" "}
                {activeBook === "cash" ? "Cash" : "Bank"} Book. This can only be
                set once and cannot be edited later.
              </p>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter opening balance"
                  value={openingBalanceAmount}
                  onChange={(e) => setOpeningBalanceAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowOpeningBalanceModal(false);
                  setOpeningBalanceAmount("");
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSetOpeningBalance}>
                Set Opening Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
