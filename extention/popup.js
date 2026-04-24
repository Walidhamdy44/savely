// DOM Elements
const scrapeBtn = document.getElementById("scrapeBtn");
const scrapeAgainBtn = document.getElementById("scrapeAgainBtn");
const downloadBtn = document.getElementById("downloadBtn");
const syncBtn = document.getElementById("syncBtn");
const copyBtn = document.getElementById("copyBtn");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const progressCount = document.getElementById("progressCount");
const progressFill = document.getElementById("progressFill");
const previewContainer = document.getElementById("previewContainer");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const postCount = document.getElementById("postCount");
const emptyState = document.getElementById("emptyState");
const actionCard = document.querySelector(".action-card");
const platformBadge = document.getElementById("platformBadge");

// Connection DOM
const connectionBody = document.getElementById("connectionBody");
const connectedInfo = document.getElementById("connectedInfo");
const connectedUser = document.getElementById("connectedUser");
const toggleConnectionBtn = document.getElementById("toggleConnectionBtn");
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const apiTokenInput = document.getElementById("apiToken");
const connectionStatus = document.getElementById("connectionStatus");

// Storage keys
const STORAGE = {
  TOKEN: "savely_api_token",
  USER: "savely_user_info",
};

// Hardcoded API URL — change this when you deploy
const API_URL = "http://localhost:3000";

// State
let scrapedData = [];
let currentPlatform = null;
let isScrapingActive = false;

// Platform configurations
const PLATFORMS = {
  linkedin: {
    name: "LinkedIn",
    urlPattern: "linkedin.com/my-items/saved-posts",
    contentScript: "content-linkedin.js",
    icon: "in",
    columns: ["Author", "Content", "Time"],
    fields: ["authorName", "postContent", "timeSincePosted"],
    filenamePrefix: "linkedin-saved-posts",
  },
  youtube: {
    name: "YouTube",
    urlPattern: ["youtube.com/playlist", "youtube.com/feed/playlists"],
    contentScript: "content-youtube.js",
    icon: "▶",
    columns: ["Title", "Channel", "Duration"],
    fields: ["videoTitle", "channelName", "duration"],
    filenamePrefix: "youtube-playlist",
  },
  instagram: {
    name: "Instagram",
    urlPattern: "instagram.com",
    contentScript: "content-instagram.js",
    icon: "📷",
    columns: ["Image", "Caption", "URL"],
    fields: ["postImage", "postCaption", "postURL"],
    filenamePrefix: "instagram-saved-posts",
  },
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  scrapeBtn.addEventListener("click", startScraping);
  scrapeAgainBtn.addEventListener("click", startScraping);
  downloadBtn.addEventListener("click", downloadData);
  copyBtn.addEventListener("click", copyToClipboard);
  syncBtn.addEventListener("click", syncToApp);
  toggleConnectionBtn.addEventListener("click", toggleConnectionPanel);
  connectBtn.addEventListener("click", connectToApp);
  disconnectBtn.addEventListener("click", disconnectFromApp);

  // Load saved connection
  await loadConnection();

  // Check current page
  await detectPlatform();
});

// Detect current platform
async function detectPlatform() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.url.includes(PLATFORMS.linkedin.urlPattern)) {
      currentPlatform = "linkedin";
      showPlatformBadge("linkedin", "LinkedIn Saved Posts");
    } else if (PLATFORMS.youtube.urlPattern.some((p) => tab.url.includes(p))) {
      currentPlatform = "youtube";
      showPlatformBadge("youtube", "YouTube Playlist");
    } else if (tab.url.includes(PLATFORMS.instagram.urlPattern)) {
      currentPlatform = "instagram";
      showPlatformBadge("instagram", "Instagram");
    } else {
      currentPlatform = null;
      emptyState.classList.remove("hidden");
      actionCard.classList.add("hidden");
    }
  } catch (e) {
    console.error("Error detecting platform:", e);
  }
}

// Show platform badge
function showPlatformBadge(platform, name) {
  platformBadge.className = `platform-badge ${platform}`;
  platformBadge.querySelector(".platform-name").textContent = name;
  platformBadge.querySelector(".platform-icon").textContent =
    PLATFORMS[platform].icon;
  platformBadge.classList.remove("hidden");
  emptyState.classList.add("hidden");
  actionCard.classList.remove("hidden");
}

// Show status message
function showStatus(message, type = "info") {
  const iconMap = { success: "✓", error: "✕", warning: "!", info: "i" };
  statusEl.className = `status ${type}`;
  statusEl.querySelector(".status-icon").textContent = iconMap[type] || "i";
  statusEl.querySelector(".status-text").textContent = message;
  statusEl.classList.remove("hidden");

  if (type === "success" || type === "error") {
    setTimeout(() => statusEl.classList.add("hidden"), 5000);
  }
}

// Update progress
function updateProgress(current, total, text) {
  progressEl.classList.remove("hidden");
  progressText.textContent = text || "Scraping...";
  progressCount.textContent = `${current} items found`;
  const percentage = total > 0 ? (current / total) * 100 : current > 0 ? 50 : 0;
  progressFill.style.width = `${Math.min(percentage, 100)}%`;
}

// Hide progress
function hideProgress() {
  progressEl.classList.add("hidden");
  progressFill.style.width = "0%";
}

// Start scraping
async function startScraping() {
  if (isScrapingActive || !currentPlatform) return;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const platform = PLATFORMS[currentPlatform];

    isScrapingActive = true;
    scrapeBtn.disabled = true;
    scrapeBtn.innerHTML =
      '<span class="spinner"></span><span>Scraping...</span>';
    previewContainer.classList.add("hidden");
    actionCard.classList.remove("hidden");

    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [platform.contentScript],
      });
    } catch (e) {
      console.log("Script injection note:", e.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    chrome.tabs.sendMessage(tab.id, { action: "startScraping" }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus(
          "Failed to connect. Please refresh the page and try again.",
          "error",
        );
        resetScrapeButton();
      }
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
    resetScrapeButton();
  }
}

// Reset scrape button
function resetScrapeButton() {
  isScrapingActive = false;
  scrapeBtn.disabled = false;
  scrapeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
    <span>Scrape Current Page</span>
  `;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "progress":
      updateProgress(message.current, message.total, message.text);
      break;
    case "complete":
      handleScrapingComplete(message.data, message.platform);
      break;
    case "error":
      showStatus(message.error, "error");
      resetScrapeButton();
      hideProgress();
      break;
  }
});

// Handle scraping complete
function handleScrapingComplete(data, platform) {
  scrapedData = data;
  if (platform) currentPlatform = platform;

  resetScrapeButton();
  hideProgress();

  if (data.length === 0) {
    showStatus("No items found on this page", "warning");
    return;
  }

  showStatus(`Successfully scraped ${data.length} items!`, "success");
  renderPreviewTable(data);
  previewContainer.classList.remove("hidden");
  postCount.textContent = data.length;
  actionCard.classList.add("hidden");
}

// Render preview table based on platform
function renderPreviewTable(data) {
  const platform = PLATFORMS[currentPlatform];

  // Build header
  tableHead.innerHTML = `<tr>${platform.columns.map((col) => `<th>${col}</th>`).join("")}</tr>`;

  // Build body
  tableBody.innerHTML = "";
  data.forEach((item) => {
    const row = document.createElement("tr");

    if (currentPlatform === "linkedin") {
      row.innerHTML = `
        <td><a href="${escapeHtml(item.authorProfileURL || "#")}" target="_blank" title="${escapeHtml(item.authorName)}">${escapeHtml(item.authorName || "Unknown")}</a></td>
        <td title="${escapeHtml(item.postContent)}">${escapeHtml(truncate(item.postContent, 40))}</td>
        <td>${escapeHtml(item.timeSincePosted || "—")}</td>
      `;
    } else if (currentPlatform === "youtube") {
      row.innerHTML = `
        <td><a href="${escapeHtml(item.videoURL || "#")}" target="_blank" title="${escapeHtml(item.videoTitle)}">${escapeHtml(truncate(item.videoTitle, 30))}</a></td>
        <td><a href="${escapeHtml(item.channelURL || "#")}" target="_blank">${escapeHtml(truncate(item.channelName, 20))}</a></td>
        <td>${escapeHtml(item.duration || "—")}</td>
      `;
    } else if (currentPlatform === "instagram") {
      row.innerHTML = `
        <td>${item.postImage ? `<img src="${escapeHtml(item.postImage)}" class="thumbnail" />` : "—"}</td>
        <td title="${escapeHtml(item.postCaption)}">${escapeHtml(truncate(item.postCaption, 40) || "—")}</td>
        <td><a href="${escapeHtml(item.postURL || "#")}" target="_blank">Open</a></td>
      `;
    }

    tableBody.appendChild(row);
  });
}

// Utility functions
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function truncate(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function getSelectedFormat() {
  return document.querySelector('input[name="format"]:checked').value;
}

// Convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const escapeCSV = (value) => {
    if (!value) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map((h) => escapeCSV(formatHeader(h))).join(",");
  const rows = data.map((item) =>
    headers.map((h) => escapeCSV(item[h])).join(","),
  );

  return [headerRow, ...rows].join("\n");
}

function formatHeader(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Generate filename
function generateFilename(format) {
  const platform = PLATFORMS[currentPlatform];
  const date = new Date().toISOString().split("T")[0];
  return `${platform.filenamePrefix}-${date}.${format}`;
}

// Download data
async function downloadData() {
  if (scrapedData.length === 0) {
    showStatus("No data to download", "warning");
    return;
  }

  const format = getSelectedFormat();
  const filename = generateFilename(format);
  let content, mimeType;

  if (format === "json") {
    content = JSON.stringify(scrapedData, null, 2);
    mimeType = "application/json";
  } else {
    content = convertToCSV(scrapedData);
    mimeType = "text/csv";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({ url, filename, saveAs: true });
    showStatus(`Downloaded ${filename}`, "success");
  } catch (error) {
    showStatus(`Download failed: ${error.message}`, "error");
  }
}

// Copy to clipboard
async function copyToClipboard() {
  if (scrapedData.length === 0) {
    showStatus("No data to copy", "warning");
    return;
  }

  const format = getSelectedFormat();
  const content =
    format === "json"
      ? JSON.stringify(scrapedData, null, 2)
      : convertToCSV(scrapedData);

  try {
    await navigator.clipboard.writeText(content);
    showStatus("Copied to clipboard!", "success");
  } catch (error) {
    showStatus("Failed to copy to clipboard", "error");
  }
}

// ── Connection Management ─────────────────────────────────────────────────

async function loadConnection() {
  const stored = await chrome.storage.local.get([STORAGE.TOKEN, STORAGE.USER]);
  if (stored[STORAGE.TOKEN]) {
    showConnectedState(stored[STORAGE.USER]);
  } else {
    showDisconnectedState();
  }
}

function showConnectedState(userInfo) {
  connectionBody.classList.add("hidden");
  connectedInfo.classList.remove("hidden");
  connectedUser.textContent = userInfo?.user
    ? `Connected as ${userInfo.user}`
    : "Connected";
}

function showDisconnectedState() {
  connectedInfo.classList.add("hidden");
  // Show the form by default when not connected
  connectionBody.classList.remove("hidden");
}

function toggleConnectionPanel() {
  connectionBody.classList.toggle("hidden");
}

function showConnectionStatus(msg, type) {
  connectionStatus.className = `status ${type}`;
  connectionStatus.querySelector(".status-icon").textContent =
    type === "success" ? "✓" : type === "error" ? "✕" : "i";
  connectionStatus.querySelector(".status-text").textContent = msg;
  connectionStatus.classList.remove("hidden");
  if (type === "success") {
    setTimeout(() => connectionStatus.classList.add("hidden"), 3000);
  }
}

async function connectToApp() {
  const token = apiTokenInput.value.trim();

  if (!token) {
    showConnectionStatus("Enter your API token.", "error");
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_URL}/api/extension/sync`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    await chrome.storage.local.set({
      [STORAGE.TOKEN]: token,
      [STORAGE.USER]: data,
    });

    showConnectedState(data);
    showConnectionStatus("Connected!", "success");
  } catch (err) {
    showConnectionStatus(err.message, "error");
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect";
  }
}

async function disconnectFromApp() {
  await chrome.storage.local.remove([STORAGE.TOKEN, STORAGE.USER]);
  showDisconnectedState();
  apiTokenInput.value = "";
  connectionStatus.classList.add("hidden");
}

// ── Sync to App ───────────────────────────────────────────────────────────

async function syncToApp() {
  if (scrapedData.length === 0) {
    showStatus("No data to sync. Scrape first!", "warning");
    return;
  }

  const stored = await chrome.storage.local.get([STORAGE.TOKEN]);
  if (!stored[STORAGE.TOKEN]) {
    showStatus(
      "Connect to your app first (click the settings icon above).",
      "warning",
    );
    return;
  }

  syncBtn.disabled = true;
  const origHTML = syncBtn.innerHTML;
  syncBtn.innerHTML = '<span class="spinner"></span><span>Syncing...</span>';

  try {
    let payload;
    if (currentPlatform === "linkedin") {
      payload = { platform: "linkedin", posts: scrapedData };
    } else if (currentPlatform === "youtube") {
      // Map YouTube fields to what the API expects
      const videos = scrapedData.map((v) => ({
        videoId: extractVideoId(v.videoURL) || v.videoTitle,
        title: v.videoTitle,
        channelName: v.channelName,
        channelUrl: v.channelURL,
        thumbnailUrl: v.videoThumbnail,
        videoUrl: v.videoURL,
        description: v.viewCount || "",
        duration: v.duration,
        scrapedAt: v.scrapedAt,
      }));
      payload = { platform: "youtube", videos };
    } else if (currentPlatform === "instagram") {
      payload = { platform: "instagram", posts: scrapedData };
    } else {
      showStatus("Unknown platform", "error");
      return;
    }

    const res = await fetch(`${API_URL}/api/extension/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stored[STORAGE.TOKEN]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const result = await res.json();
    showStatus(
      `Synced ${result.saved} items to your app!${result.skipped > 0 ? ` (${result.skipped} skipped${result.debugErrors ? ": " + result.debugErrors[0] : ""})` : ""}`,
      result.saved > 0 ? "success" : "error",
    );
  } catch (err) {
    showStatus(`Sync failed: ${err.message}`, "error");
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = origHTML;
  }
}

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}
