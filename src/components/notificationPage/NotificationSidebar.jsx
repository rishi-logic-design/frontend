import React, { useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationSidebar.scss";

const NotificationSidebar = () => {
  const {
    showSidebar,
    notifications,
    unreadCount,
    toggleSidebar,
    markAsRead,
    markAllAsRead,
    setShowSidebar,
  } = useNotifications();

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showSidebar) {
        setShowSidebar(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSidebar, setShowSidebar]);

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

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // You can add navigation logic here based on entityType
  };

  const handleOverlayClick = () => {
    setShowSidebar(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`notification-overlay ${showSidebar ? "active" : ""}`}
        onClick={handleOverlayClick}
      />

      {/* Sidebar */}
      <div className={`notification-sidebar ${showSidebar ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="header-title">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button className="close-btn" onClick={toggleSidebar}>
              ✕
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No notifications yet</p>
              <span>We'll notify you when something arrives</span>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`notification-icon ${notification.level?.toLowerCase()}`}
                  >
                    {getIcon(notification.level)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4>{notification.title}</h4>
                      <span className="notification-time">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    {notification.entityType && (
                      <span className="notification-badge">
                        {notification.entityType}
                      </span>
                    )}
                  </div>
                  {!notification.isRead && <div className="unread-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationSidebar;
