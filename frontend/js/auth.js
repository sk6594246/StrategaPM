// auth.js
// Feature #1 (Login), Feature #2 (trigger only), Feature #25 (encryption)

const SESSION_KEY = "tm_session";

const Auth = {
  /**
   * Attempts login. Sends {userID, hashedPassword} to GAS backend.
   * GAS returns ONLY {success: true/false} — no user data.
   * On success, writes the sessionStorage flag and triggers the
   * post-login fresh fetch (Feature #2).
   */
  async login(userID, password) {
    if (!userID || !password) {
      return { success: false, message: "User ID and Password are required." };
    }

    let hashedPassword;
    try {
      hashedPassword = await hashPassword(password);

      // Log the hashed password to the console to check its value
  console.log("Generated Hashed Password:", hashedPassword);

      
    } catch (err) {
      console.error("Hashing failed:", err);
      return { success: false, message: "Client-side encryption error." };
    }

    let result;
    try {
      result = await Auth._callGas("login", { userID, hashedPassword });
    } catch (err) {
      console.error("Login request failed:", err);
      return { success: false, message: "Unable to reach server. Try again." };
    }

    if (result && result.success === true) {
      Auth._setSession(userID);
      // Feature #2: fresh fetch fires immediately after successful login
      if (typeof onLoginSuccess === "function") {
        await onLoginSuccess(userID);
      }
      return { success: true };
    }

    return { success: false, message: "Invalid User ID or Password." };
  },

  /**
   * Checks sessionStorage for a valid login flag.
   * Called on every app load/refresh.
   * If present, re-triggers the fresh fetch (Feature #2) instead of
   * showing the login screen.
   */
  async restoreSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    let session;
    try {
      session = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }

    if (!session || session.loginSuccess !== true || !session.userID) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }

    if (typeof onLoginSuccess === "function") {
      await onLoginSuccess(session.userID);
    }
    return true;
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    if (typeof onLogout === "function") onLogout();
  },

  getCurrentUserID() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw).userID || null;
    } catch {
      return null;
    }
  },

  _setSession(userID) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userID, loginSuccess: true })
    );
  },

  /**
   * Generic POST wrapper to the GAS Web App.
   * action: string identifying the backend operation (e.g. "login")
   * payload: object with the request-specific fields
   */
  async _callGas(action, payload) {
    if (!window.APP_CONFIG || !window.APP_CONFIG.GAS_WEB_APP_URL) {
      throw new Error("APP_CONFIG.GAS_WEB_APP_URL is missing — check config.js");
    }

    const response = await fetch(window.APP_CONFIG.GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on GAS
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`GAS request failed: ${response.status}`);
    }

    return response.json();
  },
};
