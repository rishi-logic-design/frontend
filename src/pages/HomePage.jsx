import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./homePage.scss";
import billService from "../services/billService";
import challanService from "../services/challanService";
import AnimatedAmount from "../utils/AnimatedAmount";
import vendorService from "../services/vendorService";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendorData, setVendorData] = useState(null);

  const [collectionAmount, setCollectionAmount] = useState(0);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [activeTab, setActiveTab] = useState("challan");
  const [searchQuery, setSearchQuery] = useState("");
  const [challans, setChallans] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const getVendorId = () => {
    const vd = JSON.parse(localStorage.getItem("vendorData"));
    return vd?.id || null;
  };

  useEffect(() => {
    fetchCollectionAmount();
    fetchChallans();
    fetchBills();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 Refreshing home page data...");
      fetchCollectionAmount();
      fetchBills();
      fetchChallans();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const vendorId = getVendorId();
        if (!vendorId) return;

        const res = await vendorService.getVendorById(vendorId);
        setVendorData(res.data || res);
      } catch (err) {
        console.error("Failed to load vendor", err);
      }
    };

    loadVendor();
  }, []);

  const fetchCollectionAmount = async () => {
    setLoadingCollection(true);
    try {
      const data = await billService.getPendingCollectionTotal();
      setCollectionAmount(Math.floor(Number(data.totalPendingAmount) || 0));
    } catch (error) {
      console.error("Failed to fetch collection amount", error);
      setCollectionAmount(0);
    } finally {
      setLoadingCollection(false);
    }
  };

  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await challanService.getChallans();
      console.log("challans", data);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      setChallans(rows);
    } catch (error) {
      console.error("Failed to fetch challans", error);
      setError("Failed to load challans");
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔥 Fetching bills...");
      const data = await billService.getBills();
      console.log("✅ Bills received:", data);

      const rows = Array.isArray(data.rows) ? data.rows : [];
      setBills(rows);
    } catch (error) {
      console.error("❌ Failed to fetch bills:", error);
      setError("Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChallan = () => {
    navigate("/vendor/new-challan");
  };

  const handleNewBill = () => {
    navigate("/vendor/new-bill");
  };

  const handleAddPayment = () => {
    navigate("/vendor/add-payment");
  };

  const handleItemClick = (id) => {
    if (activeTab === "challan") {
      navigate(`/vendor/challan-details/${id}`);
    } else {
      navigate(`/vendor/bill-details/${id}`);
    }
  };

  const getCurrentData = () => {
    let data = activeTab === "challan" ? challans : bills;

    // Apply status filter
    if (filterStatus !== "all") {
      data = data.filter((item) => {
        const status = getStatus(item);
        return status === filterStatus;
      });
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      let startDate;

      if (dateRange === "1month") {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (dateRange === "3months") {
        startDate = new Date(now.setMonth(now.getMonth() - 3));
      } else if (dateRange === "1year") {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      } else if (dateRange === "custom" && customFromDate) {
        startDate = new Date(customFromDate);
      }

      data = data.filter((item) => {
        const itemDate = new Date(
          item.createdAt || item.date || item.billDate || item.challanDate,
        );

        if (dateRange === "custom") {
          const from = customFromDate ? new Date(customFromDate) : null;
          const to = customToDate ? new Date(customToDate) : new Date();

          if (from && to) {
            return itemDate >= from && itemDate <= to;
          } else if (from) {
            return itemDate >= from;
          }
          return true;
        }

        return itemDate >= startDate;
      });
    }

    return data;
  };

  const groupedData = () => {
    const data = getCurrentData();

    if (!data || data.length === 0) {
      return [];
    }

    const grouped = {};

    data.forEach((item) => {
      const customer = item.customer || item.customerId || {};
      const customerId =
        customer._id || customer.id || item.customerId || "unknown";
      const customerName =
        customer.name ||
        customer.customerName ||
        item.customerName ||
        "Unknown Customer";

      if (!grouped[customerId]) {
        grouped[customerId] = {
          customerId,
          customerName,
          items: [],
        };
      }

      grouped[customerId].items.push(item);
    });

    const result = Object.values(grouped);
    return result;
  };

  const filteredData = () => {
    const data = groupedData();
    if (!searchQuery.trim()) return data;

    return data.filter((group) =>
      group.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const getBillAmount = (bill) => {
    if (bill.totalWithGST != null) return Number(bill.totalWithGST);
    if (bill.totalAmount != null) return Number(bill.totalAmount);
    if (bill.netAmount != null) return Number(bill.netAmount);
    if (bill.finalAmount != null) return Number(bill.finalAmount);

    if (Array.isArray(bill.items) && bill.items.length > 0) {
      return bill.items.reduce((sum, item) => {
        if (item.totalWithGst != null) {
          return sum + Number(item.totalWithGst);
        }

        const qty = Number(item.qty ?? item.quantity ?? 1);
        const rate = Number(item.pricePerUnit ?? item.rate ?? 0);
        return sum + qty * rate;
      }, 0);
    }

    if (bill.status === "paid") return 0;

    return 0;
  };

  const getStatus = (item) => {
    const status = item.status || item.paymentStatus || "unpaid";
    return status.toLowerCase();
  };

  const currentData = filteredData();

  return (
    <div className="homepage">
      <div className="homepage-header">
        <div className="vendor-info">
          <div className="vendor-avatar">
            <span>
              {vendorData?.vendorName?.charAt(0)?.toUpperCase() || "👤"}
            </span>
          </div>

          <h1>{vendorData?.vendorName || "Loading..."}</h1>
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            title="Filter"
            onClick={() => setShowFilterModal(true)}
          >
            <span>☰</span>
          </button>
        </div>
      </div>

      <div className="collections-summary">
        <div className="collection">
          <h2>Your Collections</h2>
          <div className="amount-display">
            <span className="currency">₹</span>
            <span className="amount">
              {loadingCollection ? (
                "0"
              ) : (
                <AnimatedAmount value={collectionAmount} />
              )}
            </span>
          </div>
          <p className="amount-label">Last 30 Days Pending Amount</p>
        </div>

        <div className="action-buttons-top">
          <button className="action-btn-small" onClick={handleNewChallan}>
            New Challan
          </button>
          <button className="action-btn-small" onClick={handleNewBill}>
            New Bill
          </button>
          <button className="action-btn-small" onClick={handleAddPayment}>
            Add Payment
          </button>
        </div>
      </div>

      <div className="content-section">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "challan" ? "active" : ""}`}
            onClick={() => setActiveTab("challan")}
          >
            Challan ({challans.length})
          </button>
          <button
            className={`tab ${activeTab === "billing" ? "active" : ""}`}
            onClick={() => setActiveTab("billing")}
          >
            Billing ({bills.length})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search Customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="customers-list">
          {loading ? (
            <div className="loading-state">
              <p>Loading {activeTab === "challan" ? "challans" : "bills"}...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button
                onClick={activeTab === "challan" ? fetchChallans : fetchBills}
                className="retry-btn"
              >
                Retry
              </button>
            </div>
          ) : currentData.length === 0 ? (
            <div className="no-results">
              <p>
                {searchQuery
                  ? `No customers found matching "${searchQuery}"`
                  : `No ${activeTab === "challan" ? "challans" : "bills"} found`}
              </p>
            </div>
          ) : (
            currentData.map((group) => (
              <div key={group.customerId} className="customer-card">
                <div className="customer-header">
                  <div className="customer-id">{group.customerName}</div>
                  <div className="customer-name">
                    {group.items.length}{" "}
                    {activeTab === "challan" ? "Challan(s)" : "Bill(s)"}
                  </div>
                </div>
                <div className="transactions">
                  {group.items.map((item) => (
                    <div
                      key={item._id || item.id}
                      className="transaction-item"
                      onClick={() => handleItemClick(item._id || item.id)}
                    >
                      <span className="transaction-date">
                        {formatDate(
                          item.createdAt ||
                            item.date ||
                            item.billDate ||
                            item.challanDate,
                        )}
                      </span>
                      <span className="transaction-amount">
                        ₹{getBillAmount(item).toLocaleString()}
                      </span>
                      <span
                        className={`status-dot ${
                          getStatus(item) === "paid" ? "completed" : "pending"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showFilterModal && (
        <div
          className="filter-modal-overlay"
          onClick={() => setShowFilterModal(false)}
        >
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-header">
              <h3>Select Date Range</h3>
              <button
                className="close-btn"
                onClick={() => setShowFilterModal(false)}
              >
                ×
              </button>
            </div>
            <div className="filter-body">
              <div className="date-range-buttons">
                <button
                  className={`date-range-btn ${dateRange === "1month" ? "active" : ""}`}
                  onClick={() => setDateRange("1month")}
                >
                  Last 1 month
                </button>
                <button
                  className={`date-range-btn ${dateRange === "3months" ? "active" : ""}`}
                  onClick={() => setDateRange("3months")}
                >
                  Last 3 month
                </button>
                <button
                  className={`date-range-btn ${dateRange === "1year" ? "active" : ""}`}
                  onClick={() => setDateRange("1year")}
                >
                  Last 1 Year
                </button>
              </div>

              <button
                className={`custom-range-btn ${dateRange === "custom" ? "active" : ""}`}
                onClick={() => setDateRange("custom")}
              >
                Custom Date Range
              </button>

              {dateRange === "custom" && (
                <div className="custom-date-inputs">
                  <div className="date-input-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}

              <div className="status-filter-section">
                <h4>Payment Status</h4>
                <div className="filter-option">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="all"
                      checked={filterStatus === "all"}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    />
                    <span>All</span>
                  </label>
                </div>
                <div className="filter-option">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="paid"
                      checked={filterStatus === "paid"}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    />
                    <span>Paid</span>
                  </label>
                </div>
                <div className="filter-option">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="unpaid"
                      checked={filterStatus === "unpaid"}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    />
                    <span>Unpaid</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear-btn"
                onClick={() => {
                  setFilterStatus("all");
                  setDateRange("all");
                  setCustomFromDate("");
                  setCustomToDate("");
                }}
              >
                Clear
              </button>
              <button
                className="apply-btn"
                onClick={() => setShowFilterModal(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
