import { uploadCustomerImage, deleteImage } from "../utils/firebaseStorage";

const API_URL =
  import.meta.env.VITE_API_URL || "https://accountsoft.onrender.com";

export const createCustomer = async (formData) => {
  try {
    const token = localStorage.getItem("vendorToken");

    const imageFile = formData.get("customerImage");
    let imageUrl = null;

    if (imageFile instanceof File) {
      imageUrl = await uploadCustomerImage(imageFile);
    }

    const customerData = {};

    for (let [key, value] of formData.entries()) {
      if (key === "customerImage") continue;

      if (key === "homeAddress" || key === "officeAddress") {
        customerData[key] = JSON.parse(value);
      } else if (key === "priceValue") {
        customerData.pricePerProduct = Number(value || 0);
      } else {
        customerData[key] = value;
      }
    }

    customerData.customerImage = imageUrl;

    const response = await fetch(`${API_URL}/api/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      if (imageUrl) await deleteImage(imageUrl);
      throw new Error("Failed to create customer");
    }

    return await response.json();
  } catch (err) {
    console.error("Create customer error:", err);
    throw err;
  }
};

export const updateCustomer = async (customerId, formData) => {
  try {
    const token = localStorage.getItem("vendorToken");

    const imageFile = formData.get("customerImage");
    let newImageUrl = null;
    const oldImageUrl = formData.get("oldCustomerImage");

    if (imageFile && imageFile instanceof File) {
      newImageUrl = await uploadCustomerImage(imageFile);

      if (oldImageUrl) {
        await deleteImage(oldImageUrl);
      }

      formData.delete("customerImage");
      formData.append("customerImage", newImageUrl);
    }

    formData.delete("oldCustomerImage");

    const customerData = {};
    for (let [key, value] of formData.entries()) {
      if (key === "homeAddress" || key === "officeAddress") {
        customerData[key] = JSON.parse(value);
      } else {
        customerData[key] = value;
      }
    }

    const response = await fetch(`${API_URL}/api/customers/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      if (newImageUrl) {
        await deleteImage(newImageUrl);
      }
      throw new Error("Failed to update customer");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Update customer error:", error);
    throw error;
  }
};

export const deleteCustomer = async (customerId, imageUrl) => {
  try {
    const token = localStorage.getItem("vendorToken");
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));

    const response = await fetch(
      `${API_URL}/api/customers/${customerId}?vendorId=${vendorData?.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete customer");
    }

    if (imageUrl) {
      await deleteImage(imageUrl);
    }
  } catch (error) {
    console.error("Delete customer error:", error);
    throw error;
  }
};

export const getCustomers = async (params = {}) => {
  try {
    const token = localStorage.getItem("vendorToken");
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));

    const queryParams = new URLSearchParams({
      vendorId: vendorData?.id,
      ...params,
    });

    const response = await fetch(`${API_URL}/api/customers?${queryParams}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customers");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get customers error:", error);
    throw error;
  }
};

export const getCustomerById = async (customerId) => {
  try {
    const token = localStorage.getItem("vendorToken");

    const response = await fetch(`${API_URL}/api/customers/${customerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customer");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get customer error:", error);
    throw error;
  }
};

export const searchCustomers = async (query) => {
  try {
    const token = localStorage.getItem("vendorToken");
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));

    const queryParams = new URLSearchParams({
      vendorId: vendorData?.id,
      q: query,
    });

    const response = await fetch(
      `${API_URL}/api/customers/search?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to search customers");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Search customers error:", error);
    throw error;
  }
};

export default {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerById,
  searchCustomers,
};
