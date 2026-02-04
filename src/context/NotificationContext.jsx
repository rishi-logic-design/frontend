import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import notificationService from "../services/notificationService";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const isFirstLoad = useRef(true);
  const toastTimer = useRef(null);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (!response?.success) return;

      const newNotifications = response.data || [];

      setNotifications((prev) => {
        // Show toast only for NEW notifications (not on first load)
        if (!isFirstLoad.current && newNotifications.length > prev.length) {
          showNotificationToast(newNotifications[0]);
        }

        isFirstLoad.current = false;
        return newNotifications;
      });

      setUnreadCount(newNotifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const showNotificationToast = (notification) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setLatestNotification(notification);
    setShowToast(true);

    toastTimer.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        );

        setUnreadCount(updated.filter((n) => !n.isRead).length);

        return updated;
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  const handleToastClick = () => {
    setShowToast(false);
    setShowSidebar(true);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showToast,
        latestNotification,
        showSidebar,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        toggleSidebar,
        handleToastClick,
        setShowSidebar,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
