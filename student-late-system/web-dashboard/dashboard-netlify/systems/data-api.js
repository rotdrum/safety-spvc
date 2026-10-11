(function () {
  const config = window.SPVC_DATA_API_CONFIG || {};
  let authContext = null;

  function configured() {
    return /^https:\/\/script\.google\.com\/macros\/s\//.test(config.endpoint || "") && Boolean(config.token);
  }

  async function request(action, payload = {}) {
    if (!configured()) throw new Error("Google Apps Script API is not configured");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, token: config.token, auth: authContext, payload }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`API HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Google Apps Script API error");
      return result.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function fileToPayload(file, category = "document") {
    const limit = Number(config.maxFileBytes || 8 * 1024 * 1024);
    if (file.size > limit) {
      return Promise.reject(new Error(`${file.name} มีขนาดเกิน ${Math.round(limit / 1024 / 1024)} MB`));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        category,
        base64: String(reader.result || "").split(",").pop()
      });
      reader.readAsDataURL(file);
    });
  }

  async function filesToPayload(files, category = "document") {
    return Promise.all([...files].map(file => fileToPayload(file, category)));
  }

  window.StudentAffairsDataApi = {
    configured,
    request,
    filesToPayload,
    config,
    getAuthContext: () => authContext,
    setAuthContext: (context) => {
      authContext = context || null;
    },
    clearAuthContext: () => {
      authContext = null;
    }
  };
})();
