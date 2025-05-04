const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'base64');

// Validate IV length on startup
if (iv.length !== 16) {
  throw new Error(`Invalid IV length: Expected 16 bytes, got ${iv.length} bytes`);
}

exports.encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex') // Send hex IV to frontend
  };
};

exports.decrypt = ({ encryptedData, iv: ivHex }) => {
    console.log("IV length in bytes:", iv.length); // Must be 16
  try {
    const ivBuffer = Buffer.from(ivHex, 'hex');
    
    // Strict IV length check
    if (ivBuffer.length !== 16) {
      throw new Error(`Invalid IV length: Expected 16 bytes, got ${ivBuffer.length} bytes`);
    }

    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};