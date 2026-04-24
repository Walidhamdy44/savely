// Savely - LinkedIn Content Script
(function () {
  "use strict";

  const CONFIG = {
    MAX_POSTS: 500,
    SCROLL_DELAY: 800,
    SCROLL_AMOUNT: 1200,
    MAX_SCROLL_ATTEMPTS: 100,
  };

  let isScrapingActive = false;
  let scrapedPosts = new Map();

  function cleanText(text) {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ")
      .trim();
  }

  function extractPostData(postElement) {
    try {
      const data = {
        authorName: "",
        authorProfileURL: "",
        authorJobTitle: "",
        postURL: "",
        postContent: "",
        postImage: "",
        timeSincePosted: "",
        scrapedAt: new Date().toISOString(),
      };

      // ── Author name ──────────────────────────────────────────
      // Find span with aria-hidden="true" inside a profile link
      const nameSpans = postElement.querySelectorAll(
        'a[href*="/in/"] span[aria-hidden="true"]',
      );
      for (const span of nameSpans) {
        const text = span.textContent.trim();
        if (
          text &&
          text.length > 1 &&
          !text.includes("View") &&
          !text.includes("•")
        ) {
          data.authorName = cleanText(text);
          break;
        }
      }

      // Fallback
      if (!data.authorName) {
        const profileLink = postElement.querySelector('a[href*="/in/"]');
        if (profileLink) {
          for (const span of profileLink.querySelectorAll("span")) {
            const text = span.textContent.trim();
            if (
              text &&
              text.length > 1 &&
              !text.includes("•") &&
              !text.includes("View")
            ) {
              data.authorName = cleanText(text);
              break;
            }
          }
        }
      }

      // ── Author profile URL ───────────────────────────────────
      const profileEl = postElement.querySelector('a[href*="/in/"]');
      if (profileEl && profileEl.href) {
        data.authorProfileURL = profileEl.href.split("?")[0];
      }

      // ── Author job title ─────────────────────────────────────
      // Job title is in a linked-area div, first div child
      const linkedAreas = postElement.querySelectorAll(
        "[class*='linked-area']",
      );
      if (linkedAreas.length > 0) {
        const firstLinked = linkedAreas[0];
        const divs = firstLinked.querySelectorAll("div");
        for (const div of divs) {
          const text = div.innerText?.trim();
          if (
            text &&
            !text.includes("•") &&
            !text.match(/^\d+[hdwmy]/) &&
            text.length > 3
          ) {
            data.authorJobTitle = cleanText(text);
            break;
          }
        }
      }

      // ── Post URL ─────────────────────────────────────────────
      const activityLink =
        postElement.querySelector("a[href*='activity']") ||
        postElement.querySelector("a[href*='/feed/update/']");
      if (activityLink && activityLink.href) {
        data.postURL = activityLink.href.split("?")[0];
      }

      // Fallback: data-urn
      if (!data.postURL) {
        const urnEl =
          postElement.querySelector("[data-urn]") ||
          postElement.closest("[data-urn]");
        if (urnEl) {
          const urn = urnEl.getAttribute("data-urn");
          const match = urn?.match(/(activity|ugcPost):(\d+)/);
          if (match) {
            data.postURL = `https://www.linkedin.com/feed/update/urn:li:${match[1]}:${match[2]}/`;
          }
        }
      }

      if (!data.postURL && data.authorProfileURL) {
        data.postURL = data.authorProfileURL;
      }

      // ── Post content (THE KEY FIX) ───────────────────────────
      // LinkedIn uses obfuscated classes — use attribute-contains selectors
      const contentEl =
        postElement.querySelector("[class*='content-summary']") ||
        postElement.querySelector("div.mh4 p") ||
        postElement.querySelector("[class*='content-inner-container'] p");
      if (contentEl) {
        data.postContent = cleanText(contentEl.innerText);
      }

      // Fallback to job title if no content
      if (!data.postContent && data.authorJobTitle) {
        data.postContent = data.authorJobTitle;
      }

      // ── Post image ───────────────────────────────────────────
      const imgs = postElement.querySelectorAll("img");
      for (const img of imgs) {
        const src = img.src || "";
        if (src && !src.includes("data:image") && src.startsWith("http")) {
          data.postImage = src;
          break;
        }
      }

      // ── Time since posted ────────────────────────────────────
      const allText = postElement.querySelectorAll("span, p, time");
      for (const el of allText) {
        const text = el.textContent.trim();
        const timeMatch = text.match(/^(\d+[hdwmy]r?)\s*•/i);
        if (timeMatch) {
          data.timeSincePosted = timeMatch[1];
          break;
        }
      }

      const uniqueId =
        data.postURL ||
        `${data.authorName}-${data.postContent.substring(0, 50)}`;
      return { ...data, uniqueId };
    } catch (error) {
      console.error("Savely: Error extracting post data:", error);
      return null;
    }
  }

  function findPostContainers() {
    // LinkedIn uses obfuscated classes — use attribute-contains and
    // scaffold-finite-scroll which is the reliable container
    const selectors = [
      ".scaffold-finite-scroll__content li",
      "[class*='reusable-search'] li",
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      // Filter out non-post items like filter pills
      const filtered = Array.from(elements).filter(
        (el) =>
          !el.className.includes("search-reusables") &&
          (el.querySelector('a[href*="/in/"]') ||
            el.querySelector("[data-urn]")),
      );
      if (filtered.length > 0) {
        console.log(
          `Savely: Found ${filtered.length} posts using: ${selector}`,
        );
        return filtered;
      }
    }

    // Fallback: get all li from main
    const mainList =
      document.querySelector(".scaffold-finite-scroll__content ul") ||
      document.querySelector("main ul");
    if (mainList) {
      const items = Array.from(mainList.children).filter(
        (el) =>
          el.tagName === "LI" &&
          !el.className.includes("search-reusables") &&
          el.querySelector('a[href*="/in/"]'),
      );
      if (items.length > 0) {
        console.log(`Savely: Found ${items.length} posts via fallback`);
        return items;
      }
    }

    console.log("Savely: No post containers found");
    return [];
  }

  function scrollToLoadMore() {
    return new Promise((resolve) => {
      const currentScroll = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (currentScroll >= maxScroll - 100) {
        resolve(false);
        return;
      }
      window.scrollBy({ top: CONFIG.SCROLL_AMOUNT, behavior: "smooth" });
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
        platform: "linkedin",
      });
    } catch (e) {}
  }

  function sendError(error) {
    try {
      chrome.runtime.sendMessage({ type: "error", error });
    } catch (e) {}
  }

  async function scrapeAllPosts() {
    if (isScrapingActive) return;
    isScrapingActive = true;
    scrapedPosts.clear();

    try {
      sendProgress(0, 0, "Starting LinkedIn scrape...");

      // Wait for page to be ready
      await new Promise((r) => setTimeout(r, 1000));

      let scrollAttempts = 0;
      let noNewContentCount = 0;
      let previousCount = 0;

      while (
        scrollAttempts < CONFIG.MAX_SCROLL_ATTEMPTS &&
        scrapedPosts.size < CONFIG.MAX_POSTS &&
        noNewContentCount < 5
      ) {
        scrollAttempts++;
        const containers = findPostContainers();

        for (const container of containers) {
          if (scrapedPosts.size >= CONFIG.MAX_POSTS) break;
          const postData = extractPostData(container);
          if (
            postData &&
            postData.uniqueId &&
            !scrapedPosts.has(postData.uniqueId)
          ) {
            if (
              postData.authorName ||
              postData.postContent ||
              postData.postURL
            ) {
              scrapedPosts.set(postData.uniqueId, postData);
            }
          }
        }

        sendProgress(
          scrapedPosts.size,
          CONFIG.MAX_POSTS,
          `Found ${scrapedPosts.size} posts (scroll ${scrollAttempts})...`,
        );

        const canScroll = await scrollToLoadMore();
        if (!canScroll || scrapedPosts.size === previousCount) {
          noNewContentCount++;
        } else {
          noNewContentCount = 0;
        }
        previousCount = scrapedPosts.size;
      }

      const results = Array.from(scrapedPosts.values()).map(
        ({ uniqueId, ...post }) => post,
      );

      console.log(`Savely: Scraping complete. Found ${results.length} posts.`);
      sendComplete(results);
    } catch (error) {
      console.error("Savely: Scraping error:", error);
      sendError(`LinkedIn scraping failed: ${error.message}`);
    } finally {
      isScrapingActive = false;
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "startScraping") {
      scrapeAllPosts();
      sendResponse({ status: "started" });
    }
    return true;
  });

  console.log("Savely: LinkedIn content script loaded");
})();
