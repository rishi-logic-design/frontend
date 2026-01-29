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

  const getVendorId = () => {
    const vd = JSON.parse(localStorage.getItem("vendorData"));
    return vd?.id || null;
  };

  // ✅ Initial load
  useEffect(() => {
    fetchCollectionAmount();
    fetchChallans();
    fetchBills();
  }, []);

  // ✅ Refresh when returning from payment page
  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 Refreshing home page data...");
      fetchCollectionAmount();
      fetchBills(); // Refresh bills to show updated status
      fetchChallans();
      // Clear the state
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
      console.log("📥 Fetching bills...");
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
    return activeTab === "challan" ? challans : bills;
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
    // ✅ Priority order for getting bill amount
    if (bill.totalWithGST != null) return Number(bill.totalWithGST);
    if (bill.totalAmount != null) return Number(bill.totalAmount);
    if (bill.netAmount != null) return Number(bill.netAmount);
    if (bill.finalAmount != null) return Number(bill.finalAmount);

    // Calculate from items if available
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

    // If paid, show 0
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
          <button className="icon-btn" title="Menu">
            <span>☰</span>
          </button>
          <button className="icon-btn" title="Notifications">
            <span>🔔</span>
          </button>
        </div>
      </div>

      <div className="collections-summary">
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
    </div>
  );
};

export default HomePage;
