// crypto.js
// HMAC-SHA256 hashing using the browser's native crypto.subtle API.
// Used to hash passwords client-side before they are ever sent over
// the network. The key (secret) comes from js/config.js, which is
// populated at deploy time from a GitHub Secret (see deploy.yml).

/**
 * Encrypts (HMAC-SHA256) a plaintext string using the shared secret.
 * @param {string} plainText - e.g. the user's typed password
 * @param {string} secret - the shared HMAC key (from APP_CONFIG.PIN_HASH_SALT)
 * @returns {Promise<string>} hex-encoded HMAC digest
 */
async function hmacSha256(plainText, secret) {
  const enc = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(plainText)
  );

  return bufferToHex(signatureBuffer);
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convenience wrapper: hashes a password using the app's configured secret.
 * @param {string} password
 * @returns {Promise<string>} hex HMAC-SHA256 hash
 */
async function hashPassword(password) {
  if (!window.APP_CONFIG || !window.APP_CONFIG.PIN_HASH_SALT) {
    throw new Error("APP_CONFIG.PIN_HASH_SALT is missing — check config.js");
  }
  return hmacSha256(password, window.APP_CONFIG.PIN_HASH_SALT);
}
