import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiTruck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./deliveryChallanReport.scss";

const PAGE_SIZES = [10, 25, 50, 100];
const fmtNum = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const DeliveryChallanReport = () => {
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
      const res = await reportService.getDeliveryChallanReport({
        fromDate,
        toDate,
        search,
        page,
        size: pageSize,
      });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch Delivery Challan Report");
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
      "Challan No.",
      "Buyer Name",
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
          r.challanDate,
          r.challanNo,
          `"${r.buyerName}"`,
          r.buyerGST,
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
    a.download = `delivery-challan-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEntries = data.total;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="dcr-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="dcr-header">
        <div className="dcr-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FiTruck className="title-icon" />
            <h1>
              Delivery Challan Report
              <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="dcr-header__right">
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
      <main className="dcr-main">
        <div className="dcr-card">
          {/* Controls */}
          <div className="dcr-controls">
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
          <div className="dcr-table-wrap">
            {loading ? (
              <div className="dcr-loading">
                <div className="spinner" />
                <span>Fetching challan data…</span>
              </div>
            ) : (
              <table className="dcr-table">
                <thead>
                  <tr>
                    <th>
                      Serial
                      <br />
                      No.
                    </th>
                    <th>Date</th>
                    <th>
                      Challan
                      <br />
                      No.
                    </th>
                    <th>
                      Buyer
                      <br />
                      Name
                    </th>
                    <th>GSTIN</th>
                    <th>
                      Taxable
                      <br />
                      Amount
                    </th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>CESS</th>
                    <th>
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
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="tc">{row.serialNo}</td>
                        <td className="tc date-cell">{row.challanDate}</td>
                        <td className="tc challan-no">{row.challanNo}</td>
                        <td className="buyer-name">{row.buyerName}</td>
                        <td className="tc gstin-cell">{row.buyerGST}</td>
                        <td className="tr">{fmtNum(row.taxableAmount)}</td>
                        <td className="tr">{row.cgst}</td>
                        <td className="tr">{row.sgst}</td>
                        <td className="tr igst-cell">{fmtNum(row.igst)}</td>
                        <td className="tr">{row.cess}</td>
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
          <div className="dcr-pagination">
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

export default DeliveryChallanReport;
