const KEYS = {
  URL: "savely_api_url",
  TOKEN: "savely_api_token",
  USER: "savely_user_info",
};

// DOM
const $ = (id) => document.getElementById(id);
const setupSection = $("setup-section");
const connectedSection = $("connected-section");
const apiUrlInput = $("api-url");
const apiTokenInput = $("api-token");
const connectBtn = $("connect-btn");
const disconnectBtn = $("disconnect-btn");
const connectStatus = $("connect-status");
const userInfo = $("user-info");
const platformBadge = $("platform-badge");
const platformIcon = $("platform-icon");
const platformName = $("platform-name");
const platformMsg = $("platform-msg");
const scrapeBtn = $("scrape-btn");
const resultsSection = $("results-section");
const resultsList = $("results-list");
const resultsCount = $("results-count");
const syncBtn = $("sync-btn");
const syncStatus = $("sync-status");

let scrapedData = [];
let currentPlatform = null;

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  const stored = await chrome.storage.local.get([
    KEYS.URL,
    KEYS.TOKEN,
    KEYS.USER,
  ]);
  if (stored[KEYS.TOKEN] && stored[KEYS.URL]) {
    showConnected(stored[KEYS.USER]);
    detectPlatform();
  } else {
    showSetup();
  }
}

function showSetup() {
  setupSection.classList.remove("hidden");
  connectedSection.classList.add("hidden");
}

function showConnected(info) {
  setupSection.classList.add("hidden");
  connectedSection.classList.remove("hidden");
  if (info?.user) {
    userInfo.textContent = `Connected as ${info.user}`;
  }
}

function showStatus(el, msg, type) {
  el.textContent = msg;
  el.className = `status ${type}`;
  el.classList.remove("hidden");
}

function hideStatus(el) {
  el.classList.add("hidden");
}

// ── Platform Detection ────────────────────────────────────────────────────
async function detectPlatform() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab?.url || "";

    if (url.includes("linkedin.com")) {
      currentPlatform = "linkedin";
      platformBadge.className = "platform-badge linkedin";
      platformBadge.classList.remove("hidden");
      platformIcon.textContent = "🔗";
      platformName.textContent = "LinkedIn";
      platformMsg.textContent = "Ready to scrape LinkedIn saved posts.";
      scrapeBtn.disabled = false;
    } else if (url.includes("youtube.com")) {
      currentPlatform = "youtube";
      platformBadge.className = "platform-badge youtube";
      platformBadge.classList.remove("hidden");
      platformIcon.textContent = "▶";
      platformName.textContent = "YouTube Playlist";
      platformMsg.textContent = "Ready to scrape YouTube videos.";
      scrapeBtn.disabled = false;
    } else {
      currentPlatform = null;
      platformBadge.classList.add("hidden");
      platformMsg.textContent =
        "Navigate to LinkedIn or YouTube to get started.";
      scrapeBtn.disabled = true;
    }
  } catch (err) {
    console.error("detectPlatform:", err);
  }
}

// ── Connect ───────────────────────────────────────────────────────────────
connectBtn.addEventListener("click", async () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/$/, "");
  const token = apiTokenInput.value.trim();

  if (!apiUrl || !token) {
    showStatus(connectStatus, "Enter both URL and token.", "error");
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  hideStatus(connectStatus);

  try {
    const res = await fetch(`${apiUrl}/api/extension/sync`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    await chrome.storage.local.set({
      [KEYS.URL]: apiUrl,
      [KEYS.TOKEN]: token,
      [KEYS.USER]: data,
    });

    showConnected(data);
    detectPlatform();
  } catch (err) {
    showStatus(connectStatus, err.message, "error");
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect";
  }
});

// ── Disconnect ────────────────────────────────────────────────────────────
disconnectBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove([KEYS.URL, KEYS.TOKEN, KEYS.USER]);
  scrapedData = [];
  resultsSection.classList.add("hidden");
  showSetup();
});

// ── Scrape ────────────────────────────────────────────────────────────────
scrapeBtn.addEventListener("click", async () => {
  if (!currentPlatform) return;

  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<span class="btn-icon">⏳</span> Scraping...';
  hideStatus(syncStatus);

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Inject and execute the scraper in the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: currentPlatform === "linkedin" ? scrapeLinkedIn : scrapeYouTube,
    });

    scrapedData = results[0]?.result || [];

    if (scrapedData.length === 0) {
      showStatus(
        syncStatus,
        "No posts found. Scroll down to load more content and try again.",
        "info",
      );
      resultsSection.classList.add("hidden");
    } else {
      renderResults();
      resultsSection.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Scrape error:", err);
    showStatus(syncStatus, "Scrape failed: " + err.message, "error");
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span class="btn-icon">🔍</span> Scrape This Page';
  }
});

// ── Render Results ────────────────────────────────────────────────────────
function renderResults() {
  resultsCount.textContent = scrapedData.length;
  resultsList.innerHTML = "";

  scrapedData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const title =
      currentPlatform === "linkedin"
        ? item.authorName || "LinkedIn Post"
        : item.title || "YouTube Video";

    const meta = currentPlatform === "linkedin" ? "" : item.duration || "";

    div.innerHTML = `
      <span class="title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
      ${meta ? `<span class="meta">${escapeHtml(meta)}</span>` : ""}
    `;
    resultsList.appendChild(div);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ── Sync to App ───────────────────────────────────────────────────────────
syncBtn.addEventListener("click", async () => {
  if (scrapedData.length === 0) return;

  syncBtn.disabled = true;
  syncBtn.innerHTML = '<span class="btn-icon">⏳</span> Syncing...';
  hideStatus(syncStatus);

  try {
    const stored = await chrome.storage.local.get([KEYS.URL, KEYS.TOKEN]);

    const payload =
      currentPlatform === "linkedin"
        ? { platform: "linkedin", posts: scrapedData }
        : { platform: "youtube", videos: scrapedData };

    const res = await fetch(`${stored[KEYS.URL]}/api/extension/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stored[KEYS.TOKEN]}`,
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
      syncStatus,
      `✓ Synced ${result.saved} posts${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}`,
      "success",
    );
  } catch (err) {
    showStatus(syncStatus, err.message, "error");
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = '<span class="btn-icon">↑</span> Sync to App';
  }
});

// ── LinkedIn Scraper (injected into page) ─────────────────────────────────
function scrapeLinkedIn() {
  const posts = [];

  // Main feed posts / saved items
  const feedPosts = document.querySelectorAll(
    ".feed-shared-update-v2, [data-urn*='activity'], .occludable-update, .reusable-search__result-container",
  );

  feedPosts.forEach((post) => {
    try {
      const authorEl =
        post.querySelector(
          ".update-components-actor__name .hoverable-link-text",
        ) ||
        post.querySelector(".update-components-actor__name") ||
        post.querySelector(".feed-shared-actor__name");
      const authorName = authorEl?.innerText?.trim() || "";

      const authorLinkEl =
        post.querySelector(".update-components-actor__meta-link") ||
        post.querySelector(".feed-shared-actor__container a") ||
        post.querySelector("a[href*='/in/']");
      const authorProfileURL = authorLinkEl?.href || "";

      const jobEl =
        post.querySelector(".update-components-actor__description") ||
        post.querySelector(".feed-shared-actor__description");
      const authorJobTitle = jobEl?.innerText?.trim() || "";

      // Post URL from activity URN
      let postURL = "";
      const urn =
        post.getAttribute("data-urn") ||
        post.querySelector("[data-urn]")?.getAttribute("data-urn") ||
        "";
      const activityMatch = urn.match(/activity:(\d+)/);
      if (activityMatch) {
        postURL = `https://www.linkedin.com/feed/update/urn:li:activity:${activityMatch[1]}`;
      }
      if (!postURL) {
        const linkEl = post.querySelector("a[href*='activity']");
        postURL = linkEl?.href || authorProfileURL || window.location.href;
      }

      // Content
      const contentEl =
        post.querySelector(".feed-shared-update-v2__description") ||
        post.querySelector(".update-components-text") ||
        post.querySelector(".feed-shared-text");
      const postContent = contentEl?.innerText?.trim() || authorJobTitle || "";

      // Image
      const imgEl =
        post.querySelector(".update-components-actor__image img") ||
        post.querySelector(".feed-shared-actor__avatar img") ||
        post.querySelector(".presence-entity__image") ||
        post.querySelector("img");
      const postImage = imgEl?.src || "";

      if (authorName || postContent) {
        posts.push({
          authorName,
          authorProfileURL,
          authorJobTitle,
          postURL,
          postContent,
          postImage,
          timeSincePosted: "",
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Savely scrape error:", e);
    }
  });

  // Deduplicate by postURL
  const seen = new Set();
  return posts.filter((p) => {
    if (seen.has(p.postURL)) return false;
    seen.add(p.postURL);
    return true;
  });
}

// ── YouTube Scraper (injected into page) ──────────────────────────────────
function scrapeYouTube() {
  const videos = [];

  const videoEls = document.querySelectorAll(
    "ytd-playlist-video-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer",
  );

  videoEls.forEach((el) => {
    try {
      const linkEl =
        el.querySelector("a#video-title") ||
        el.querySelector("a[href*='watch']") ||
        el.querySelector("a#thumbnail");
      const videoUrl = linkEl?.href || "";

      const idMatch = videoUrl.match(/[?&]v=([^&]+)/);
      const videoId = idMatch?.[1] || "";
      if (!videoId) return;

      const titleEl = el.querySelector("#video-title");
      const title = titleEl?.textContent?.trim() || "";

      const channelEl =
        el.querySelector("#channel-name a") ||
        el.querySelector(".ytd-channel-name a") ||
        el.querySelector("#text.ytd-channel-name");
      const channelName = channelEl?.textContent?.trim() || "";
      const channelUrl = channelEl?.href || "";

      const thumbEl = el.querySelector("img#img, img.yt-core-image");
      let thumbnailUrl = thumbEl?.src || "";
      if (!thumbnailUrl || thumbnailUrl.includes("empty")) {
        thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      const durationEl = el.querySelector(
        "span.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text",
      );
      const duration = durationEl?.textContent?.trim() || "";

      if (videoId && title) {
        videos.push({
          videoId,
          title,
          channelName,
          channelUrl,
          thumbnailUrl,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          duration,
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Savely scrape error:", e);
    }
  });

  // Deduplicate
  const seen = new Set();
  return videos.filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

// ── Start ─────────────────────────────────────────────────────────────────
init();
