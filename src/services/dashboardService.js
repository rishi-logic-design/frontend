const API_URL = "https://accountsoft.onrender.com";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const dashboardService = {
  // Vendors
  getVendors: async () => {
    try {
      const response = await fetch(`${API_URL}/vendors`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.vendors || data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return [];
    }
  },

  createVendor: async (vendorData) => {
    const response = await fetch(`${API_URL}/vendors`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorData),
    });
    return await response.json();
  },

  updateVendor: async (id, vendorData) => {
    const response = await fetch(`${API_URL}/vendors/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorData),
    });
    return await response.json();
  },

  deleteVendor: async (id) => {
    const response = await fetch(`${API_URL}/vendors/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  },

  // Customers
  getCustomers: async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.customers || data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },

  // Subscriptions
  getSubscriptions: async () => {
    try {
      const response = await fetch(`${API_URL}/subscriptions`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.subscriptions || data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return [];
    }
  },

  // Payments
  getPayments: async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.payments || data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  },

  // Plans
  getPlans: async () => {
    try {
      const response = await fetch(`${API_URL}/subscriptions/plans`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.plans || data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching plans:", error);
      return [];
    }
  },

  createPlan: async (planData) => {
    const response = await fetch(`${API_URL}/subscriptions/plans`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    return await response.json();
  },

  updatePlan: async (id, planData) => {
    try {
      const response = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
        method: "PUT",
        updatePlan: async (id, planData) => {
          const response = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(planData),
          });
          return await response.json();
        },
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      deletePlan: async (id) => {
        const response = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        return await response.json();
      },
        console.error("Error deleting plan:", error);
      return { success: false, message: "Error deleting plan" };
    }
  },
};

export default dashboardService;
