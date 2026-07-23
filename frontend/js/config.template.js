// config.template.js
// This file is the SOURCE template committed to the repo.
// GitHub Actions replaces the __PLACEHOLDER__ tokens with real secret
// values at deploy time and writes the result to js/config.js
// (config.js itself is gitignored and never committed with real secrets).

window.APP_CONFIG = {
  GAS_WEB_APP_URL: "GAS_WEB_APP_URL",
  PIN_HASH_SALT: "PIN_HASH_SALT"
};
