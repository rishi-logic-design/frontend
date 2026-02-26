import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiTrash2,
  FiCalendar,
  FiEdit,
} from "react-icons/fi";
import { MdPayments } from "react-icons/md";
import creditNoteService from "../../services/creditNoteService";
import { toast } from "react-toastify";
import RecordPaymentDrawer from "./RecordPaymentDrawer";
import "./creditNote.scss";

const CreditNote = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Credit Note", "Sales Return"];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCN, setSelectedCN] = useState(null);

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const calculateStats = (list) => {
    const s = { total: 0, pending: 0, completed: 0, cancelled: 0 };
    list.forEach((item) => {
      const amt = parseFloat(item.totalAmount || 0);
      s.total += amt;
      const status = (item.status || "").toLowerCase();
      if (status === "pending") s.pending += amt;
      else if (status === "completed" || status === "paid") s.completed += amt;
      else if (status === "cancelled") s.cancelled += amt;
    });
    setStats(s);
  };

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const res = await creditNoteService.getCreditNotes();
      const list = res?.data?.rows || res?.rows || res || [];
      setCreditNotes(list);
      calculateStats(list);
    } catch (error) {
      console.error("Error fetching credit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this credit note?")) {
      try {
        await creditNoteService.deleteCreditNote(id);
        const newList = creditNotes.filter((cn) => (cn._id || cn.id) !== id);
        setCreditNotes(newList);
        calculateStats(newList);
      } catch (error) {
        toast.error("Failed to delete: " + error.message);
      }
    }
  };

  const filteredData = creditNotes.filter((cn) => {
    const matchesSearch =
      (cn.noteNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cn.customerName || cn.customer?.customerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === "All" || cn.type === activeTab;
    const matchesStatus =
      statusFilter === "all" || cn.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesTab && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRecordPayment = (cn) => {
    setSelectedCN(cn);
    setIsDrawerOpen(true);
  };

  return (
    <div className="credit-note-container">
      <div className="credit-note-header">
        <div className="header-left">
          <h1>Credit Notes / Sales Return</h1>
        </div>
        <div className="header-right">
          <div className="date-picker-box">
            <FiCalendar />
            <span>01/04/2025 → 31/03/2026</span>
          </div>
        </div>
      </div>

      <div className="top-section">
        <div className="stats-grid">
          <div
            className={`stat-card ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <div className="stat-tooltip">
              ₹{stats.total.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">
              Total Sales ({creditNotes.length})
            </span>
            <span className="stat-value">
              ₹{stats.total.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <div className="stat-tooltip">
              ₹{stats.pending.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">Unpaid</span>
            <span className="stat-value">
              ₹{stats.pending.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "completed" ? "active" : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            <div className="stat-tooltip">
              ₹{stats.completed.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">Paid</span>
            <span className="stat-value">
              ₹{stats.completed.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "cancelled" ? "active" : ""}`}
            onClick={() => setStatusFilter("cancelled")}
          >
            <div className="stat-tooltip">
              ₹{stats.cancelled.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">Cancelled</span>
            <span className="stat-value">
              ₹{stats.cancelled.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="main-card">
        <div className="toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Note No. or Buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="create-button"
            onClick={() => navigate("/vendor/new-credit-note")}
          >
            <FiPlus /> Create Credit Note
          </button>
        </div>

        <div className="table-wrapper">
          <table className="credit-note-table">
            <thead>
              <tr>
                <th>Note No.</th>
                <th>Date</th>
                <th>Buyer Name</th>
                <th>Type</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((cn) => (
                  <tr key={cn._id || cn.id}>
                    <td className="note-no">{cn.noteNumber || "N/A"}</td>
                    <td>{formatDate(cn.noteDate)}</td>
                    <td>
                      {cn.customerName || cn.customer?.customerName || "N/A"}
                    </td>
                    <td>
                      <span
                        className={`type-badge ${cn.type?.replace(" ", "-").toLowerCase()}`}
                      >
                        {cn.type}
                      </span>
                    </td>
                    <td className="amount-cell">
                      ₹{(cn.totalAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${cn.status?.toLowerCase() || "pending"}`}
                      >
                        {cn.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {cn.status?.toLowerCase() !== "paid" && (
                          <button
                            className="record-payment-btn"
                            onClick={() => handleRecordPayment(cn)}
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          className="icon-btn view"
                          title="View"
                          onClick={() =>
                            navigate(
                              `/vendor/view-credit-note/${cn._id || cn.id}`,
                            )
                          }
                        >
                          <FiEye />
                        </button>
                        <button
                          className="icon-btn edit"
                          title="Edit"
                          onClick={() =>
                            navigate(
                              `/vendor/edit-credit-note/${cn._id || cn.id}`,
                            )
                          }
                        >
                          <FiEdit />
                        </button>
                        <button className="icon-btn download" title="Download">
                          <FiDownload />
                        </button>
                        <button
                          className="icon-btn delete"
                          title="Delete"
                          onClick={() => handleDelete(cn._id || cn.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="empty-table-state">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/6598/6598519.png"
                        alt="Empty"
                      />
                      <p>
                        No {activeTab === "All" ? "records" : activeTab} found.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-footer">
          <div className="show-entries">
            <span>Show entries:</span>
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
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FiChevronLeft />
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      <RecordPaymentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={selectedCN}
        type="credit_note"
        onPaymentSuccess={fetchCreditNotes}
      />
    </div>
  );
};

export default CreditNote;
