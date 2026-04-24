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

      // Author name
      const authorNameSelectors = [
        ".entity-result__title-text a span span",
        ".entity-result__title-text a",
        'a[href*="/in/"] span[aria-hidden="true"]',
        'a[href*="/in/"] span span[aria-hidden="true"]',
        '.app-aware-link span[aria-hidden="true"]',
      ];

      for (const selector of authorNameSelectors) {
        const el = postElement.querySelector(selector);
        if (el && el.textContent.trim()) {
          data.authorName = cleanText(el.textContent);
          break;
        }
      }

      if (!data.authorName) {
        const profileLink = postElement.querySelector('a[href*="/in/"]');
        if (profileLink) {
          const spans = profileLink.querySelectorAll("span");
          for (const span of spans) {
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

      // Author profile URL
      const profileLinkSelectors = [
        'a[href*="/in/"]',
        ".entity-result__title-text a",
      ];
      for (const selector of profileLinkSelectors) {
        const el = postElement.querySelector(selector);
        if (el && el.href && el.href.includes("/in/")) {
          data.authorProfileURL = el.href.split("?")[0];
          break;
        }
      }

      // Author job title
      const jobTitleSelectors = [
        ".entity-result__primary-subtitle",
        ".entity-result__summary",
        "div.entity-result__primary-subtitle",
      ];
      for (const selector of jobTitleSelectors) {
        const el = postElement.querySelector(selector);
        if (el && el.textContent.trim()) {
          const text = cleanText(el.textContent);
          if (
            text &&
            !text.match(/^\d+[hdwmy]r?$/i) &&
            !text.match(/^(1st|2nd|3rd)$/i)
          ) {
            data.authorJobTitle = text;
            break;
          }
        }
      }

      // Post URL
      const postURLSelectors = [
        'a[href*="/feed/update/"]',
        'a[href*="activity"]',
        '[data-urn*="activity"]',
      ];
      for (const selector of postURLSelectors) {
        const el = postElement.querySelector(selector);
        if (el) {
          if (
            el.href &&
            (el.href.includes("/feed/update/") || el.href.includes("activity"))
          ) {
            data.postURL = el.href;
            break;
          } else if (el.getAttribute("data-urn")) {
            const urn = el.getAttribute("data-urn");
            const match = urn.match(/(activity|ugcPost):(\d+)/);
            if (match) {
              data.postURL = `https://www.linkedin.com/feed/update/urn:li:${match[1]}:${match[2]}/`;
              break;
            }
          }
        }
      }

      if (!data.postURL) {
        const urnEl =
          postElement.querySelector("[data-urn]") ||
          postElement.closest("[data-urn]");
        if (urnEl) {
          const urn = urnEl.getAttribute("data-urn");
          if (urn) {
            const match = urn.match(/(activity|ugcPost):(\d+)/);
            if (match) {
              data.postURL = `https://www.linkedin.com/feed/update/urn:li:${match[1]}:${match[2]}/`;
            }
          }
        }
      }

      if (!data.postURL && data.authorProfileURL) {
        data.postURL = data.authorProfileURL;
      }

      // Post content
      const contentSelectors = [
        ".entity-result__summary",
        ".feed-shared-text",
        ".update-components-text",
      ];
      for (const selector of contentSelectors) {
        const el = postElement.querySelector(selector);
        if (el && el.textContent.trim()) {
          data.postContent = cleanText(el.textContent);
          break;
        }
      }

      // Post image
      const imageSelectors = [
        "img.entity-result__image",
        "img.ivm-view-attr__img--centered",
      ];
      for (const selector of imageSelectors) {
        const el = postElement.querySelector(selector);
        if (el) {
          const src = el.src || el.getAttribute("data-delayed-url");
          if (src && !src.includes("data:image")) {
            data.postImage = src;
            break;
          }
        }
      }

      // Time since posted
      const timeSelectors = [
        ".entity-result__insights span",
        ".entity-result__insights",
        "time",
      ];
      for (const selector of timeSelectors) {
        const el = postElement.querySelector(selector);
        if (el && el.textContent.trim()) {
          const timeText = cleanText(el.textContent);
          const timeMatch = timeText.match(/(\d+[hdwmy]r?)/i);
          if (timeMatch) {
            data.timeSincePosted = timeMatch[1];
            break;
          }
        }
      }

      const uniqueId =
        data.postURL ||
        `${data.authorName}-${data.postContent.substring(0, 50)}`;
      return { ...data, uniqueId };
    } catch (error) {
      console.error("Error extracting post data:", error);
      return null;
    }
  }

  function findPostContainers() {
    const selectors = [
      "li.reusable-search__result-container",
      ".reusable-search__result-container",
      "div.entity-result",
      ".scaffold-finite-scroll__content li",
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) return Array.from(elements);
    }

    const mainList = document.querySelector(
      ".scaffold-finite-scroll__content ul",
    );
    if (mainList) {
      return Array.from(mainList.children).filter((el) => el.tagName === "LI");
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
          `Found ${scrapedPosts.size} posts...`,
        );

        const canScroll = await scrollToLoadMore();
        if (!canScroll || containers.length === previousCount) {
          noNewContentCount++;
        } else {
          noNewContentCount = 0;
        }
        previousCount = containers.length;
      }

      const results = Array.from(scrapedPosts.values()).map(
        ({ uniqueId, ...post }) => post,
      );
      sendComplete(results);
    } catch (error) {
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
