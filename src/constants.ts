// Loading overlay configuration
export const LOADING = {
  MIN_DISPLAY_TIME_MS: 500,
  DEBOUNCE_TIME_MS: 100,
} as const;

// Price update configuration
export const PRICE = {
  DECIMAL_PLACES: 2,
  CENTS_MULTIPLIER: 100,
} as const;

// Matrix rate configuration
export const MATRIX = {
  DEFAULT_RATES: [
    { min: 0, max: 50, rate: 5 },
    { min: 50.01, max: 100, rate: 10 },
    { min: 100.01, max: 250, rate: 15 },
    { min: 250.01, max: 500, rate: 20 },
    { min: 500.01, max: 1000, rate: 25 },
    { min: 1000.01, max: null, rate: 30 },
  ],
};

// Currency configuration
export const CURRENCY = {
  LOCALE: 'en-US',
  CURRENCY: 'USD',
  MIN_FRACTION_DIGITS: 2,
  MAX_FRACTION_DIGITS: 2,
} as const;

// Scroll configuration
export const SCROLL = {
  PIXELS: 20, // Number of pixels to scroll
  DURATION_MS: 100, // Duration of the scroll animation
  EASING: 'linear', // CSS easing function for faster motion
} as const; 