import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiClock,
  FiRotateCcw,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./bulkExport.scss";

const PAGE_SIZES = [10, 25, 50, 100];

const DOCUMENT_TYPES = [
  "INVOICE",
  "QUOTATION",
  "PURCHASE",
  "REVERSE CHARGE",
  "DELIVERY CHALLAN",
  "PAYMENT RECEIPT",
  "PURCHASE ORDER",
  "CREDIT NOTE",
  "DEBIT NOTE",
  "RETAIL INVOICE",
  "PAYMENTS MADE",
  "PROFORMA INVOICE",
  "E WAY BILL",
  "INVOICE (E-INVOICE)",
  "E-INVOICE (GOVT)",
  "Sales Debit Note",
];

const BulkExport = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);
  const fmtDate = (d) => d.toISOString().split("T")[0];

  const [documentType, setDocumentType] = useState("INVOICE");
  const [fromDate, setFromDate] = useState(fmtDate(monthAgo));
  const [toDate, setToDate] = useState(fmtDate(today));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState({ rows: [], total: 0, totalPages: 0 });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getBulkExports({ page, size: pageSize });
      if (res.success) setHistory(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch export history");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await reportService.createBulkExport({
        documentType,
        fromDate,
        toDate,
      });
      if (res.success) {
        toast.success("Export request generated successfully");
        setPage(1);
        fetchHistory();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to generate export");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalEntries = history.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="be-page">
      <header className="be-header">
        <div className="be-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <h1>Bulk Export Documents</h1>
        </div>
        <div className="be-header__right">
          <div className="profile-pill">
            <div className="avatar">
              {vendorData?.businessName?.charAt(0) || "M"}
            </div>
            <span>{vendorData?.businessName || "My Company"}</span>
            <FiChevronDown />
          </div>
        </div>
      </header>

      <main className="be-main">
        <div className="be-card">
          <div className="be-generator">
            <h2 className="section-title">Generate New Report</h2>
            <div className="generator-inputs">
              <div className="input-group">
                <label>Document</label>
                <div className="select-wrap">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="input-group date-input">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="input-group date-input">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                className="btn-generate"
                disabled={loading}
                onClick={handleGenerate}
              >
                {loading ? "..." : "Generate"}
              </button>
            </div>
          </div>

          <div className="be-table-wrap">
            <table className="be-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      No export history found
                    </td>
                  </tr>
                ) : (
                  history.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="doc-type-cell">
                        {row.documentType}{" "}
                        {row.fromDate.split("-").reverse().join("-")} -{" "}
                        {row.toDate.split("-").reverse().join("-")}
                      </td>
                      <td className="requested-on-cell">
                        {formatDateTime(row.requestedOn)}
                      </td>
                      <td className="status-cell">
                        <span
                          className={`status-badge ${row.status.toLowerCase()}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="btn-download"
                          onClick={() => window.open(row.fileUrl, "_blank")}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="be-pagination">
            <div className="page-size-selector">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="page-info">
              Showing {startEntry} to {endEntry} of {totalEntries} entries
            </div>
            <div className="page-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <FiChevronLeft />
              </button>
              <button className="active">{page}</button>
              <button
                disabled={page >= history.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BulkExport;
