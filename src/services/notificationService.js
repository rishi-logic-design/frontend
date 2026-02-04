import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const notificationService = {
  getNotifications: async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const token = localStorage.getItem("vendorToken");
      const response = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const response = await axios.put(
        `${API_URL}/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },
};

export default notificationService;
