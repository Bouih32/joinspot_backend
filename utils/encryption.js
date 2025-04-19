const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY || "";
const iv = process.env.ENCRYPTION_IV || "";

if (!secretKey || !iv) {
  throw new Error("Encryption secret or IV is missing");
}

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secretKey),
    Buffer.from(iv)
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

const decrypt = (encryptedText) => {
  const encryptedBuffer = Buffer.from(encryptedText, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    Buffer.from(iv)
  );
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  encrypt,
  decrypt,
};
