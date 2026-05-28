/**
 * NetSuite OAuth 1.0a signature generator
 * Used by all /api/netsuite/* routes
 */
const crypto = require("crypto");

const NS_ACCOUNT   = process.env.NS_ACCOUNT_ID;
const CONSUMER_KEY = process.env.NS_CONSUMER_KEY;
const CONSUMER_SEC = process.env.NS_CONSUMER_SECRET;
const TOKEN_ID     = process.env.NS_TOKEN_ID;
const TOKEN_SEC    = process.env.NS_TOKEN_SECRET;

function getNonce(length = 20) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c =>
    "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Build an Authorization header for a NetSuite REST/SuiteQL request
 * @param {string} method  - HTTP method (GET, POST, etc.)
 * @param {string} url     - Full URL including query string
 * @returns {string}       - Value for the Authorization header
 */
function buildAuthHeader(method, url) {
  const timestamp = getTimestamp();
  const nonce     = getNonce();
  const realm     = NS_ACCOUNT.toUpperCase();

  // Strip query string from URL for base string
  const baseUrl = url.split("?")[0];
  const queryParams = {};
  if (url.includes("?")) {
    url.split("?")[1].split("&").forEach(pair => {
      const [k, v] = pair.split("=");
      queryParams[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  }

  const oauthParams = {
    oauth_consumer_key:     CONSUMER_KEY,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp:        timestamp,
    oauth_token:            TOKEN_ID,
    oauth_version:          "1.0",
  };

  // Combine and sort all params
  const allParams = { ...queryParams, ...oauthParams };
  const sortedParams = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  // Build signature base string
  const sigBaseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(sortedParams),
  ].join("&");

  // Build signing key
  const signingKey = `${percentEncode(CONSUMER_SEC)}&${percentEncode(TOKEN_SEC)}`;

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(sigBaseString)
    .digest("base64");

  // Build Authorization header
  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headerStr = Object.keys(headerParams)
    .map(k => `${k}="${percentEncode(headerParams[k])}"`)
    .join(", ");

  return `OAuth realm="${realm}", ${headerStr}`;
}

/**
 * Base URL for NetSuite REST API
 */
function nsBaseUrl() {
  const account = NS_ACCOUNT.toLowerCase().replace(/_/g, "-");
  return `https://${account}.suitetalk.api.netsuite.com/services/rest`;
}

module.exports = { buildAuthHeader, nsBaseUrl, NS_ACCOUNT };
