// frontend/js/main.js

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Grab DOM elements ---------- */
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const summarizeBtn = document.getElementById("summarizeBtn");
  const summarizeTextBtn = document.getElementById("summarizeTextBtn");
  const textInput = document.getElementById("textInput");
  const statusEl = document.getElementById("status");
  const extractedTextEl = document.getElementById("extractedText");

  const summaryEl = document.getElementById("summary");
  const keypointsEl = document.getElementById("keypoints");
  const actionitemsEl = document.getElementById("actionitems");

  const copyBtn = document.getElementById("copySummaryBtn");
  const downloadBtn = document.getElementById("downloadSummaryBtn");
  const toggleExtractedBtn = document.getElementById("toggleExtractedBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");

  let selectedFile = null;
  let selectedLength = "medium";

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log("[status]", msg);
  }

  /* ---------- File upload UI ---------- */
  if (dropzone && fileInput) {
    fileInput.addEventListener("change", (e) => {
      selectedFile = e.target.files[0];
      dropzone.textContent = selectedFile
        ? selectedFile.name
        : "Drop files here or choose a file";
    });
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () =>
      dropzone.classList.remove("dragover")
    );
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const f = e.dataTransfer.files[0];
      if (f) {
        selectedFile = f;
        dropzone.textContent = f.name;
      }
    });
  }

  /* ---------- Parser (split sections) ---------- */
  function parseSummaryResponse(text) {
    if (!text) return { summary: "", keypoints: "", actionitems: "" };
    let summary = "",
      keypoints = "",
      actionitems = "";
    text = text.replace(/\r\n/g, "\n");

    const keyPointsHeader = text.search(/Key points:/i);
    const actionItemsHeader = text.search(
      /Action items|Action items \/ dates \/ numbers:/i
    );

    summary =
      keyPointsHeader !== -1
        ? text.slice(0, keyPointsHeader).trim()
        : text.trim();

    if (keyPointsHeader !== -1) {
      if (actionItemsHeader !== -1) {
        keypoints = text
          .slice(keyPointsHeader + "Key points:".length, actionItemsHeader)
          .trim();
      } else {
        keypoints = text.slice(keyPointsHeader + "Key points:".length).trim();
      }
    }

    if (actionItemsHeader !== -1) {
      const match = /Action items|Action items \/ dates \/ numbers:/i.exec(
        text.slice(actionItemsHeader)
      );
      actionitems = text
        .slice(actionItemsHeader + (match ? match[0].length : 0))
        .trim();
    }

    return { summary, keypoints, actionitems };
  }

  /* ---------- Populate UI ---------- */
  function populateResults(json = {}, pastedText = null) {
    const rawText = pastedText || json.summary || json.text || "";
    const { summary, keypoints, actionitems } = parseSummaryResponse(rawText);

    if (summaryEl) summaryEl.textContent = summary || "(No summary available)";
    if (keypointsEl) keypointsEl.textContent = keypoints || "(No key points)";
    if (actionitemsEl)
      actionitemsEl.textContent = actionitems || "(No action items)";

    if (summaryEl?.parentElement) summaryEl.parentElement.style.display = "block";
    if (keypointsEl?.parentElement) keypointsEl.parentElement.style.display = "block";
    if (actionitemsEl?.parentElement) actionitemsEl.parentElement.style.display = "block";

    if (extractedTextEl)
      extractedTextEl.textContent = pastedText || json.text || "";
  }

  /* ---------- Fetch handlers ---------- */
  async function summarizeFile() {
    try {
      if (!selectedFile) return setStatus("Please choose or drop a file first.");
      setStatus("Uploading and extracting text...");
      [summaryEl, keypointsEl, actionitemsEl, extractedTextEl].forEach(
        (el) => el && (el.textContent = "")
      );
      summarizeBtn.disabled = true;
      showLoading();

      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("length", selectedLength);

      const res = await fetch("/api/summaries", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.text()) || "Server error");

      const json = await res.json();
      console.log("[api response]", json);
      populateResults(json);
      summaryEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus("Done.");
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.message || err));
    } finally {
      summarizeBtn.disabled = false;
      hideLoading();
    }
  }

  async function summarizeText() {
    const text = textInput ? textInput.value.trim() : "";
    if (!text) return setStatus("Paste some text first.");
    try {
      setStatus("Summarizing pasted text...");
      [summaryEl, keypointsEl, actionitemsEl, extractedTextEl].forEach(
        (el) => el && (el.textContent = "")
      );
      showLoading();

      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, length: selectedLength }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Server error");

      const json = await res.json();
      console.log("[api response]", json);
      populateResults(json, text);
      summaryEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus("Done.");
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.message || err));
    } finally {
      hideLoading();
    }
  }

  summarizeBtn?.addEventListener("click", summarizeFile);
  summarizeTextBtn?.addEventListener("click", summarizeText);

  /* ---------- Copy / Download Helpers ---------- */
  function buildExportText() {
    const summary = summaryEl?.textContent.trim();
    const keypoints = keypointsEl?.textContent.trim();
    const actionitems = actionitemsEl?.textContent.trim();

    const cleanSummary =
      summary && !summary.startsWith("(No") ? summary : "";
    const cleanKeypoints =
      keypoints && !keypoints.startsWith("(No") ? keypoints : "";
    const cleanActionitems =
      actionitems && !actionitems.startsWith("(No") ? actionitems : "";

    const textParts = [];
    if (cleanSummary) textParts.push("Summary:\n" + cleanSummary);
    if (cleanKeypoints) textParts.push("Key Points:\n" + cleanKeypoints);
    if (cleanActionitems) textParts.push("Action Items:\n" + cleanActionitems);

    return textParts.join("\n\n").trim();
  }

  function showTooltip(button, message) {
    button.setAttribute("data-tooltip", message);
    button.classList.add("show-tooltip");
    setTimeout(() => {
      button.classList.remove("show-tooltip");
      button.removeAttribute("data-tooltip");
    }, 2000);
  }

  async function copyAllToClipboard() {
    const text = buildExportText();
    if (!text) return showTooltip(copyBtn, "Nothing to copy!");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setStatus("✅ All content copied to clipboard!");
    } catch (err) {
      console.error("[copy] failed", err);
      setStatus("❌ Failed to copy.");
    }
  }

  function downloadAll() {
    const summary = summaryEl?.textContent.trim();
    const keypoints = keypointsEl?.textContent.trim();
    const actionitems = actionitemsEl?.textContent.trim();

    if (
      (!summary || summary.startsWith("(No")) &&
      (!keypoints || keypoints.startsWith("(No")) &&
      (!actionitems || actionitems.startsWith("(No"))
    ) {
      return showTooltip(downloadBtn, "Nothing to download!");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    function addSection(title, content) {
      if (content && !content.startsWith("(No")) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(title, 10, y);
        y += 8;
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        const lines = doc.splitTextToSize(content, 180);
        doc.text(lines, 10, y);
        y += lines.length * 6 + 8;
      }
    }

    addSection("Summary:", summary);
    addSection("Key Points:", keypoints);
    addSection("Action Items:", actionitems);

    const now = new Date();
    const filename = `summary-${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.pdf`;

    doc.save(filename);
    setStatus("✅ PDF downloaded!");
  }

  /* ---------- Button bindings ---------- */
  copyBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    copyAllToClipboard();
  });
  downloadBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    downloadAll();
  });

  /* ---------- Toggle extracted text ---------- */
  toggleExtractedBtn?.addEventListener("click", () => {
    if (
      extractedTextEl.style.display === "none" ||
      extractedTextEl.style.display === ""
    ) {
      extractedTextEl.style.display = "block";
      toggleExtractedBtn.querySelector("img").src = "assets/expand.svg";
    } else {
      extractedTextEl.style.display = "none";
      toggleExtractedBtn.querySelector("img").src = "assets/expand.svg";
    }
  });

  /* ---------- Length buttons ---------- */
  const lengthButtons = document.querySelectorAll(".length-btn");
  lengthButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      lengthButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedLength = btn.dataset.length;
    });
  });

  console.info("main.js initialized with tooltips for copy/download.");
});

/* ---------- Loading Overlay ---------- */
function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}
