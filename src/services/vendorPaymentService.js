import { uploadQRCode, deleteImage } from "../utils/firebaseStorage";

const API_URL =
  import.meta.env.VITE_API_URL || "https://accountsoft.onrender.com";

export const saveVendorPaymentDetails = async (formData) => {
  try {
    const token = localStorage.getItem("vendorToken");

    const qrFile = formData.get("qrCodeAttachment");
    let qrCodeUrl = null;

    if (qrFile && qrFile instanceof File) {
      qrCodeUrl = await uploadQRCode(qrFile);
    }

    const paymentData = {
      bankName: formData.get("bankName") || "",
      accountNumber: formData.get("accountNumber") || "",
      ifscCode: formData.get("ifscCode") || "",
      upiId: formData.get("upiId") || "",
      qrCodeAttachment: qrCodeUrl || null,
    };

    const response = await fetch(`${API_URL}/api/vendor-payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      if (qrCodeUrl) {
        await deleteImage(qrCodeUrl);
      }
      throw new Error("Failed to save payment details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Save payment details error:", error);
    throw error;
  }
};

export const getVendorPaymentDetails = async () => {
  try {
    const token = localStorage.getItem("vendorToken");
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));

    const response = await fetch(
      `${API_URL}/api/vendor-payments?vendorId=${vendorData?.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch payment details");
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error("Get payment details error:", error);
    throw error;
  }
};

export const updateVendorPaymentDetails = async (formData) => {
  try {
    const token = localStorage.getItem("vendorToken");

    const qrFile = formData.get("qrCodeAttachment");
    let newQrCodeUrl = null;
    const oldQrCodeUrl = formData.get("oldQrCodeUrl");

    if (qrFile && qrFile instanceof File) {
      newQrCodeUrl = await uploadQRCode(qrFile);

      if (oldQrCodeUrl) {
        await deleteImage(oldQrCodeUrl);
      }
    }

    const paymentData = {
      bankName: formData.get("bankName") || "",
      accountNumber: formData.get("accountNumber") || "",
      ifscCode: formData.get("ifscCode") || "",
      upiId: formData.get("upiId") || "",
      qrCodeAttachment: newQrCodeUrl || oldQrCodeUrl || null,
    };

    const response = await fetch(`${API_URL}/api/vendor-payments`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      if (newQrCodeUrl) {
        await deleteImage(newQrCodeUrl);
      }
      throw new Error("Failed to update payment details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Update payment details error:", error);
    throw error;
  }
};

export const deleteQRCode = async (qrCodeUrl) => {
  try {
    await deleteImage(qrCodeUrl);
  } catch (error) {
    console.error("Delete QR code error:", error);
    throw error;
  }
};

export default {
  saveVendorPaymentDetails,
  getVendorPaymentDetails,
  updateVendorPaymentDetails,
  deleteQRCode,
};
