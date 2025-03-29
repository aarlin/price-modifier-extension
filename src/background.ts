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
        matrixRates: {
          '0-50.00': 5,
          '50.01-100.00': 10,
          '100.01-250.00': 15,
          '250.10-500.00': 20,
          '500.01-1000.00': 25,
          '1000.01-': 30,
        },
      };
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
}); 