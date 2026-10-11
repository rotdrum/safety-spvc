(function () {
  const config = window.SPVC_DATA_API_CONFIG || {};
  const api = window.StudentAffairsDataApi;
  const GIS_SRC = "https://accounts.google.com/gsi/client";
  const state = {
    ready: null,
    user: null,
    options: null,
    overlay: null
  };

  function injectStyles() {
    if (document.getElementById("spvcAuthGuardStyles")) return;
    const style = document.createElement("style");
    style.id = "spvcAuthGuardStyles";
    style.textContent = `
      body.spvc-auth-locked > *:not(.spvc-auth-overlay) { filter: blur(2px); pointer-events: none; user-select: none; }
      .spvc-auth-overlay { position: fixed; z-index: 99999; inset: 0; display: grid; place-items: center; padding: 22px; background: rgba(7, 24, 22, 0.72); backdrop-filter: blur(10px); font-family: "Noto Sans Thai", "Leelawadee UI", Tahoma, system-ui, sans-serif; }
      .spvc-auth-card { width: min(100%, 460px); overflow: hidden; border: 1px solid rgba(255,255,255,.22); border-radius: 28px; background: #fff; color: #102421; box-shadow: 0 30px 80px rgba(0,0,0,.28); }
      .spvc-auth-head { padding: 28px 28px 22px; background: linear-gradient(145deg, #0b2925, #0f766e); color: #fff; }
      .spvc-auth-badge { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 12px; color: #a9ede1; font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
      .spvc-auth-badge::before { width: 8px; height: 8px; border-radius: 999px; background: #53e2cc; box-shadow: 0 0 0 6px rgba(83,226,204,.14); content: ""; }
      .spvc-auth-head h2 { margin: 0; font-size: 28px; line-height: 1.24; }
      .spvc-auth-head p { margin: 10px 0 0; color: #cde4df; font-size: 14px; line-height: 1.55; }
      .spvc-auth-body { padding: 24px 28px 28px; }
      .spvc-auth-google { min-height: 44px; display: flex; align-items: center; justify-content: center; }
      .spvc-auth-message { margin-top: 16px; padding: 12px 14px; border-radius: 16px; background: #f3f7f5; color: #61706d; font-size: 13px; line-height: 1.55; }
      .spvc-auth-message.error { background: #fff1f2; color: #be123c; }
      .spvc-auth-message code { display: inline-block; padding: 1px 5px; border-radius: 7px; background: rgba(0,0,0,.06); color: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
      .spvc-auth-foot { margin-top: 16px; color: #75827f; font-size: 12px; line-height: 1.45; }
      .spvc-auth-userbar { position: fixed; z-index: 9998; right: 18px; bottom: 18px; display: flex; align-items: center; gap: 9px; max-width: min(420px, calc(100vw - 36px)); padding: 9px 10px; border: 1px solid rgba(220,231,227,.9); border-radius: 999px; background: rgba(255,255,255,.92); box-shadow: 0 14px 36px rgba(16,36,33,.14); backdrop-filter: blur(12px); font-family: "Noto Sans Thai", "Leelawadee UI", Tahoma, system-ui, sans-serif; }
      .spvc-auth-userbar img { width: 30px; height: 30px; border-radius: 999px; background: #e8f0ed; object-fit: cover; }
      .spvc-auth-userbar span { min-width: 0; overflow: hidden; color: #43534f; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
      .spvc-auth-userbar button { border: 0; border-radius: 999px; padding: 7px 10px; background: #123b35; color: #fff; cursor: pointer; font: inherit; font-size: 12px; font-weight: 900; }
      @media print {
        .spvc-auth-overlay,
        .spvc-auth-userbar {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function loadGoogleIdentity() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    if (state.ready) return state.ready;
    state.ready = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("โหลด Google Identity Services ไม่สำเร็จ"));
      document.head.appendChild(script);
    });
    return state.ready;
  }

  function storageKey(systemId) {
    return `spvc-auth:${systemId}`;
  }

  function decodeJwt(token) {
    const part = String(token || "").split(".")[1] || "";
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "=");
    return JSON.parse(decodeURIComponent(escape(window.atob(padded))));
  }

  function isExpired(profile) {
    return !profile || !profile.exp || (profile.exp * 1000) < Date.now() + 60000;
  }

  function setMessage(text, tone) {
    const node = document.getElementById("spvcAuthMessage");
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("error", tone === "error");
  }

  function renderOverlay(options) {
    injectStyles();
    document.body.classList.add("spvc-auth-locked");
    const overlay = document.createElement("div");
    overlay.className = "spvc-auth-overlay";
    overlay.innerHTML = `
      <section class="spvc-auth-card" role="dialog" aria-modal="true" aria-labelledby="spvcAuthTitle">
        <div class="spvc-auth-head">
          <div class="spvc-auth-badge">Gmail Authentication</div>
          <h2 id="spvcAuthTitle">เข้าสู่ระบบก่อนใช้งาน</h2>
          <p>${options.systemName} อนุญาตเฉพาะบัญชี Google ที่ได้รับสิทธิ์จากงานปกครองฯ</p>
        </div>
        <div class="spvc-auth-body">
          <div class="spvc-auth-google" id="spvcGoogleButton"></div>
          <div class="spvc-auth-message" id="spvcAuthMessage">กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google ที่ได้รับอนุญาต</div>
          <div class="spvc-auth-foot" id="spvcAuthFoot">ระบบจะตรวจสอบสิทธิ์จากรายชื่อผู้ใช้งานที่ได้รับอนุญาต</div>
        </div>
      </section>
    `;
    document.body.appendChild(overlay);
    state.overlay = overlay;
  }

  function renderAuthUnavailable(options) {
    renderOverlay(options);
    const googleButton = document.getElementById("spvcGoogleButton");
    const foot = document.getElementById("spvcAuthFoot");
    if (googleButton) googleButton.hidden = true;
    if (foot) foot.textContent = "กรุณาติดต่อผู้ดูแลระบบ";
    setMessage("ระบบเข้าสู่ระบบยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ", "error");
  }

  function removeOverlay() {
    document.body.classList.remove("spvc-auth-locked");
    if (state.overlay) state.overlay.remove();
    state.overlay = null;
  }

  function renderUserbar(user, options) {
    document.querySelectorAll(".spvc-auth-userbar").forEach((node) => node.remove());
    const bar = document.createElement("div");
    bar.className = "spvc-auth-userbar";
    bar.innerHTML = `
      ${user.picture ? `<img src="${user.picture}" alt="">` : ""}
      <span title="${user.email}">${user.name || user.email}</span>
      <button type="button">Logout</button>
    `;
    bar.querySelector("button").addEventListener("click", () => logout(options.systemId));
    document.body.appendChild(bar);
  }

  async function verifyAndStore(idToken, options) {
    const profile = decodeJwt(idToken);
    const context = {
      idToken,
      email: String(profile.email || "").toLowerCase(),
      name: profile.name || "",
      picture: profile.picture || "",
      systemId: options.systemId
    };
    api.setAuthContext(context);
    const user = await api.request("auth.verify", { systemId: options.systemId });
    const stored = { ...context, ...user, exp: profile.exp };
    localStorage.setItem(storageKey(options.systemId), JSON.stringify(stored));
    state.user = stored;
    removeOverlay();
    renderUserbar(stored, options);
    return stored;
  }

  async function requireAuth(options) {
    const normalized = {
      systemId: options.systemId,
      systemName: options.systemName || "ระบบงานปกครอง"
    };
    state.options = normalized;
    injectStyles();

    if (!api || !api.configured()) throw new Error("ยังไม่ได้ตั้งค่า Apps Script API");

    const stored = JSON.parse(localStorage.getItem(storageKey(normalized.systemId)) || "null");
    if (stored && stored.mode === "email") {
      localStorage.removeItem(storageKey(normalized.systemId));
      api.clearAuthContext();
    } else if (stored && !isExpired(stored)) {
      try {
        api.setAuthContext(stored);
        const user = await api.request("auth.verify", { systemId: normalized.systemId });
        state.user = { ...stored, ...user };
        renderUserbar(state.user, normalized);
        return state.user;
      } catch (error) {
        localStorage.removeItem(storageKey(normalized.systemId));
        api.clearAuthContext();
      }
    }

    if (!config.googleClientId) {
      renderAuthUnavailable(normalized);
      return new Promise(() => {});
    }

    renderOverlay(normalized);
    const googleButton = document.getElementById("spvcGoogleButton");
    await loadGoogleIdentity();
    return new Promise((resolve) => {
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: async (response) => {
          try {
            setMessage("กำลังตรวจสอบสิทธิ์กับ master sheet...");
            const user = await verifyAndStore(response.credential, normalized);
            resolve(user);
          } catch (error) {
            api.clearAuthContext();
            setMessage(error.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
          }
        }
      });
      window.google.accounts.id.renderButton(document.getElementById("spvcGoogleButton"), {
        theme: "outline",
        size: "large",
        width: 310,
        text: "signin_with",
        locale: "th"
      });
    });
  }

  function logout(systemId) {
    localStorage.removeItem(storageKey(systemId));
    if (api) api.clearAuthContext();
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    window.location.reload();
  }

  window.StudentAffairsAuth = {
    require: requireAuth,
    logout,
    currentUser: () => state.user
  };
})();
