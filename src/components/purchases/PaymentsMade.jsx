import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaWallet,
  FaCalendarAlt,
} from "react-icons/fa";
import purchasePaymentService from "../../services/purchasePaymentService";
import "./paymentsMade.scss";

const PaymentsMade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalAdvance: 0,
    count: 0,
    lastMonth: 0,
  });

  const [modal, setModal] = useState({
    show: false,
    type: "confirm",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    fetchPayments();
  }, [currentPage, rowsPerPage, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await purchasePaymentService.listPayments({
        page: currentPage,
        size: rowsPerPage,
        search: searchTerm,
      });

      const data = res?.data || res || {};
      const rows = data.rows || [];
      setPayments(rows);
      setTotalCount(data.total || rows.length || 0);

      // Calculate simple stats from the fetched rows (or ideally from a separate API)
      const total = rows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const advance = rows.reduce(
        (sum, p) => sum + parseFloat(p.advanceAmount || 0),
        0,
      );
      setStats({
        totalAmount: total,
        totalAdvance: advance,
        count: data.total || rows.length,
        lastMonth: rows.filter((p) => {
          const d = new Date(p.paymentDate);
          const m = new Date();
          return (
            d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
          );
        }).length,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setModal({
      show: true,
      type: "confirm",
      message:
        "Are you sure you want to delete this payment record? Balance updates for related purchases will be reversed.",
      onConfirm: async () => {
        try {
          await purchasePaymentService.deletePayment(id);
          setModal({
            show: true,
            type: "success",
            message: "Payment record deleted successfully!",
          });
          fetchPayments();
        } catch (err) {
          console.error("Error deleting payment:", err);
          setModal({
            show: true,
            type: "error",
            message: "Failed to delete payment",
          });
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val || 0);
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <div className="payments-made-page">
      {modal.show && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal ${modal.type}`}>
            <div className="modal-icon">
              {modal.type === "confirm" ? (
                <FaExclamationCircle className="warning" />
              ) : modal.type === "success" ? (
                <FaCheckCircle className="success" />
              ) : (
                <FaExclamationCircle className="error" />
              )}
            </div>
            <h3>
              {modal.type === "confirm"
                ? "Confirm Action"
                : modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}
            </h3>
            <p>{modal.message}</p>
            <div className="modal-actions">
              {modal.type === "confirm" ? (
                <>
                  <button
                    className="cancel-btn"
                    onClick={() => setModal({ ...modal, show: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="confirm-btn red"
                    onClick={() => {
                      modal.onConfirm();
                      setModal({ ...modal, show: false });
                    }}
                  >
                    Confirm Delete
                  </button>
                </>
              ) : (
                <button
                  className="close-btn"
                  onClick={() => setModal({ ...modal, show: false })}
                >
                  Ok
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="page-header-container">
        <div className="header-info">
          <h1>Payments History</h1>
          <p>View and manage all payments made to your sellers</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-dark"
            onClick={() => navigate("/vendor/add-payment-made")}
          >
            <FaPlus /> Record New Payment
          </button>
        </div>
      </div>

      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Total Payments</span>
            <h3 className="value">{stats.count}</h3>
          </div>
          <div className="stat-icon total">
            <FaCalendarAlt />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Total Paid Amount</span>
            <h3 className="value">{formatCurrency(stats.totalAmount)}</h3>
          </div>
          <div className="stat-icon amount">₹</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Advance Settled</span>
            <h3 className="value positive">
              {formatCurrency(stats.totalAdvance)}
            </h3>
          </div>
          <div className="stat-icon paid">✓</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Payments This Month</span>
            <h3 className="value">{stats.lastMonth}</h3>
          </div>
          <div className="stat-icon pending">
            <FaWallet />
          </div>
        </div>
      </div>

      <div className="main-content-card">
        <div className="toolbar-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Receipt No, Seller, Note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Seller Name</th>
                  <th>Payment Mode</th>
                  <th>Amount (₹)</th>
                  <th>Advance (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading Payments...</p>
                      </div>
                    </td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="receipt-tag">{p.receiptNumber}</span>
                      </td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td className="seller-name">
                        {p.seller?.vendorName || "N/A"}
                      </td>
                      <td>
                        <span
                          className={`mode-badge ${p.method?.toLowerCase()}`}
                        >
                          {p.method}
                        </span>
                      </td>
                      <td className="amt-cell text-success">
                        {parseFloat(p.amount).toFixed(2)}
                      </td>
                      <td className="amt-cell">
                        {parseFloat(p.advanceAmount || 0).toFixed(2)}
                      </td>
                      <td className="action-cell">
                        <div className="action-btns-group">
                          <button
                            className="delete-btn"
                            title="Delete Payment"
                            onClick={() => handleDelete(p.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-footer">
          <div className="rows-count">
            Showing {payments.length} of {totalCount} payments
          </div>
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="page-nav-btn"
            >
              <FaChevronLeft />
            </button>
            <div className="page-info">
              Page <span>{currentPage}</span> of {totalPages || 1}
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="page-nav-btn"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsMade;
