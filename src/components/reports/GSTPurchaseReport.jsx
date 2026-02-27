import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./gstPurchaseReport.scss";

const PAGE_SIZES = [10, 25, 50, 100];

const fmtNum = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const GSTPurchaseReport = () => {
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
    grandTaxable: 0,
    grandCGST: 0,
    grandSGST: 0,
    grandTotal: 0,
  });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getGSTPurchaseReport({
        fromDate,
        toDate,
        search,
        page,
        size: pageSize,
      });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch GST Purchase Report");
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
    const headers = [
      "S.No",
      "Date",
      "Purchase No.",
      "Seller Name",
      "GSTIN",
      "Taxable Amount",
      "CGST",
      "SGST",
      "IGST",
      "CESS",
      "Total Amount",
    ];
    const csvRows = [
      headers.join(","),
      ...data.rows.map((r) =>
        [
          r.serialNo,
          r.purchaseDate,
          r.purchaseNo,
          `"${r.sellerName}"`,
          r.sellerGST,
          r.taxableAmount,
          r.cgst,
          r.sgst,
          r.igst,
          r.cess,
          r.totalAmount,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-purchase-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="gpr-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="gpr-header">
        <div className="gpr-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FaFileInvoiceDollar className="title-icon" />
            <h1>
              GST Purchase Report
              <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="gpr-header__right">
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
      <main className="gpr-main">
        <div className="gpr-card">
          {/* Controls */}
          <div className="gpr-controls">
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
          <div className="gpr-table-wrap">
            {loading ? (
              <div className="gpr-loading">
                <div className="spinner" />
                <span>Fetching GST purchase data…</span>
              </div>
            ) : (
              <table className="gpr-table">
                <thead>
                  <tr>
                    <th className="col-serial">
                      Serial
                      <br />
                      No.
                    </th>
                    <th className="col-date">Date</th>
                    <th className="col-purno">
                      Purchase
                      <br />
                      No.
                    </th>
                    <th className="col-seller">Seller Name</th>
                    <th className="col-gstin">GSTIN</th>
                    <th className="col-num">
                      Taxable
                      <br />
                      Amount
                    </th>
                    <th className="col-num">CGST</th>
                    <th className="col-num">SGST</th>
                    <th className="col-num">IGST</th>
                    <th className="col-num">CESS</th>
                    <th className="col-num">
                      Total
                      <br />
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="empty-row">
                        No purchases found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row) => (
                      <tr key={row.serialNo}>
                        <td className="tc">{row.serialNo}</td>
                        <td className="tc date-cell">{row.purchaseDate}</td>
                        <td className="tc pur-no">{row.purchaseNo}</td>
                        <td className="seller-name">{row.sellerName}</td>
                        <td className="tc gstin-cell">{row.sellerGST}</td>
                        <td className="tr num-cell">
                          {fmtNum(row.taxableAmount)}
                        </td>
                        <td className="tr cgst-cell">{fmtNum(row.cgst)}</td>
                        <td className="tr sgst-cell">{fmtNum(row.sgst)}</td>
                        <td className="tr num-cell">{row.igst}</td>
                        <td className="tr num-cell">{row.cess}</td>
                        <td className="tr total-cell">
                          {fmtNum(row.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="gpr-pagination">
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

export default GSTPurchaseReport;
