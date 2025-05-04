import CryptoJS from "crypto-js";

const key = CryptoJS.enc.Base64.parse(import.meta.env.VITE_ENCRYPTION_KEY);
const iv = CryptoJS.enc.Base64.parse(import.meta.env.VITE_ENCRYPTION_IV);

export const encrypt = (text) => {
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex), // Must match backend
  };
};
