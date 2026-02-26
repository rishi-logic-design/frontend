import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiDownload,
  FiEye,
  FiTrash2,
} from "react-icons/fi";
import { FaSortAmountDown } from "react-icons/fa";
import salesDebitNoteService from "../../services/salesDebitNoteService";
import { toast } from "react-toastify";
import RecordPaymentDrawer from "./RecordPaymentDrawer";
import "./salesDebit.scss";

const SalesDebit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debitNotes, setDebitNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    unpaid: 0,
    paid: 0,
    partiallyPaid: 0,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchDebitNotes();
  }, []);

  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const res = await salesDebitNoteService.getSalesDebitNotes();
      const list = res?.data?.rows || res?.rows || res || [];
      setDebitNotes(list);
      calculateStats(list);
    } catch (error) {
      console.error("Error fetching debit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    const s = { total: 0, unpaid: 0, paid: 0, partiallyPaid: 0 };
    list.forEach((item) => {
      const amt = parseFloat(item.finalAmount || item.totalAmount) || 0;
      s.total += amt;
      const status = (item.status || "").toLowerCase();
      if (status === "pending" || status === "unpaid") s.unpaid += amt;
      else if (status === "completed" || status === "paid") s.paid += amt;
      else if (
        status === "partial" ||
        status === "partially paid" ||
        status === "partiallypaid"
      )
        s.partiallyPaid += amt;
    });
    setStats(s);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this sales debit note?")) {
      try {
        await salesDebitNoteService.deleteSalesDebitNote(id);
        const newList = debitNotes.filter((n) => (n._id || n.id) !== id);
        setDebitNotes(newList);
        calculateStats(newList);
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  const handleRecordPayment = (note) => {
    setSelectedNote(note);
    setIsDrawerOpen(true);
  };

  const filteredData = debitNotes.filter((n) => {
    const matchesSearch =
      (n.noteNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.customerName || n.customer?.customerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || n.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
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

  return (
    <div className="sales-debit-container">
      <div className="page-header">
        <div className="header-left">
          <h1>
            Sales Debit Note <span className="v-badge">v2</span>
          </h1>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            <FiCalendar className="calendar-icon" />
            <span>01/04/2025 → 31/03/2026</span>
          </div>
          <button
            className="create-btn"
            onClick={() => navigate("/vendor/new-sales-debit")}
          >
            + Sales Debit Note
          </button>
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
              Total Sales ({debitNotes.length})
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
              ₹{stats.unpaid.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">
              Unpaid (
              {
                debitNotes.filter((n) =>
                  ["pending", "unpaid"].includes(n.status?.toLowerCase()),
                ).length
              }
              )
            </span>
            <span className="stat-value">
              ₹{stats.unpaid.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "completed" ? "active" : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            <div className="stat-tooltip">
              ₹{stats.paid.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">
              Paid (
              {
                debitNotes.filter((n) =>
                  ["completed", "paid"].includes(n.status?.toLowerCase()),
                ).length
              }
              )
            </span>
            <span className="stat-value">
              ₹{stats.paid.toLocaleString("en-IN")}
            </span>
          </div>
          <div
            className={`stat-card ${statusFilter === "partial" ? "active" : ""}`}
            onClick={() => setStatusFilter("partial")}
          >
            <div className="stat-tooltip">
              ₹{stats.partiallyPaid.toLocaleString("en-IN")}
            </div>
            <span className="stat-label">
              Partially Paid (
              {
                debitNotes.filter((n) =>
                  ["partial", "partially paid", "partiallypaid"].includes(
                    n.status?.toLowerCase(),
                  ),
                ).length
              }
              )
            </span>
            <span className="stat-value">
              ₹{stats.partiallyPaid.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
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
          <div className="toolbar-btns">
            <button className="tool-btn">
              <FiFilter /> Filters
            </button>
            <button className="tool-btn">
              <FaSortAmountDown /> Sort by
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="table-wrapper">
          <table className="debit-table">
            <thead>
              <tr>
                <th>Sales Debit Note No.</th>
                <th>Date</th>
                <th>Buyer Name</th>
                <th>Due in</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="loading-cell">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((n) => (
                  <tr key={n._id || n.id}>
                    <td className="note-no">{n.noteNumber || "N/A"}</td>
                    <td>{formatDate(n.noteDate)}</td>
                    <td>
                      {n.customerName || n.customer?.customerName || "N/A"}
                    </td>
                    <td>
                      <span className="due-in">--</span>
                    </td>
                    <td className="amount-cell">
                      ₹{(n.finalAmount || n.totalAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      <div
                        className={`status-badge ${n.status?.toLowerCase() || "unpaid"}`}
                      >
                        {n.status === "pending"
                          ? "Unpaid"
                          : n.status || "Unpaid"}
                        {(n.status?.toLowerCase() === "unpaid" ||
                          n.status?.toLowerCase() === "pending") && (
                          <FiChevronDown style={{ marginLeft: "4px" }} />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        {(n.status?.toLowerCase() === "unpaid" ||
                          n.status?.toLowerCase() === "pending" ||
                          n.status?.toLowerCase() === "partial") && (
                          <button
                            className="record-payment-btn"
                            onClick={() => handleRecordPayment(n)}
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          title="Download"
                          onClick={() =>
                            salesDebitNoteService.downloadPDF(n.id)
                          }
                        >
                          <FiDownload />
                        </button>
                        <button
                          className="icon-btn"
                          title="More Actions"
                          onClick={() => {
                            // Logic for more actions dropdown could go here
                            toast.info(
                              "More actions clicked for " + n.noteNumber,
                            );
                          }}
                        >
                          <FiMoreVertical />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="6">
                    <div className="empty-state">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/6598/6598519.png"
                        alt="Empty"
                        className="empty-img"
                      />
                      <p>
                        No Sales Debit Note available, Create new Sales Debit
                        Note
                      </p>
                      <button
                        className="create-btn-inline"
                        onClick={() => navigate("/vendor/new-sales-debit")}
                      >
                        + Sales Debit Note
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-left">
            <span>Rows per page:</span>
            <select
              className="rows-select"
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
            <span className="entries-info">
              {startIndex + 1}-
              {Math.min(startIndex + rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length}
            </span>
          </div>
          <div className="pagination-right">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FiChevronLeft />
            </button>
            <button
              className="page-btn"
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
        data={selectedNote}
        type="sales_debit_note"
        onPaymentSuccess={fetchDebitNotes}
      />
    </div>
  );
};

export default SalesDebit;
