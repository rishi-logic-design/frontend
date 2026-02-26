import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaFilter,
  FaPlus,
  FaCloudUploadAlt,
  FaEye,
  FaChevronRight,
  FaHistory,
  FaLayerGroup,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import purchaseService from "../../services/purchaseService";
import "./purchaseList.scss";

const PurchaseList = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
  });
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState({
    show: false,
    type: "confirm",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    fetchPurchases();
  }, [currentPage, rowsPerPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchPurchases();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await purchaseService.getPurchases({
        page: currentPage,
        size: rowsPerPage,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      const data = res?.data || res;
      const rows = data?.rows || [];
      setPurchases(rows);

      const newStats = {
        totalCount: data?.total || rows.length,
        totalAmount: rows.reduce(
          (acc, p) => acc + parseFloat(p.totalAmount),
          0,
        ),
        paidAmount: rows.reduce((acc, p) => acc + parseFloat(p.paidAmount), 0),
        pendingAmount: rows.reduce(
          (acc, p) => acc + parseFloat(p.pendingAmount),
          0,
        ),
        paidCount: rows.filter((p) => (p.status || "").toLowerCase() === "paid")
          .length,
        partialCount: rows.filter(
          (p) => (p.status || "").toLowerCase() === "partial",
        ).length,
        unpaidCount: rows.filter(
          (p) => (p.status || "").toLowerCase() === "unpaid",
        ).length,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDelete = async (id) => {
    setModal({
      show: true,
      type: "confirm",
      message:
        "This action will permanently delete this purchase record. Proceed with caution.",
      onConfirm: async () => {
        try {
          await purchaseService.deletePurchase(id);
          setModal({
            show: true,
            type: "success",
            message: "Purchase record deleted successfully.",
          });
          fetchPurchases();
        } catch (error) {
          setModal({
            show: true,
            type: "error",
            message: error.message || "Failed to delete record.",
          });
        }
      },
    });
  };

  const handlePayClick = (purchase) => {
    navigate("/vendor/add-payment-made", { state: { purchase } });
  };

  const totalPages = Math.ceil(stats.totalCount / rowsPerPage);

  return (
    <div className="purchase-intelligence-view">
      {modal.show && (
        <div className="modal-overlay-blur">
          <div className={`premium-glow-modal ${modal.type}`}>
            <div className="modal-head">
              {modal.type === "confirm" && (
                <FaExclamationCircle className="txt-warning" />
              )}
              {modal.type === "success" && (
                <FaCheckCircle className="txt-success" />
              )}
              {modal.type === "error" && (
                <FaExclamationCircle className="txt-danger" />
              )}
            </div>
            <h3>
              {modal.type === "confirm"
                ? "Delete Confirmation"
                : "Process Result"}
            </h3>
            <p>{modal.message}</p>
            <div className="modal-foot">
              {modal.type === "confirm" ? (
                <>
                  <button
                    className="btn-lite"
                    onClick={() => setModal({ ...modal, show: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger-solid"
                    onClick={() => {
                      modal.onConfirm();
                      setModal({ ...modal, show: false });
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary-solid"
                  onClick={() => setModal({ ...modal, show: false })}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="page-title-bar">
        <div className="title-block">
          <nav className="breadcrumb-nav">
            <span>Inventory</span> <FaChevronRight />{" "}
            <span className="current">Purchases</span>
          </nav>
          <h1>Purchase History</h1>
          <p>Manage your inventory acquisitions and vendor liabilities.</p>
        </div>
        <div className="title-actions">
          <button
            className="action-btn-outline"
            onClick={() => navigate("/vendor/upload-purchase")}
          >
            <FaCloudUploadAlt /> Upload Bill
          </button>
          <button
            className="action-btn-primary"
            onClick={() => navigate("/vendor/new-purchase")}
          >
            <FaPlus /> New Purchase
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        <div className="metric-card gold-border">
          <div className="metric-text">
            <span className="label">Total Amount</span>
            <span className="value">{formatCurrency(stats.totalAmount)}</span>
            <span className="meta">
              <FaHistory /> {stats.totalCount} Invoices
            </span>
          </div>
          <div className="metric-icon-box gold">
            <FaFileInvoiceDollar />
          </div>
        </div>
        <div className="metric-card emerald-border">
          <div className="metric-text">
            <span className="label">Amount Paid</span>
            <span className="value txt-emerald">
              {formatCurrency(stats.paidAmount)}
            </span>
            <span className="meta">
              <FaCheckCircle /> {stats.paidCount} Fully Paid
            </span>
          </div>
          <div className="metric-icon-box emerald">
            <FaCheckCircle />
          </div>
        </div>
        <div className="metric-card ruby-border">
          <div className="metric-text">
            <span className="label">Outstanding Balance</span>
            <span className="value txt-ruby">
              {formatCurrency(stats.pendingAmount)}
            </span>
            <span className="meta">
              <FaClock /> {stats.unpaidCount + stats.partialCount} Pending
            </span>
          </div>
          <div className="metric-icon-box ruby">
            <FaClock />
          </div>
        </div>
      </section>

      <main className="records-base">
        <div className="base-toolbar">
          <div className="search-engine">
            <FaSearch className="s-icon" />
            <input
              type="text"
              placeholder="Search by Invoice # or Seller Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-engine">
            <div className="filter-label">
              <FaFilter /> Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="table-flow">
          <table className="premium-log-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Seller</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">Balance</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan="6">
                      <div className="shimmer-bar"></div>
                    </td>
                  </tr>
                ))
              ) : purchases.length > 0 ? (
                purchases.map((p) => {
                  const status = (p.status || "unpaid").toLowerCase();
                  const balance = parseFloat(p.pendingAmount);
                  return (
                    <tr key={p.id} className="sequence-row">
                      <td className="id-cell">
                        <div className="seq-id">#{p.purchaseNumber}</div>
                        <div className="seq-date">
                          {formatDate(p.purchaseDate)}
                        </div>
                      </td>
                      <td className="supplier-cell">
                        <div className="sup-name">
                          {p.seller?.vendorName || "Unknown Seller"}
                        </div>
                        {p.seller?.businessName && (
                          <div className="sup-meta">
                            {p.seller.businessName}
                          </div>
                        )}
                      </td>
                      <td className="text-right valuation-cell">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td
                        className={`text-right balance-cell ${balance > 0 ? "deficit" : "surplus"}`}
                      >
                        {formatCurrency(balance)}
                      </td>
                      <td className="text-center">
                        <span className={`status-tag ${status}`}>{status}</span>
                      </td>
                      <td className="ops-cell">
                        <div className="ops-cluster">
                          {balance > 0 && (
                            <button
                              className="ops-btn-pay"
                              onClick={() => handlePayClick(p)}
                            >
                              Pay Now
                            </button>
                          )}
                          <div className="quick-ops">
                            {p.billImage && (
                              <button
                                className="q-btn view"
                                onClick={() =>
                                  window.open(p.billImage, "_blank")
                                }
                                title="View Bill"
                              >
                                <FaEye />
                              </button>
                            )}
                            <button className="q-btn edit" title="Edit">
                              <FaEdit />
                            </button>
                            <button
                              className="q-btn delete"
                              onClick={() => handleDelete(p.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-universe">
                      <FaLayerGroup />
                      <h3>No Records Found</h3>
                      <p>
                        Your search or filter criteria yielded no records in the
                        purchase history.
                      </p>
                      <button
                        className="btn-reset"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="base-pagination">
          <div className="pagi-text">
            Showing: <strong>{purchases.length}</strong> of{" "}
            <strong>{stats.totalCount}</strong> records
          </div>
          <div className="pagi-engine">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagi-btn"
            >
              <FaArrowLeft /> Previous
            </button>
            <div className="pagi-active">
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages || 1}</strong>
            </div>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagi-btn"
            >
              Next <FaArrowRight />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default PurchaseList;
