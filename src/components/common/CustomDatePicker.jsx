import React, { useState, useEffect, useRef, useCallback } from "react";
import "./customDatePicker.scss";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDisplay(date) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const CustomDatePicker = ({
  value,
  onChange,
  placeholder = "Select date",
  label,
  disabled = false,
  minDate,
  maxDate,
  className = "",
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseDate(value);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("calendar"); 
  const [curYear, setCurYear] = useState((selected || today).getFullYear());
  const [curMonth, setCurMonth] = useState((selected || today).getMonth());

  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (selected) {
      setCurYear(selected.getFullYear());
      setCurMonth(selected.getMonth());
    }
  }, [value]);

  const openPicker = () => {
    if (disabled) return;
    setView("calendar");
    setOpen((o) => !o);
  };

  const selectDate = (d) => {
    const ymd = toYMD(d);
    onChange(ymd);
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  const prevMonth = () => {
    if (curMonth === 0) {
      setCurMonth(11);
      setCurYear((y) => y - 1);
    } else setCurMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) {
      setCurMonth(0);
      setCurYear((y) => y + 1);
    } else setCurMonth((m) => m + 1);
  };

  const prevYear = () => setCurYear((y) => y - 1);
  const nextYear = () => setCurYear((y) => y + 1);

  const handleMonthSelect = (mIdx) => {
    setCurMonth(mIdx);
    setView("calendar");
  };

  const daysInMonth = getDaysInMonth(curYear, curMonth);
  const firstDay = getFirstDayOfMonth(curYear, curMonth);
  const prevDaysCount = getDaysInMonth(
    curYear,
    curMonth - 1 < 0 ? 11 : curMonth - 1,
  );

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDaysCount - i, type: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: "current" });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, type: "next" });
  }

  const headerDate = selected || today;
  const headerDayName = DAYS_LONG[headerDate.getDay()];
  const headerMonthShort = MONTHS_SHORT[headerDate.getMonth()];
  const headerDayNum = headerDate.getDate();
  const headerYear = headerDate.getFullYear();

  const isSelected = (d, type) => {
    if (type !== "current" || !selected) return false;
    return (
      selected.getFullYear() === curYear &&
      selected.getMonth() === curMonth &&
      selected.getDate() === d
    );
  };

  const isToday = (d, type) => {
    if (type !== "current") return false;
    return (
      today.getFullYear() === curYear &&
      today.getMonth() === curMonth &&
      today.getDate() === d
    );
  };

  const isDisabled = (d, type) => {
    if (type !== "current") return true;
    const dt = new Date(curYear, curMonth, d);
    if (minDate && dt < new Date(minDate + "T00:00:00")) return true;
    if (maxDate && dt > new Date(maxDate + "T00:00:00")) return true;
    return false;
  };

  return (
    <div className={`cdp-wrap ${className}`} ref={wrapRef}>
      {label && <label className="cdp-label">{label}</label>}

      {/* Trigger input */}
      <div
        className={`cdp-input ${open ? "focused" : ""} ${disabled ? "disabled" : ""}`}
        onClick={openPicker}
      >
        <svg
          className="cdp-cal-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className={`cdp-display ${!value ? "placeholder" : ""}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && !disabled && (
          <span className="cdp-clear-x" onClick={clear} title="Clear">
            ×
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="cdp-dropdown">
          {/* Dark header */}
          <div className="cdp-header">
            <div className="cdp-header__year">{headerYear}</div>
            <div className="cdp-header__date">
              {headerDayName}, {headerMonthShort} {headerDayNum}
            </div>
          </div>

          {/* Calendar View */}
          {view === "calendar" && (
            <div className="cdp-body">
              {/* Month/Year nav */}
              <div className="cdp-nav">
                <button className="cdp-nav__arrow" onClick={prevMonth}>
                  ‹
                </button>
                <button
                  className="cdp-nav__title"
                  onClick={() => setView("month")}
                >
                  {MONTHS_LONG[curMonth]} {curYear}
                </button>
                <button className="cdp-nav__arrow" onClick={nextMonth}>
                  ›
                </button>
              </div>

              {/* Day headers */}
              <div className="cdp-days-header">
                {DAYS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              {/* Day grid */}
              <div className="cdp-days-grid">
                {cells.map((cell, i) => {
                  const sel = isSelected(cell.day, cell.type);
                  const tod = isToday(cell.day, cell.type);
                  const dis = isDisabled(cell.day, cell.type);

                  return (
                    <button
                      key={i}
                      className={[
                        "cdp-day",
                        cell.type !== "current" ? "other-month" : "",
                        sel ? "selected" : "",
                        tod && !sel ? "today" : "",
                        dis ? "disabled" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        if (dis) return;
                        let d;
                        if (cell.type === "prev") {
                          d = new Date(curYear, curMonth - 1, cell.day);
                        } else if (cell.type === "next") {
                          d = new Date(curYear, curMonth + 1, cell.day);
                        } else {
                          d = new Date(curYear, curMonth, cell.day);
                        }
                        selectDate(d);
                      }}
                      disabled={dis}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="cdp-footer">
                <button className="cdp-footer__btn" onClick={clear}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Month Picker View */}
          {view === "month" && (
            <div className="cdp-body">
              <div className="cdp-nav">
                <button className="cdp-nav__arrow" onClick={prevYear}>
                  ‹
                </button>
                <button
                  className="cdp-nav__title year-title"
                  onClick={() => setView("calendar")}
                >
                  {curYear}
                </button>
                <button className="cdp-nav__arrow" onClick={nextYear}>
                  ›
                </button>
              </div>

              <div className="cdp-months-grid">
                {MONTHS_SHORT.map((m, i) => {
                  const isSelMonth =
                    selected &&
                    selected.getFullYear() === curYear &&
                    selected.getMonth() === i;
                  const isThisMonth =
                    today.getFullYear() === curYear && today.getMonth() === i;

                  return (
                    <button
                      key={i}
                      className={[
                        "cdp-month-btn",
                        isSelMonth ? "selected" : "",
                        isThisMonth && !isSelMonth ? "this-month" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleMonthSelect(i)}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              <div className="cdp-footer">
                <button className="cdp-footer__btn" onClick={clear}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
