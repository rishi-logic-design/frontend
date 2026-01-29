import {
  uploadVendorProfileImage,
  deleteImage,
} from "../utils/firebaseStorage";

const API_URL =
  import.meta.env.VITE_API_URL || "https://accountsoft.onrender.com";

export const uploadProfileImage = async (file) => {
  try {
    const imageUrl = await uploadVendorProfileImage(file);
    const token = localStorage.getItem("vendorToken");
    const response = await fetch(`${API_URL}/api/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profileImage: imageUrl }),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile image in backend");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload profile image error:", error);
    throw error;
  }
};

export const getProfileImage = async () => {
  try {
    const token = localStorage.getItem("vendorToken");
    const response = await fetch(`${API_URL}/api/image`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile image");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get profile image error:", error);
    throw error;
  }
};

export const deleteProfileImage = async (imageUrl) => {
  try {
    await deleteImage(imageUrl);
    const token = localStorage.getItem("vendorToken");
    await fetch(`${API_URL}/api/vendor-profile/image`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Delete profile image error:", error);
    throw error;
  }
};

export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl;
};

export default {
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
  getImageUrl,
};
