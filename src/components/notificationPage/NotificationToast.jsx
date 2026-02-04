import React from "react";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationToast.scss";

const NotificationToast = () => {
  const { showToast, latestNotification, handleToastClick } =
    useNotifications();

  if (!showToast || !latestNotification) return null;

  const getIcon = (level) => {
    switch (level) {
      case "SUCCESS":
        return "✓";
      case "ERROR":
        return "✕";
      case "WARNING":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  return (
    <div
      className={`notification-toast ${showToast ? "show" : ""} ${latestNotification.level?.toLowerCase()}`}
      onClick={handleToastClick}
    >
      <div className="toast-icon">{getIcon(latestNotification.level)}</div>
      <div className="toast-content">
        <div className="toast-title">{latestNotification.title}</div>
        <div className="toast-message">{latestNotification.message}</div>
      </div>
    </div>
  );
};

export default NotificationToast;
