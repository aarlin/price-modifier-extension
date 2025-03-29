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
          '0-10': 5,
          '11-20': 10,
          '21-30': 15,
          '31-40': 20,
          '41-50': 25,
          '51+': 30,
        },
      };
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
}); 