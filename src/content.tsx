// Remove Tippy imports since we're using native tooltips
interface Settings {
  enabled: boolean;
  markupType: 'flat' | 'percentage' | 'matrix';
  flatRate: number;
  percentage: number;
  showIndicator: boolean;
  matrixRates: Record<string, number>;
}

class PriceMarkupManager {
  private settings: Settings = {
    enabled: false,
    markupType: 'flat',
    flatRate: 0,
    percentage: 0,
    showIndicator: true,
    matrixRates: {
      '0-10': 5,
      '11-20': 10,
      '21-30': 15,
      '31-40': 20,
      '41-50': 25,
      '51+': 30,
    },
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
      this.settings = result.settings;
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
            if (this.isPriceNode(node)) return NodeFilter.FILTER_ACCEPT;
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

  private isPriceNode(node: Node): boolean {
    if (!node.textContent) return false;
    // Match common currency formats: $, €, £, ¥
    const currencyRegex = /(?:^\$|\$\s+|\s+\$|\s+€|\s+£|\s+¥)\s*\d+(?:,\d{3})*(?:\.\d{2})?/;
    return currencyRegex.test(node.textContent);
  }

  private extractPrice(text: string): number | null {
    // Match the number after a currency symbol
    const currencyRegex = /(?:\$|€|£|¥)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/;
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
      case 'matrix':
        return this.calculateMatrixMarkup(price);
      default:
        return 0;
    }
  }

  private calculateMatrixMarkup(price: number): number {
    const ranges = Object.entries(this.settings.matrixRates);
    for (const [range, rate] of ranges) {
      const [min, max] = range.split('-').map(Number);
      if (price >= min && (max ? price <= max : true)) {
        return price * (rate / 100);
      }
    }
    return 0;
  }

  private createIndicator(_element: HTMLElement, originalPrice: number, markup: number): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'relative inline-block cursor-help opacity-60 hover:opacity-100 transition-opacity text-[8px] ml-0.5 align-super';
    indicator.innerHTML = '💰';

    // Create tooltip content based on markup type
    let tooltipContent = '';
    switch (this.settings.markupType) {
      case 'flat':
        tooltipContent = `
          <div class="text-left leading-relaxed">
            <div>Original: $${originalPrice.toFixed(2)}</div>
            <div>Markup: +$${markup.toFixed(2)}</div>
          </div>
        `;
        break;
      case 'percentage':
        tooltipContent = `
          <div class="text-left leading-relaxed">
            <div>Original: $${originalPrice.toFixed(2)}</div>
            <div>Markup: ${this.settings.percentage}% (+$${markup.toFixed(2)})</div>
          </div>
        `;
        break;
      case 'matrix': {
        const markupPercentage = (markup / originalPrice) * 100;
        tooltipContent = `
          <div class="text-left leading-relaxed">
            <div>Original: $${originalPrice.toFixed(2)}</div>
            <div>Markup: ${markupPercentage.toFixed(1)}% (+$${markup.toFixed(2)})</div>
          </div>
        `;
        break;
      }
    }

    const tooltip = document.createElement('span');
    tooltip.className = 'invisible group-hover:visible absolute z-50 w-[120px] bg-black text-white text-center py-1.5 rounded-md text-xs';
    tooltip.innerHTML = tooltipContent;

    // Position the tooltip
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.bottom = '100%';
    tooltip.style.marginBottom = '5px';

    // Add arrow
    const arrow = document.createElement('div');
    arrow.className = 'absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-black';
    tooltip.appendChild(arrow);

    indicator.appendChild(tooltip);
    return indicator;
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
          // If we don't have the original price stored, get it from current text
          const price = this.extractPrice(element.textContent || '');
          if (!price) continue;
          this.originalPrices.set(element, price);
        }

        const price = this.originalPrices.get(element)!;
        const markup = this.calculateMarkup(price);
        const newPrice = price + markup;
        const formattedPrice = newPrice.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        });

        // Remove any existing indicators
        const existingIndicator = this.indicatorElements.get(element);
        if (existingIndicator) {
          existingIndicator.remove();
          this.indicatorElements.delete(element);
        }

        // Set the text content directly to the new formatted price
        element.textContent = formattedPrice;

        if (this.settings.showIndicator) {
          const indicator = this.createIndicator(element, price, markup);
          element.appendChild(indicator);
          this.indicatorElements.set(element, indicator);
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