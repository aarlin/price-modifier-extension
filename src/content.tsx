import { snapOnEpcUseCase } from "./utils/snapOnEpc";
import { Settings } from "./types";  // Import types

// Remove Tippy imports since we're using native tooltips

class PriceMarkupManager {
  private settings: Settings = {
    enabled: false,
    markupType: 'flat',
    flatRate: 0,
    percentage: 0,
    showIndicator: true,
    matrixRates: [
      { min: 0, max: 50, rate: 5 },
      { min: 50.01, max: 100, rate: 10 },
      { min: 100.01, max: 250, rate: 15 },
      { min: 250.01, max: 500, rate: 20 },
      { min: 500.01, max: 1000, rate: 25 },
      { min: 1000.01, max: null, rate: 30 },
    ],
  };

  private priceElements: Set<HTMLElement> = new Set();
  private originalPrices: Map<HTMLElement, number> = new Map();
  private indicatorElements: Map<HTMLElement, HTMLElement> = new Map();
  private observer: MutationObserver | null = null;
  private updateTimeout: number | null = null;
  private isProcessing = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadSettings();
    this.setupMessageListener();
    this.startPriceObserver();
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    if (result.settings) {
      // Ensure matrixRates is an array
      this.settings = {
        ...result.settings,
        matrixRates: Array.isArray(result.settings.matrixRates) 
          ? result.settings.matrixRates 
          : this.settings.matrixRates
      };
      this.updatePrices();
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: { type: string; settings: Settings }) => {
      if (message.type === 'SETTINGS_UPDATED') {
        this.settings = message.settings;
        this.updatePrices();
      }
    });
  }

  private startPriceObserver() {
    // Stop any existing observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // Create a new observer with optimized settings
    this.observer = new MutationObserver(() => {
      // Debounce the update to prevent rapid consecutive calls
      if (this.updateTimeout) {
        window.clearTimeout(this.updateTimeout);
      }
      this.updateTimeout = window.setTimeout(() => {
        this.findPriceElements();
        this.updatePrices();
      }, 100); // Wait 100ms before processing changes
    });

    // Observe only necessary changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false, // We don't need attribute changes
    });
  }

  private findPriceElements() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.parentElement) return NodeFilter.FILTER_REJECT;
            if (this.priceElements.has(node.parentElement)) return NodeFilter.FILTER_REJECT;

            // Use the Snap-on EPC logic
            const snapOnResult = snapOnEpcUseCase(node);
            if (snapOnResult === NodeFilter.FILTER_ACCEPT) {
              return NodeFilter.FILTER_ACCEPT;
            }

            // Combine all text nodes under the same parent element
            const combinedText = Array.from(node.parentElement.childNodes)
              .filter((child) => child.nodeType === Node.TEXT_NODE)
              .map((child) => child.textContent?.trim() || '')
              .join('');

            // Check if the combined text matches a price
            if (this.isPriceNode(combinedText)) return NodeFilter.FILTER_ACCEPT;

            return NodeFilter.FILTER_SKIP;
          },
        }
      );

      let node = walker.nextNode();
      while (node) {
        if (node.parentElement) {
          this.priceElements.add(node.parentElement);
        }
        node = walker.nextNode();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private isPriceNode(text: string): boolean {
    if (!text) return false;

    // Match common currency formats: $, €, £, ¥
    const currencyRegex = /(?:^\$|\$\s+|\s+\$|\s+€|\s+£|\s+¥)\s*\d+(?:,\d{3})*(?:\.\d{2})?/;
    return currencyRegex.test(text);
  }

  private extractPrice(text: string): number | null {
    // Match the number with or without a currency symbol
    const currencyRegex = /(?:\$|€|£|¥)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
    const match = text.match(currencyRegex);
    if (!match) return null;
    return Number.parseFloat(match[1].replace(/,/g, ''));
  }

  private calculateMarkup(price: number): number {
    switch (this.settings.markupType) {
      case 'flat':
        return this.settings.flatRate;
      case 'percentage':
        return price * (this.settings.percentage / 100);
      case 'matrixPercentage':
        return this.calculateMatrixMarkup(price);
      case 'matrixFlat':
        return this.calculateMatrixMarkup(price);
      default:
        return 0;
    }
  }

  private calculateMatrixMarkup(price: number): number {
    // Find the appropriate range for the given price
    for (const { min, max, rate } of this.settings.matrixRates) {
      if (price >= min && (max === null || price <= max)) {
        return price * (rate / 100); // Calculate the markup
      }
    }

    return 0; // Default to no markup if no range matches
  }

  private updatePrices() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      if (!this.settings.enabled) {
        this.restoreOriginalPrices();
        return;
      }

      for (const element of this.priceElements) {
        const originalPrice = this.originalPrices.get(element);
        if (!originalPrice) {
          // Combine text nodes to extract the full price
          const combinedText = Array.from(element.childNodes)
            .map((node) => node.textContent?.trim() || '')
            .join('');
          const price = this.extractPrice(combinedText);
          if (!price) continue;
          this.originalPrices.set(element, price);
        }

        const price = this.originalPrices.get(element);
        if (!price) continue;
        const markup = this.calculateMarkup(price);
        const newPrice = price + markup;
        const formattedPrice = newPrice.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        });

        // Clear existing child nodes and update the content
        element.textContent = formattedPrice;

        if (this.settings.showIndicator) {
          const superscript = document.createElement('sup'); // Create a <sup> element
          superscript.textContent = '*'; // Set the superscript content to '*'
          element.appendChild(superscript); // Append the superscript to the price element
          this.indicatorElements.set(element, superscript); // Track the indicator
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private restoreOriginalPrices() {
    for (const element of this.priceElements) {
      const originalPrice = this.originalPrices.get(element);
      if (originalPrice) {
        const formattedPrice = originalPrice.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        });
        const text = element.textContent;
        if (text) {
          element.textContent = text.replace(
            /\$?\s*\d+(?:,\d{3})*(?:\.\d{2})?/,
            formattedPrice
          );
        }
      }
    }

    // Clean up all indicators
    for (const indicator of this.indicatorElements.values()) {
      indicator.remove();
    }
    this.indicatorElements.clear();
  }
}

// Initialize the price markup manager
new PriceMarkupManager(); 