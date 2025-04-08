import { snapOnEpcUseCase } from "./utils/snapOnEpc";
import { Settings } from "./types";  // Import types
import { findAmazonPriceElements, isAmazonPriceElement, extractAmazonPrice, updateAmazonPrice } from "./utils/amazonPrice";
import { findAliExpressPriceElements, isAliExpressPriceElement, extractAliExpressPrice, updateAliExpressPrice } from "./utils/aliExpressPrice";
import { findSnapOnPriceElements, isSnapOnPriceElement, extractSnapOnPrice, updateSnapOnPrice } from "./utils/snapOnPrice";

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

      // First find Amazon price elements
      const amazonElements = findAmazonPriceElements();
      for (const element of amazonElements) {
        this.priceElements.add(element);
      }

      // Find AliExpress price elements
      const aliExpressElements = findAliExpressPriceElements();
      for (const element of aliExpressElements) {
        this.priceElements.add(element);
      }

      // Find Snap-on price elements
      const snapOnElements = findSnapOnPriceElements();
      for (const element of snapOnElements) {
        this.priceElements.add(element);
      }

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.parentElement) {
              return NodeFilter.FILTER_REJECT;
            }
            if (this.priceElements.has(node.parentElement)) {
              return NodeFilter.FILTER_REJECT;
            }

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
            if (this.isPriceNode(combinedText)) {
              return NodeFilter.FILTER_ACCEPT;
            }

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

  private extractPrice(element: HTMLElement): number | null {
    // Check if this is an Amazon price element
    if (isAmazonPriceElement(element)) {
      return extractAmazonPrice(element);
    }

    // Check if this is an AliExpress price element
    if (isAliExpressPriceElement(element)) {
      return extractAliExpressPrice(element);
    }

    // Check if this is a Snap-on price element
    if (isSnapOnPriceElement(element)) {
      return extractSnapOnPrice(element);
    }

    // For non-Amazon prices, combine text nodes
    const combinedText = Array.from(element.childNodes)
      .map((node) => node.textContent?.trim() || '')
      .join('');

    // Match the number with or without a currency symbol
    const currencyRegex = /(?:\$|€|£|¥)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
    const match = combinedText.match(currencyRegex);
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
        if (this.settings.markupType === 'matrixPercentage') {
          return price * (rate / 100); // Calculate percentage markup
        }
        return rate; // Use flat rate for matrixFlat
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


      // First, update all individual prices and collect their marked-up values
      const markedUpPrices: number[] = [];
      
      for (const element of this.priceElements) {
        const originalPrice = this.originalPrices.get(element);
        if (!originalPrice) {
          const price = this.extractPrice(element);
          if (!price) {
            continue;
          }
          this.originalPrices.set(element, price);
        }

        const price = this.originalPrices.get(element);
        if (!price) continue;
        const markup = this.calculateMarkup(price);
        
        // Convert to cents, add, then convert back to dollars to avoid floating point issues
        const priceInCents = Math.round(price * 100);
        const markupInCents = Math.round(markup * 100);
        const newPriceInCents = priceInCents + markupInCents;
        const newPrice = newPriceInCents / 100;

        // Store the marked-up price for total calculation
        markedUpPrices.push(newPrice);

        // Update the price based on the element type
        if (isAmazonPriceElement(element)) {
          updateAmazonPrice(element, newPrice);
        } else if (isAliExpressPriceElement(element)) {
          updateAliExpressPrice(element, newPrice);
        } else if (isSnapOnPriceElement(element)) {
          updateSnapOnPrice(element, newPrice);
        } else {
          // For non-Amazon prices, use the standard formatting
          const formattedPrice = newPrice.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          element.textContent = formattedPrice;
        }

        if (this.settings.showIndicator) {
          const superscript = document.createElement('sup');
          superscript.textContent = '*';
          element.appendChild(superscript);
          this.indicatorElements.set(element, superscript);
        }
      }

      // Calculate and update the total if we have marked-up prices
      if (markedUpPrices.length > 0) {
        const total = markedUpPrices.reduce((sum, price) => sum + price, 0);
        
        // Find and update the total element
        const totalElements = document.querySelectorAll('.ng-star-inserted');
        for (const element of totalElements) {
          if (element instanceof HTMLElement && 
              element.textContent?.includes('Total:') && 
              element.nextElementSibling?.classList.contains('ng-star-inserted')) {
            const totalElement = element.nextElementSibling as HTMLElement;
            if (isSnapOnPriceElement(totalElement)) {
              updateSnapOnPrice(totalElement, total);
            }
          }
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
        if (isAmazonPriceElement(element)) {
          // For Amazon prices, restore the original HTML structure
          const formattedPrice = originalPrice.toFixed(2);
          const [wholePart, fractionPart] = formattedPrice.split('.');
          
          const wholeElement = element.querySelector('.a-price-whole') as HTMLElement;
          const fractionElement = element.querySelector('.a-price-fraction') as HTMLElement;
          
          if (wholeElement) wholeElement.textContent = wholePart;
          if (fractionElement) fractionElement.textContent = fractionPart;
        } else if (isAliExpressPriceElement(element)) {
          // For AliExpress prices, restore the original HTML structure
          const formattedPrice = originalPrice.toFixed(2);
          const [wholePart, decimalPart] = formattedPrice.split('.');
          
          const spans = element.querySelectorAll('span');
          if (spans.length >= 4) {
            if (spans[1]) spans[1].textContent = wholePart;
            if (spans[3]) spans[3].textContent = decimalPart;
          }
        } else if (isSnapOnPriceElement(element)) {
          // For Snap-on prices, restore the original price
          const formattedPrice = originalPrice.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          element.textContent = formattedPrice;
        } else {
          // For non-Amazon prices, use the standard formatting
          const formattedPrice = originalPrice.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          element.textContent = formattedPrice;
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