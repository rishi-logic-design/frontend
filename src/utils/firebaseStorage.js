import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth } from "../firebase";

const storage = getStorage();

export const uploadImage = async (file, folder = "images") => {
  if (!file) throw new Error("No file provided");

  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size should be less than 5MB");
  }

  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const ext = file.name.split(".").pop();
    const filename = `${folder}/${timestamp}_${randomStr}.${ext}`;
    const storageRef = ref(storage, filename);

    const snapshot = await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const url = new URL(imageUrl);
    const path = decodeURIComponent(
      url.pathname.split("/o/")[1]?.split("?")[0],
    );
    
    if (!path) throw new Error("Invalid image URL");

    const imageRef = ref(storage, path);
    await deleteObject(imageRef);

    console.log("Image deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
  }
};

export const uploadCustomerImage = async (file) => {
  return uploadImage(file, "customers");
};

export const uploadVendorProfileImage = async (file) => {
  return uploadImage(file, "vendors");
};

export const uploadQRCode = async (file) => {
  return uploadImage(file, "qr-codes");
};
export const uploadPaymentAttachment = async (file) => {
  return uploadImage(file, "payments");
};

export default {
  uploadImage,
  deleteImage,
  uploadCustomerImage,
  uploadVendorProfileImage,
  uploadQRCode,
  uploadPaymentAttachment,
};
