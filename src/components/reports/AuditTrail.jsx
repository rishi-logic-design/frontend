import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiActivity,
  FiClock,
  FiFilter,
  FiUser,
  FiBox,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import CustomDatePicker from "../common/CustomDatePicker";
import "./auditTrail.scss";

const PAGE_SIZES = [10, 25, 50, 100];

const AuditTrail = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const today = new Date();
  const thirtyAgo = new Date();
  thirtyAgo.setDate(today.getDate() - 30);
  const fmtDate = (d) => d.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(fmtDate(thirtyAgo));
  const [toDate, setToDate] = useState(fmtDate(today));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ rows: [], total: 0, totalPages: 0 });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getActivityLogs({
        fromDate,
        toDate,
        search,
        page,
        size: pageSize,
      });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, search, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleGenerate = () => {
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (!data.rows.length) return toast.info("No data to export");
    const headers = ["Date & Time", "Activity", "Document Link", "Type"];
    const csvRows = [
      headers.join(","),
      ...data.rows.map((r) =>
        [
          `"${new Date(r.dateTime).toLocaleString()}"`,
          `"${r.activity}"`,
          `"${r.docLink}"`,
          r.type,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="al-page">
      <header className="al-header">
        <div className="al-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <div className="title-group">
            <FiClock className="title-icon" />
            <h1>
              Activity Logs <span className="v-badge">v2</span>
            </h1>
          </div>
        </div>
        <div className="al-header__right">
          <div className="profile-pill">
            <div className="avatar">
              {vendorData?.businessName?.charAt(0) || "M"}
            </div>
            <span>{vendorData?.businessName || "My Company"}</span>
            <FiChevronDown />
          </div>
        </div>
      </header>

      <main className="al-main">
        <div className="al-card">
          <div className="al-controls">
            <div className="search-input-wrap">
              <FiSearch className="si-icon" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="date-filters">
              <CustomDatePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
              />
              <CustomDatePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
              />
            </div>

            <div className="extra-filters">
              <button className="filter-btn">
                <FiFileText /> Document Type <FiChevronDown />
              </button>
              <button className="filter-btn">
                <FiUser /> Select Party <FiChevronDown />
              </button>
              <button className="filter-btn">
                <FiBox /> Select Items <FiChevronDown />
              </button>
            </div>

            <div className="action-btns">
              <button className="btn-generate" onClick={handleGenerate}>
                + Generate New Report
              </button>
              <button className="btn-reports" onClick={handleExportCSV}>
                Reports
              </button>
            </div>
          </div>

          <div className="al-table-wrap">
            {loading ? (
              <div className="al-loading">
                <div className="spinner" />
                <span>Loading activities...</span>
              </div>
            ) : (
              <table className="al-table">
                <thead>
                  <tr>
                    <th className="col-datetime">Date & Time</th>
                    <th className="col-activity">Activity</th>
                    <th className="col-doclink">Document Link</th>
                    <th className="col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-row">
                        No activity found
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="datetime-cell">
                          {formatDateTime(row.dateTime)}
                        </td>
                        <td className="activity-cell">{row.activity}</td>
                        <td className="doclink-cell">
                          <span className="link-text">{row.docLink}</span>
                        </td>
                        <td className="action-cell">
                          {row.hasVersion && (
                            <button className="btn-show-version">
                              Show Version
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="al-pagination">
            <div className="page-info">
              <FiChevronLeft
                className={`nav-icon ${page === 1 ? "disabled" : ""}`}
                onClick={() => page > 1 && setPage((p) => p - 1)}
              />
              <span>Previous</span>
              <span
                className="p-next"
                onClick={() => page < data.totalPages && setPage((p) => p + 1)}
              >
                Next{" "}
                <FiChevronRight
                  className={`nav-icon ${page >= data.totalPages ? "disabled" : ""}`}
                />
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditTrail;
