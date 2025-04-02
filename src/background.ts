chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      const defaultSettings = {
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
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
}); 