import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./partyWiseSalesReport.scss";

const PAGE_SIZES = [10, 25, 50, 100];

const PartyWiseSalesReport = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const today = new Date();
  const thirtyAgo = new Date();
  thirtyAgo.setDate(today.getDate() - 30);
  const fmt = (d) => d.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(fmt(thirtyAgo));
  const [toDate, setToDate] = useState(fmt(today));
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
    grandTotalAmount: 0,
  });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getPartyWiseSalesReport({
        fromDate,
        toDate,
        search,
        page,
        size: pageSize,
      });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, search, page, pageSize]);

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
    const headers = ["S.No", "Buyer Name", "Total Amount (₹)", "Invoice Count"];
    const csvRows = [
      headers.join(","),
      ...data.rows.map((r) =>
        [r.serialNo, `"${r.buyerName}"`, r.totalAmount, r.invoiceCount].join(
          ",",
        ),
      ),
      ["", "Grand Total", data.grandTotalAmount, ""].join(","),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `party-wise-sales-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="pwsr2-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="pwsr2-header">
        <div className="pwsr2-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FiUsers className="title-icon" />
            <h1>
              Party Wise Sales Report
              <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="pwsr2-header__right">
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
      <main className="pwsr2-main">
        <div className="pwsr2-card">
          {/* Controls */}
          <div className="pwsr2-controls">
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
                onChange={(v) => {
                  setFromDate(v);
                  setPage(1);
                }}
                maxDate={toDate || undefined}
              />
              <CustomDatePicker
                label="To Date"
                value={toDate}
                onChange={(v) => {
                  setToDate(v);
                  setPage(1);
                }}
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
          <div className="pwsr2-table-wrap">
            {loading ? (
              <div className="pwsr2-loading">
                <div className="spinner" />
                <span>Fetching report data…</span>
              </div>
            ) : (
              <table className="pwsr2-table">
                <thead>
                  <tr>
                    <th>Serial No.</th>
                    <th>Buyer Name</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-row">
                        No data found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row) => (
                      <tr key={row.serialNo}>
                        <td>{row.serialNo}</td>
                        <td className="buyer-name">{row.buyerName}</td>
                        <td className="amount-cell">
                          {row.totalAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Grand Total */}
          {data.rows.length > 0 && (
            <div className="grand-total-bar">
              <span>
                Total Amount :&nbsp;
                <strong>
                  {data.grandTotalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </div>
          )}

          {/* Pagination */}
          <div className="pwsr2-pagination">
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

export default PartyWiseSalesReport;
