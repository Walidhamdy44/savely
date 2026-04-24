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
    const msg =
      err.message === "Failed to fetch"
        ? `Cannot reach ${apiUrl}. Make sure the app is running and the URL is correct.`
        : err.message;
    showStatus(connectStatus, msg, "error");
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
    const msg =
      err.message === "Failed to fetch"
        ? "Cannot reach the server. Make sure the app is running."
        : err.message;
    showStatus(syncStatus, msg, "error");
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = '<span class="btn-icon">↑</span> Sync to App';
  }
});

// ── LinkedIn Scraper (injected into page) ─────────────────────────────────
function scrapeLinkedIn() {
  const posts = [];

  // LinkedIn uses obfuscated/concatenated class names, so we MUST use
  // attribute-contains selectors [class*='...'] instead of .class selectors

  // Strategy 1: Saved posts page — uses scaffold-finite-scroll with li items
  const savedPostItems = document.querySelectorAll(
    ".scaffold-finite-scroll__content li, [class*='reusable-search'] li",
  );

  if (savedPostItems.length > 0) {
    savedPostItems.forEach((item) => {
      try {
        // Skip filter pills (they're also <li> elements)
        if (item.className.includes("search-reusables")) return;

        // Author name — find span with aria-hidden="true" inside a profile link
        let authorName = "";
        const nameSpans = item.querySelectorAll(
          'a[href*="/in/"] span[aria-hidden="true"]',
        );
        for (const span of nameSpans) {
          const text = span.innerText.trim();
          if (
            text &&
            text.length > 1 &&
            !text.includes("View") &&
            !text.includes("•")
          ) {
            authorName = text;
            break;
          }
        }

        // Profile URL
        const profileEl = item.querySelector('a[href*="/in/"]');
        const authorProfileURL = profileEl?.href?.split("?")[0] || "";

        // Job title — in the linked-area div after the name
        let authorJobTitle = "";
        const linkedAreas = item.querySelectorAll("[class*='linked-area']");
        if (linkedAreas.length > 0) {
          // First linked-area usually has the job title
          const firstLinked = linkedAreas[0];
          const divs = firstLinked.querySelectorAll("div");
          for (const div of divs) {
            const text = div.innerText.trim();
            if (
              text &&
              !text.includes("•") &&
              !text.match(/^\d+[hdwmy]/) &&
              text.length > 3
            ) {
              authorJobTitle = text;
              break;
            }
          }
        }

        // Post URL — activity link
        let postURL = "";
        const activityLink =
          item.querySelector("a[href*='activity']") ||
          item.querySelector("a[href*='/feed/update/']");
        if (activityLink?.href) {
          postURL = activityLink.href.split("?")[0];
        }
        if (!postURL) postURL = authorProfileURL;

        // POST CONTENT — the key fix: use [class*='content-summary']
        let postContent = "";
        const contentEl = item.querySelector("[class*='content-summary']");
        if (contentEl) {
          postContent = contentEl.innerText.trim();
        }
        // Fallback: try any <p> inside div.mh4
        if (!postContent) {
          const mh4 = item.querySelector("div.mh4");
          if (mh4) {
            const p = mh4.querySelector("p");
            if (p) postContent = p.innerText.trim();
          }
        }

        // Image — profile photo or post image
        let postImage = "";
        const imgs = item.querySelectorAll("img");
        for (const img of imgs) {
          const src = img.src || "";
          if (src && !src.includes("data:image") && src.startsWith("http")) {
            postImage = src;
            break;
          }
        }

        if (authorName || postURL) {
          posts.push({
            authorName,
            authorProfileURL,
            authorJobTitle,
            postURL,
            postContent: postContent || authorJobTitle,
            postImage,
            timeSincePosted: "",
            scrapedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Savely scrape error:", e);
      }
    });
  }

  // Strategy 2: Feed page — posts have full content visible
  if (posts.length === 0) {
    const feedPosts = document.querySelectorAll(
      ".feed-shared-update-v2, [data-urn*='activity'], .occludable-update",
    );

    feedPosts.forEach((post) => {
      try {
        const authorEl =
          post.querySelector("[class*='update-components-actor__name']") ||
          post.querySelector("[class*='feed-shared-actor__name']");
        const authorName = authorEl?.innerText?.trim() || "";

        const authorLinkEl = post.querySelector('a[href*="/in/"]');
        const authorProfileURL = authorLinkEl?.href || "";

        const jobEl =
          post.querySelector(
            "[class*='update-components-actor__description']",
          ) || post.querySelector("[class*='feed-shared-actor__description']");
        const authorJobTitle = jobEl?.innerText?.trim() || "";

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

        const contentEl =
          post.querySelector("[class*='feed-shared-update-v2__description']") ||
          post.querySelector("[class*='update-components-text']") ||
          post.querySelector("[class*='feed-shared-text']") ||
          post.querySelector("[class*='break-words']");
        const postContent =
          contentEl?.innerText?.trim() || authorJobTitle || "";

        const imgEl =
          post.querySelector("[class*='feed-shared-image'] img") ||
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
  }

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
