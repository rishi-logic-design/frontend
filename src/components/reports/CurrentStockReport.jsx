import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiDatabase,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./currentStockReport.scss";

const PAGE_SIZES = [10, 25, 50, 100];
const fmtNum = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const CurrentStockReport = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const today = new Date();
  const thirtyAgo = new Date();
  thirtyAgo.setDate(today.getDate() - 30);
  const fmtDate = (d) => d.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(fmtDate(thirtyAgo));
  const [toDate, setToDate] = useState(fmtDate(today));
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    rows: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getCurrentStockReport({
        search,
        page,
        size: pageSize,
      });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch Current Stock Report");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleGenerate = () => {
    setSearch(searchInput);
    setPage(1);
    fetchReport();
  };

  const handleExportCSV = () => {
    if (!data.rows.length) return toast.info("No data to export");
    const headers = [
      "S.No",
      "Item Code",
      "Item Name",
      "Stock Value",
      "Purchase Price",
      "Sales Price",
      "Stock In Hand",
    ];
    const csvRows = [
      headers.join(","),
      ...data.rows.map((r) =>
        [
          r.serialNo,
          r.itemCode,
          `"${r.itemName}"`,
          r.stockValue,
          r.purchasePrice,
          r.salesPrice,
          `"${r.stockInHand}"`,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `current-stock-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="csr-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="csr-header">
        <div className="csr-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FiDatabase className="title-icon" />
            <h1>
              Current Stock Report
              <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="csr-header__right">
          <div className="profile-pill">
            <div className="avatar">
              {vendorData?.businessName?.charAt(0) || "M"}
            </div>
            <span>{vendorData?.businessName || "My Company"}</span>
            <FiChevronDown />
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="csr-main">
        <div className="csr-card">
          {/* Controls */}
          <div className="csr-controls">
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-wrap">
                <FiSearch className="si-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>

            <div className="date-filters">
              <CustomDatePicker
                label="From Date"
                value={fromDate}
                onChange={(v) => setFromDate(v)}
                maxDate={toDate || undefined}
              />
              <CustomDatePicker
                label="To Date"
                value={toDate}
                onChange={(v) => setToDate(v)}
                minDate={fromDate || undefined}
              />
            </div>

            <div className="action-btns">
              <button className="btn-generate" onClick={handleGenerate}>
                <FiFileText /> + Generate New Report
              </button>
              <button className="btn-reports" onClick={handleExportCSV}>
                <FiDownload /> Reports
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="csr-table-wrap">
            {loading ? (
              <div className="csr-loading">
                <div className="spinner" />
                <span>Fetching stock data…</span>
              </div>
            ) : (
              <table className="csr-table">
                <thead>
                  <tr>
                    <th className="col-code">
                      Item
                      <br />
                      Code
                    </th>
                    <th className="col-name">Item Name</th>
                    <th className="col-num">Stock Value</th>
                    <th className="col-num">Purchase Price</th>
                    <th className="col-num">Sales Price</th>
                    <th className="col-num">Stock In Hand</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="tc code-cell">{row.itemCode}</td>
                        <td className="name-cell">{row.itemName}</td>
                        <td className="tr stock-val">
                          {fmtNum(row.stockValue)}
                        </td>
                        <td className="tr pur-price">
                          {fmtNum(row.purchasePrice)}
                        </td>
                        <td className="tr sal-price">
                          {fmtNum(row.salesPrice)}
                        </td>
                        <td className="tr stock-hand">{row.stockInHand}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="csr-pagination">
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
              {totalEntries > 0
                ? `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`
                : "No entries found"}
            </div>
            <div className="page-controls">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                className="page-btn"
                disabled={page >= data.totalPages}
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

export default CurrentStockReport;
