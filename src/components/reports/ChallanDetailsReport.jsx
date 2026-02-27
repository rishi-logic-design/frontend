import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiClipboard,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./challanDetailsReport.scss";

const PAGE_SIZES = [10, 25, 50, 100];
const fmtNum = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const ChallanDetailsReport = () => {
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
      const res = await reportService.getDeliveryChallanDetailsReport({
        fromDate,
        toDate,
        search,
        page,
        size: pageSize,
      });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch Challan Details Report");
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
      "Bill No.",
      "Date",
      "Party Name",
      "GST No.",
      "Product Name",
      "HSN Code",
      "Quantity",
      "Rate/Unit",
      "Sale Amount",
      "GST%",
      "CGST",
      "SGST",
      "CESS",
      "IGST",
      "Taxable Amount",
      "Grand Total With GST",
    ];
    const csvRows = [
      headers.join(","),
      ...data.rows.map((r) =>
        [
          r.serialNo,
          r.challanNo,
          r.challanDate,
          `"${r.partyName}"`,
          r.gstNo,
          `"${r.itemName}"`,
          r.hsn,
          r.qty,
          r.ratePerUnit,
          r.saleAmount,
          r.gstPercent,
          r.cgst,
          r.sgst,
          r.cess,
          r.igst,
          r.taxableAmount,
          r.grandTotal,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challan-details-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="cdr-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="cdr-header">
        <div className="cdr-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FiClipboard className="title-icon" />
            <h1>
              Delivery Challan Details Report
              <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="cdr-header__right">
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
      <main className="cdr-main">
        <div className="cdr-card">
          {/* Controls */}
          <div className="cdr-controls">
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
          <div className="cdr-table-wrap">
            {loading ? (
              <div className="cdr-loading">
                <div className="spinner" />
                <span>Fetching challan details…</span>
              </div>
            ) : (
              <table className="cdr-table">
                <thead>
                  <tr>
                    <th>
                      Bill
                      <br />
                      No.
                    </th>
                    <th>Date</th>
                    <th>
                      Party
                      <br />
                      Name
                    </th>
                    <th>
                      GS
                      <br />T<br />
                      No.
                    </th>
                    <th>
                      Product
                      <br />
                      Name
                    </th>
                    <th>
                      HSN
                      <br />
                      Code
                    </th>
                    <th>Quantity</th>
                    <th>Rate/Unit</th>
                    <th>
                      Sale
                      <br />
                      Amount
                    </th>
                    <th>GST%</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>CESS</th>
                    <th>IGST</th>
                    <th>
                      Taxable
                      <br />
                      Amount
                    </th>
                    <th>
                      GRAND
                      <br />
                      TOTAL
                      <br />
                      WITH
                      <br />
                      GST
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="empty-row">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="tc challan-no">{row.challanNo}</td>
                        <td className="tc date-cell">{row.challanDate}</td>
                        <td className="party-name">{row.partyName}</td>
                        <td className="tc gstin-cell">{row.gstNo}</td>
                        <td className="item-name">{row.itemName}</td>
                        <td className="tc">{row.hsn}</td>
                        <td className="tr">{row.qty}</td>
                        <td className="tr">{fmtNum(row.ratePerUnit)}</td>
                        <td className="tr">{fmtNum(row.saleAmount)}</td>
                        <td className="tc gst-pct">{row.gstPercent}%</td>
                        <td className="tr">{row.cgst}</td>
                        <td className="tr">{row.sgst}</td>
                        <td className="tr">{row.cess}</td>
                        <td className="tr igst-cell">{fmtNum(row.igst)}</td>
                        <td className="tr taxable-cell">
                          {fmtNum(row.taxableAmount)}
                        </td>
                        <td className="tr grand-cell">
                          {fmtNum(row.grandTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="cdr-pagination">
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
                : ""}
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

export default ChallanDetailsReport;
