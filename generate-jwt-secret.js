#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates cryptographically secure JWT secrets for your applications
 */

const crypto = require("crypto");

console.log("🔐 JWT Secret Generator");
console.log("======================");
console.log("");

// Generate different length secrets
const secrets = {
  "32-byte (256-bit)": crypto.randomBytes(32).toString("hex"),
  "48-byte (384-bit)": crypto.randomBytes(48).toString("hex"),
  "64-byte (512-bit)": crypto.randomBytes(64).toString("hex"),
};

console.log("Generated JWT Secrets:");
console.log("");

Object.entries(secrets).forEach(([length, secret]) => {
  console.log(`${length}:`);
  console.log(`JWT_SECRET=${secret}`);
  console.log("");
});

console.log("💡 Recommendations:");
console.log("- Use 64-byte (512-bit) for maximum security");
console.log("- Never commit JWT secrets to version control");
console.log("- Use different secrets for different environments");
console.log("- Store secrets securely in environment variables");
console.log("");

console.log("🚀 For immediate use in .env file:");
console.log(`JWT_SECRET=${secrets["64-byte (512-bit)"]}`);
console.log("");

console.log(
  "✅ Generated with Node.js crypto.randomBytes() - cryptographically secure"
);
