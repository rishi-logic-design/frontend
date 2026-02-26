import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaSort,
  FaDownload,
  FaEllipsisV,
  FaCalendarAlt,
} from "react-icons/fa";
import challanService from "../../services/challanService";
import { toast } from "react-toastify";
import "./challansList.scss";

const ChallansList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [challans, setChallans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchChallans();
  }, [location.state?.refresh]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const data = await challanService.getChallans();
      const list = Array.isArray(data) ? data : data?.rows || [];
      setChallans(list);
      calculateStats(list);
    } catch (error) {
      console.error("Error fetching challans:", error);
      toast.error("Failed to fetch challans. Please try again.");
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    const s = { total: 0, unpaidCount: 0, unpaidAmount: 0 };
    list.forEach((c) => {
      const total = parseFloat(
        c.totalWithGST || c.totalWithoutGST || c.total || 0,
      );
      s.total += total;
      s.unpaidCount++;
      s.unpaidAmount += total;
    });
    setStats(s);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredChallans = challans
    .filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (c.challanNumber || c.challanNo || "").toLowerCase().includes(search) ||
        (c.customerName || c.customer?.customerName || "")
          .toLowerCase()
          .includes(search);
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc")
        return (
          new Date(b.challanDate || b.createdAt) -
          new Date(a.challanDate || a.createdAt)
        );
      if (sortBy === "date-asc")
        return (
          new Date(a.challanDate || a.createdAt) -
          new Date(b.challanDate || b.createdAt)
        );
      if (sortBy === "amount-desc")
        return (b.totalWithGST || 0) - (a.totalWithGST || 0);
      if (sortBy === "amount-asc")
        return (a.totalWithGST || 0) - (b.totalWithGST || 0);
      return 0;
    });

  const totalPages = Math.ceil(filteredChallans.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginated = filteredChallans.slice(startIndex, endIndex);

  return (
    <div className="challans-list-page">
      <div className="list-header">
        <div className="header-left">
          <h1 className="page-title">Delivery Challans</h1>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            <FaCalendarAlt className="calendar-icon" />
            <span>01/04/2025 → 31/03/2026</span>
          </div>
          <button
            className="create-btn"
            onClick={() => navigate("/vendor/new-challan")}
          >
            <FaPlus /> <span>Create Challan</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div
          className={`stat-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="stat-label">Total Challans ({challans.length})</span>
          <span className="stat-value">
            ₹{stats.total.toLocaleString("en-IN")}
          </span>
        </div>
        <div
          className={`stat-card ${statusFilter === "unpaid" ? "active" : ""}`}
          onClick={() => setStatusFilter("unpaid")}
        >
          <span className="stat-label">Unpaid ({stats.unpaidCount})</span>
          <span className="stat-value">
            ₹{stats.unpaidAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="main-card">
        <div className="toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search challans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button
              className="toolbar-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            <button
              className="toolbar-btn"
              onClick={() => setShowSort(!showSort)}
            >
              <FaSort /> Sort by
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <table className="list-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Date</th>
                  <th>Buyer Name</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((c) => (
                    <tr key={c._id || c.id}>
                      <td
                        className="challan-no"
                        onClick={() =>
                          navigate(`/vendor/challan-details/${c._id || c.id}`)
                        }
                      >
                        {c.challanNumber || c.challanNo || "N/A"}
                      </td>
                      <td>{formatDate(c.challanDate || c.createdAt)}</td>
                      <td>
                        {c.customerName || c.customer?.customerName || "N/A"}
                      </td>
                      <td className="amount">
                        ₹{(c.totalWithGST || c.total || 0).toLocaleString()}
                      </td>
                      <td className="actions">
                        <button
                          className="action-icon"
                          onClick={() =>
                            challanService.downloadPDF(c._id || c.id)
                          }
                        >
                          <FaDownload />
                        </button>
                        <button className="action-icon">
                          <FaEllipsisV />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      No challans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            {startIndex + 1}–{Math.min(endIndex, filteredChallans.length)} of{" "}
            {filteredChallans.length}
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

export default ChallansList;
