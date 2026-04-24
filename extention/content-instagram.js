// Savely - Instagram Content Script
(function () {
  "use strict";

  const CONFIG = {
    MAX_POSTS: 500,
    SCROLL_DELAY: 1000,
    SCROLL_AMOUNT: 1200,
    MAX_SCROLL_ATTEMPTS: 100,
  };

  let isScrapingActive = false;
  let scrapedPosts = new Map();

  function extractPostData(postElement) {
    try {
      const data = {
        postURL: "",
        postImage: "",
        postCaption: "",
        scrapedAt: new Date().toISOString(),
      };

      // Get the link to the post
      const linkEl = postElement.querySelector(
        'a[href*="/p/"], a[href*="/reel/"]',
      );
      if (linkEl) {
        data.postURL = linkEl.href.split("?")[0];
        if (!data.postURL.startsWith("http")) {
          data.postURL = "https://www.instagram.com" + data.postURL;
        }
      }

      // Get the image
      const imgEl = postElement.querySelector("img");
      if (imgEl) {
        data.postImage = imgEl.src || "";
        // Use alt text as caption fallback
        if (imgEl.alt && imgEl.alt.length > 5) {
          data.postCaption = imgEl.alt;
        }
      }

      // Try to get caption from aria-label or other attributes
      const ariaEl = postElement.querySelector("[aria-label]");
      if (ariaEl && !data.postCaption) {
        const label = ariaEl.getAttribute("aria-label");
        if (label && label.length > 5 && !label.includes("Photo by")) {
          data.postCaption = label;
        }
      }

      if (!data.postURL && !data.postImage) return null;

      const uniqueId = data.postURL || data.postImage;
      return { ...data, uniqueId };
    } catch (error) {
      console.error("Error extracting Instagram post:", error);
      return null;
    }
  }

  function findPostContainers() {
    // Instagram saved posts grid items
    const selectors = [
      // Saved posts grid
      "article div[style*='flex-direction'] > div > div > div",
      // Grid items with links
      "article a[href*='/p/']",
      "article a[href*='/reel/']",
      // Generic grid approach
      "main article div._aagw",
      "main article div._aabd",
      // Fallback: any div containing a post link inside main
      "main div[role='button']",
    ];

    // First try to find the grid container
    const gridItems = document.querySelectorAll(
      "main article a[href*='/p/'], main article a[href*='/reel/']",
    );
    if (gridItems.length > 0) {
      // Return parent elements of the links for richer data extraction
      return Array.from(gridItems).map((link) => link.closest("div") || link);
    }

    // Try each selector
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }

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
        platform: "instagram",
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
      sendProgress(0, 0, "Starting Instagram scrape...");

      let scrollAttempts = 0;
      let noNewContentCount = 0;
      let previousCount = 0;

      // Initial wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
            scrapedPosts.set(postData.uniqueId, postData);
          }
        }

        sendProgress(
          scrapedPosts.size,
          CONFIG.MAX_POSTS,
          `Found ${scrapedPosts.size} posts...`,
        );

        const canScroll = await scrollToLoadMore();
        if (!canScroll || containers.length === previousCount) {
          noNewContentCount++;
        } else {
          noNewContentCount = 0;
        }
        previousCount = containers.length;

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const results = Array.from(scrapedPosts.values()).map(
        ({ uniqueId, ...post }) => post,
      );

      console.log(`Instagram scraping complete: ${results.length} posts`);
      sendComplete(results);
    } catch (error) {
      console.error("Instagram scraping error:", error);
      sendError(`Instagram scraping failed: ${error.message}`);
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

  console.log("Savely: Instagram content script loaded");
})();
