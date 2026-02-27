import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiArrowUpRight,
  FiTrendingUp,
  FiPackage,
  FiUser,
  FiCreditCard,
  FiRefreshCw,
  FiShoppingBag,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./homePage.scss";
import billService from "../services/billService";
import challanService from "../services/challanService";
import inventoryService from "../services/inventoryService";
import AnimatedAmount from "../utils/AnimatedAmount";
import vendorService from "../services/vendorService";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendorData, setVendorData] = useState(null);
  const [collectionAmount, setCollectionAmount] = useState(0);

  const [challans, setChallans] = useState([]);
  const [bills, setBills] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCollection, setLoadingCollection] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const getVendorId = () => {
    const vd = JSON.parse(localStorage.getItem("vendorData"));
    return vd?.id || null;
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCollectionAmount(),
          fetchChallans(),
          fetchBills(),
          fetchInventoryStats(),
          loadVendor(),
        ]);
      } catch (err) {
        console.error("Initialization error", err);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchCollectionAmount();
      fetchBills();
      fetchChallans();
      fetchInventoryStats();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    try {
      const data = await challanService.getChallans();
      setChallans(Array.isArray(data.rows) ? data.rows : []);
    } catch (error) {
      console.error("Failed to fetch challans", error);
      setChallans([]);
    }
  };

  const fetchBills = async () => {
    try {
      const data = await billService.getBills();
      setBills(Array.isArray(data.rows) ? data.rows : []);
    } catch (error) {
      console.error("Failed to fetch bills", error);
      setBills([]);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const stats = await inventoryService.getStats();
      setInventoryStats(stats);
    } catch (error) {
      console.error("Failed to fetch inventory stats", error);
    }
  };

  const handleNewChallan = () => navigate("/vendor/new-challan");
  const handleNewBill = () => navigate("/vendor/new-bill");
  const handleAddPayment = () => navigate("/vendor/add-payment");

  const getStatus = (item) => {
    const status = item.status || item.paymentStatus || "unpaid";
    return status.toLowerCase();
  };

  const getBillAmount = (bill) => {
    if (bill.totalWithGST != null) return Number(bill.totalWithGST);
    if (bill.totalAmount != null) return Number(bill.totalAmount);
    if (bill.netAmount != null) return Number(bill.netAmount);
    return 0;
  };

  // Top Customers Logic
  const topCustomers = useMemo(() => {
    const customerMap = {};
    bills.forEach((bill) => {
      const customer = bill.customer || {};
      const id = customer._id || customer.id || bill.customerId;
      const name = customer.name || bill.customerName || "Unknown";
      if (!id) return;
      if (!customerMap[id]) customerMap[id] = { name, total: 0, count: 0 };
      customerMap[id].total += getBillAmount(bill);
      customerMap[id].count += 1;
    });
    return Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [bills]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    const combined = [
      ...bills.map((b) => ({ ...b, type: "Bill" })),
      ...challans.map((c) => ({ ...c, type: "Challan" })),
    ];
    return combined
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
      )
      .slice(0, 6);
  }, [bills, challans]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      })
      .reverse();

    return last7Days.map((date) => {
      const dayBills = bills.filter((b) =>
        (b.createdAt || b.billDate || "").startsWith(date),
      );
      const amount = dayBills.reduce((sum, b) => sum + getBillAmount(b), 0);
      return {
        name: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
        amount,
      };
    });
  }, [bills]);

  const stats = [
    {
      label: "Total Collection",
      value: collectionAmount,
      icon: <FiTrendingUp />,
      color: "#3b82f6",
      prefix: "₹",
    },
    {
      label: "Active Challans",
      value: challans.length,
      icon: <FiPackage />,
      color: "#10b981",
      prefix: "",
    },
    {
      label: "Total Bills",
      value: bills.length,
      icon: <FiCreditCard />,
      color: "#6366f1",
      prefix: "",
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <motion.div
      className="dashboard-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* --- HEADER --- */}
      <header className="dash-header">
        <div className="welcome-box">
          <div className="avatar-wrapper">
            <div className="avatar">
              {vendorData?.vendorName?.charAt(0)?.toUpperCase() || "👤"}
            </div>
            <div className="online-indicator" />
          </div>
          <div className="text">
            <span>Welcome back,</span>
            <h1>{vendorData?.vendorName || "Business Owner"}</h1>
          </div>
        </div>

        <div className="header-controls">
          <button className="create-shortcut" onClick={handleNewBill}>
            <FiPlus /> New Bill
          </button>
          <button
            className="control-btn"
            onClick={() => navigate("/vendor/account")}
          >
            <FiUser />
          </button>
          <button
            className="control-btn refresh"
            onClick={() => window.location.reload()}
          >
            <FiRefreshCw />
          </button>
        </div>
      </header>

      {/* --- STAT CARDS --- */}
      <section className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="stat-card"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div
              className="stat-icon"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-content">
              <p className="label">{stat.label}</p>
              <div className="value-row">
                <h3>
                  {stat.prefix}
                  <AnimatedAmount value={stat.value} />
                </h3>
              </div>
            </div>
            <div className="mini-chart">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={chartData}>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={stat.color}
                    fill={`${stat.color}20`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </section>

      {/* --- MAIN DASHBOARD WIDGETS --- */}
      <div className="dashboard-content-grid">
        {/* Revenue Chart */}
        <motion.div
          className="widget-card revenue-widget"
          variants={itemVariants}
        >
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <span className="badge">Last 7 Days</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Inventory Summary */}
        <motion.div
          className="widget-card inventory-widget"
          variants={itemVariants}
        >
          <div className="card-header">
            <h3>Inventory Status</h3>
            <FiPackage className="header-icon" />
          </div>
          <div className="inventory-stats">
            <div className="status-item">
              <div className="label">Total Products</div>
              <div className="value">{inventoryStats?.totalItems || 0}</div>
            </div>
            <div className="status-item warning">
              <div className="label">Low Stock</div>
              <div className="value">{inventoryStats?.lowStock || 0}</div>
            </div>
            <div className="status-sep" />
            <button
              className="view-all-btn"
              onClick={() => navigate("/vendor/inventory")}
            >
              Product Ledger <FiArrowUpRight />
            </button>
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          className="widget-card customers-widget"
          variants={itemVariants}
        >
          <div className="card-header">
            <h3>Top Customers</h3>
            <FiUsers className="header-icon" />
          </div>
          <div className="customers-list-mini">
            {topCustomers.map((cust, idx) => (
              <div key={idx} className="customer-row">
                <div className="cust-info">
                  <span className="rank">{idx + 1}</span>
                  <span className="name">{cust.name}</span>
                </div>
                <div className="cust-value">₹{cust.total.toLocaleString()}</div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="empty">No sales data</p>
            )}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          className="widget-card recent-widget"
          variants={itemVariants}
        >
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button
              className="link-btn"
              onClick={() => navigate("/vendor/bills")}
            >
              View All
            </button>
          </div>
          <div className="transaction-list-mini">
            {recentTransactions.map((tx, idx) => (
              <div
                key={idx}
                className="tx-item"
                onClick={() =>
                  navigate(
                    `/vendor/${tx.type === "Bill" ? "bill" : "challan"}-details/${
                      tx._id || tx.id
                    }`,
                  )
                }
              >
                <div className={`tx-type-icon ${tx.type.toLowerCase()}`}>
                  {tx.type === "Bill" ? <FiDollarSign /> : <FiShoppingBag />}
                </div>
                <div className="tx-info">
                  <span className="tx-title">
                    {tx.customer?.name || tx.customerName || "Walk-in"}
                  </span>
                  <span className="tx-date">
                    {formatDate(tx.createdAt || tx.date)} • {tx.type}
                  </span>
                </div>
                <div className="tx-amount">
                  ₹{getBillAmount(tx).toLocaleString()}
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="empty">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div
          className="widget-card quick-actions-widget"
          variants={itemVariants}
        >
          <h3>Dashboard Shortcuts</h3>
          <div className="shortcut-grid">
            <button onClick={handleNewChallan}>
              <div className="s-icon purple">
                <FiPlus />
              </div>
              <span>Challan</span>
            </button>
            <button onClick={handleNewBill}>
              <div className="s-icon blue">
                <FiPackage />
              </div>
              <span>Invoice</span>
            </button>
            <button onClick={handleAddPayment}>
              <div className="s-icon green">
                <FiCreditCard />
              </div>
              <span>Payment</span>
            </button>
            <button onClick={() => navigate("/vendor/ewaybill")}>
              <div className="s-icon orange">
                <FiTrendingUp />
              </div>
              <span>e-Waybill</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomePage;
