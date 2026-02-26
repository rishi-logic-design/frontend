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
  FaCalendarAlt,
} from "react-icons/fa";
import billService from "../../services/billService";
import { toast } from "react-toastify";
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

  useEffect(() => {
    fetchBills();
  }, [location.state?.refresh]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const billsData = await billService.getBills({ size: 1000 });
      const billsRes =
        billsData?.rows || (Array.isArray(billsData) ? billsData : []);
      setBills(billsRes);
      calculateStats(billsRes);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch bills. Please try again.");
      setBills([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (billsData) => {
    const stats = { totalSales: 0, unpaid: 0, paid: 0, partiallyPaid: 0 };
    billsData.forEach((bill) => {
      const total = parseFloat(bill.totalAmount || bill.total || 0);
      stats.totalSales += total;
      const status = bill.status?.toLowerCase()?.replace(" ", "_") || "pending";
      if (status === "paid") stats.paid += total;
      else if (status === "unpaid" || status === "pending")
        stats.unpaid += total;
      else if (status === "partially_paid" || status === "partial")
        stats.partiallyPaid += total;
    });
    setStats(stats);
  };

  const getStatusCount = (statusToCount) => {
    const targetStatus = statusToCount?.toLowerCase();
    return bills.filter((b) => {
      const bStatus = b.status?.toLowerCase()?.replace(" ", "_") || "pending";
      if (targetStatus === "unpaid" || targetStatus === "pending")
        return bStatus === "unpaid" || bStatus === "pending";
      if (targetStatus === "partially_paid" || targetStatus === "partial")
        return bStatus === "partially_paid" || bStatus === "partial";
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

  const filteredBills = bills
    .filter((bill) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (bill.billNumber || bill.billNo || "")
          .toLowerCase()
          .includes(searchLower) ||
        (bill.customerName || bill.customer?.customerName || "")
          .toLowerCase()
          .includes(searchLower);

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
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredBills.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  return (
    <div className="bills-list-page">
      <div className="bills-header">
        <div className="header-left">
          <h1 className="page-title">Invoices</h1>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            <FaCalendarAlt className="calendar-icon" />
            <span>01/04/2025 → 31/03/2026</span>
          </div>
          <button
            className="create-btn"
            onClick={() => navigate("/vendor/new-bill")}
          >
            <FaPlus /> <span>Create Invoice</span>
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div
            className={`stat-card ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span className="stat-label">Total Invoices ({bills.length})</span>
            <span className="stat-value">
              ₹{stats.totalSales.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <span className="stat-label">
              Unpaid ({getStatusCount("unpaid")})
            </span>
            <span className="stat-value">
              ₹{stats.unpaid.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("paid")}
          >
            <span className="stat-label">Paid ({getStatusCount("paid")})</span>
            <span className="stat-value">
              ₹{stats.paid.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "partially_paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("partially_paid")}
          >
            <span className="stat-label">
              Partially Paid ({getStatusCount("partially_paid")})
            </span>
            <span className="stat-value">
              ₹{stats.partiallyPaid.toLocaleString("en-IN")}
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
              placeholder="Search invoices..."
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
                    <td
                      className="invoice-no"
                      onClick={() =>
                        navigate(`/vendor/bill-details/${bill._id || bill.id}`)
                      }
                    >
                      {bill.billNumber || "N/A"}
                    </td>
                    <td>{formatDate(bill.billDate || bill.createdAt)}</td>
                    <td>
                      {bill.customerName ||
                        bill.customer?.customerName ||
                        "N/A"}
                    </td>
                    <td className="amount">
                      ₹{(bill.total || bill.totalAmount || 0).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(bill.status || "partial")}</td>
                    <td>
                      <div className="actions-cell">
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
                          onClick={() =>
                            billService.downloadPDF(bill._id || bill.id)
                          }
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
                <FaPlus /> <span>Create Invoice</span>
              </button>
            </div>
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
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
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
            <button className="page-btn active">{currentPage}</button>
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
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillsList;
