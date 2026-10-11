(function () {
  const endpoint = "https://script.google.com/macros/s/AKfycbxfivDFl8LZwZ5vpgIJJ87kvsKv6tX6C-vbpfIdyJnPLgUEhzqyZYB-lSiE_xaDw4L4/exec";
  const maxFileBytes = 5 * 1024 * 1024;

  function fileToPayload(file, category = "student-evidence") {
    if (file.size > maxFileBytes) {
      return Promise.reject(new Error(`${file.name} มีขนาดเกิน 5 MB`));
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

  async function request(action, payload = {}, timeoutMs = 60000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`ระบบตอบกลับ HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      return result.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function filesToPayload(files, category = "document") {
    return Promise.all([...files].map(file => fileToPayload(file, category)));
  }

  async function submitBehaviorReport(payload, files) {
    const selectedFiles = [...files].slice(0, 3);
    const encodedFiles = await Promise.all(selectedFiles.map(file => fileToPayload(file, "student-evidence")));
    return request("behavior-report.create", { ...payload, files: encodedFiles }, 60000);
  }

  window.StudentAffairsPublicApi = { request, filesToPayload };
  window.StudentBehaviorReportApi = { submitBehaviorReport };
})();
