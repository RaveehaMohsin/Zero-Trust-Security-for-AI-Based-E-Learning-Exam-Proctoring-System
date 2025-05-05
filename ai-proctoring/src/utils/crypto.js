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

export const decrypt = ({ encryptedData, iv }) => {
  const ivParsed = CryptoJS.enc.Hex.parse(iv); // Convert hex IV back to WordArray
  const encryptedHexStr = CryptoJS.enc.Hex.parse(encryptedData); // Convert hex encrypted data to WordArray
  const encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr); // Convert to Base64 for decryption

  const decrypted = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
    iv: ivParsed,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8); // Get original plaintext
};
