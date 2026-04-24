// Savely - YouTube Content Script
(function () {
  "use strict";

  const CONFIG = {
    MAX_VIDEOS: 1000,
    SCROLL_DELAY: 600,
    SCROLL_AMOUNT: 1200,
    MAX_SCROLL_ATTEMPTS: 200,
  };

  let isScrapingActive = false;
  let scrapedVideos = new Map();

  function cleanText(text) {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ")
      .trim();
  }

  function extractVideoData(videoElement) {
    try {
      const data = {
        videoTitle: "",
        videoURL: "",
        videoThumbnail: "",
        channelName: "",
        channelURL: "",
        duration: "",
        viewCount: "",
        uploadDate: "",
        scrapedAt: new Date().toISOString(),
      };

      // Video title
      const titleSelectors = [
        "#video-title",
        "a#video-title",
        "h3.ytd-playlist-video-renderer a",
        "span#video-title",
        ".title-and-badge a",
      ];
      for (const selector of titleSelectors) {
        const el = videoElement.querySelector(selector);
        if (el) {
          data.videoTitle = cleanText(
            el.textContent || el.getAttribute("title"),
          );
          if (el.href) {
            data.videoURL = el.href.split("&list=")[0];
          }
          if (data.videoTitle) break;
        }
      }

      // Video URL fallback
      if (!data.videoURL) {
        const linkEl = videoElement.querySelector('a[href*="/watch"]');
        if (linkEl) {
          data.videoURL = linkEl.href.split("&list=")[0];
        }
      }

      // Thumbnail
      const thumbSelectors = [
        "img.yt-core-image",
        "ytd-thumbnail img",
        "#thumbnail img",
        "img[src*='ytimg.com']",
      ];
      for (const selector of thumbSelectors) {
        const el = videoElement.querySelector(selector);
        if (el && el.src && !el.src.includes("data:")) {
          data.videoThumbnail = el.src;
          break;
        }
      }

      // Channel name and URL
      const channelSelectors = [
        "ytd-channel-name a",
        "#channel-name a",
        ".ytd-channel-name a",
        "a.yt-simple-endpoint[href*='/@']",
        "a.yt-simple-endpoint[href*='/channel/']",
      ];
      for (const selector of channelSelectors) {
        const el = videoElement.querySelector(selector);
        if (el) {
          data.channelName = cleanText(el.textContent);
          data.channelURL = el.href;
          if (data.channelName) break;
        }
      }

      // Duration
      const durationSelectors = [
        "ytd-thumbnail-overlay-time-status-renderer span",
        "span.ytd-thumbnail-overlay-time-status-renderer",
        "#overlays span",
        "badge-shape .badge-shape-wiz__text",
      ];
      for (const selector of durationSelectors) {
        const el = videoElement.querySelector(selector);
        if (el && el.textContent.trim()) {
          const text = cleanText(el.textContent);
          if (text.match(/^\d+:\d+/) || text.match(/^\d+:\d+:\d+/)) {
            data.duration = text;
            break;
          }
        }
      }

      // View count and upload date from metadata
      const metaSelectors = [
        "#video-info span",
        ".ytd-video-meta-block span",
        "#metadata-line span",
      ];
      const metaElements = videoElement.querySelectorAll(
        metaSelectors.join(", "),
      );
      metaElements.forEach((el) => {
        const text = cleanText(el.textContent);
        if (text.includes("view")) {
          data.viewCount = text;
        } else if (
          text.includes("ago") ||
          text.match(/\d+\s*(day|week|month|year)/i)
        ) {
          data.uploadDate = text;
        }
      });

      // Index/position in playlist
      const indexEl = videoElement.querySelector(
        "#index, .ytd-playlist-video-renderer #index",
      );
      if (indexEl) {
        data.playlistIndex = cleanText(indexEl.textContent);
      }

      const uniqueId =
        data.videoURL || `${data.videoTitle}-${data.channelName}`;
      return { ...data, uniqueId };
    } catch (error) {
      console.error("Error extracting video data:", error);
      return null;
    }
  }

  function findVideoContainers() {
    const selectors = [
      "ytd-playlist-video-renderer",
      "ytd-playlist-panel-video-renderer",
      "ytd-video-renderer",
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} videos using: ${selector}`);
        return Array.from(elements);
      }
    }
    return [];
  }

  function getPlaylistInfo() {
    const info = {
      playlistTitle: "",
      playlistURL: window.location.href,
      totalVideos: "",
    };

    // Playlist title
    const titleSelectors = [
      "yt-formatted-string.ytd-playlist-header-renderer",
      "#title yt-formatted-string",
      "h1.ytd-playlist-header-renderer",
      ".metadata-wrapper yt-formatted-string",
    ];
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        info.playlistTitle = cleanText(el.textContent);
        break;
      }
    }

    // Total videos count
    const countSelectors = [
      "yt-formatted-string.byline-item",
      ".metadata-stats yt-formatted-string",
      "#stats yt-formatted-string",
    ];
    for (const selector of countSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.includes("video")) {
        info.totalVideos = cleanText(el.textContent);
        break;
      }
    }

    return info;
  }

  function scrollToLoadMore() {
    return new Promise((resolve) => {
      // For playlists, we need to scroll within the playlist container
      const playlistContainer = document.querySelector(
        "ytd-playlist-video-list-renderer, #contents.ytd-playlist-video-list-renderer",
      );

      const scrollTarget = playlistContainer || window;
      const currentScroll = playlistContainer
        ? playlistContainer.scrollTop
        : window.scrollY;
      const maxScroll = playlistContainer
        ? playlistContainer.scrollHeight - playlistContainer.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;

      if (currentScroll >= maxScroll - 100) {
        resolve(false);
        return;
      }

      if (playlistContainer) {
        playlistContainer.scrollBy({
          top: CONFIG.SCROLL_AMOUNT,
          behavior: "smooth",
        });
      } else {
        window.scrollBy({ top: CONFIG.SCROLL_AMOUNT, behavior: "smooth" });
      }

      setTimeout(() => resolve(true), CONFIG.SCROLL_DELAY);
    });
  }

  function sendProgress(current, total, text) {
    try {
      chrome.runtime.sendMessage({ type: "progress", current, total, text });
    } catch (e) {}
  }

  function sendComplete(data) {
    try {
      chrome.runtime.sendMessage({
        type: "complete",
        data,
        platform: "youtube",
      });
    } catch (e) {}
  }

  function sendError(error) {
    try {
      chrome.runtime.sendMessage({ type: "error", error });
    } catch (e) {}
  }

  async function scrapeAllVideos() {
    if (isScrapingActive) return;
    isScrapingActive = true;
    scrapedVideos.clear();

    try {
      const playlistInfo = getPlaylistInfo();
      sendProgress(
        0,
        0,
        `Scraping: ${playlistInfo.playlistTitle || "YouTube Playlist"}...`,
      );

      let scrollAttempts = 0;
      let noNewContentCount = 0;
      let previousCount = 0;

      // Initial wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      while (
        scrollAttempts < CONFIG.MAX_SCROLL_ATTEMPTS &&
        scrapedVideos.size < CONFIG.MAX_VIDEOS &&
        noNewContentCount < 5
      ) {
        scrollAttempts++;
        const containers = findVideoContainers();

        for (const container of containers) {
          if (scrapedVideos.size >= CONFIG.MAX_VIDEOS) break;
          const videoData = extractVideoData(container);
          if (
            videoData &&
            videoData.uniqueId &&
            !scrapedVideos.has(videoData.uniqueId)
          ) {
            if (videoData.videoTitle || videoData.videoURL) {
              // Add playlist info to each video
              videoData.playlistTitle = playlistInfo.playlistTitle;
              videoData.playlistURL = playlistInfo.playlistURL;
              scrapedVideos.set(videoData.uniqueId, videoData);
            }
          }
        }

        sendProgress(
          scrapedVideos.size,
          CONFIG.MAX_VIDEOS,
          `Found ${scrapedVideos.size} videos...`,
        );

        const canScroll = await scrollToLoadMore();
        if (!canScroll || containers.length === previousCount) {
          noNewContentCount++;
        } else {
          noNewContentCount = 0;
        }
        previousCount = containers.length;

        // Small delay between scrolls
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const results = Array.from(scrapedVideos.values()).map(
        ({ uniqueId, ...video }) => video,
      );

      console.log(`YouTube scraping complete: ${results.length} videos`);
      sendComplete(results);
    } catch (error) {
      console.error("YouTube scraping error:", error);
      sendError(`YouTube scraping failed: ${error.message}`);
    } finally {
      isScrapingActive = false;
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "startScraping") {
      scrapeAllVideos();
      sendResponse({ status: "started" });
    }
    return true;
  });

  console.log("Savely: YouTube content script loaded");
})();
