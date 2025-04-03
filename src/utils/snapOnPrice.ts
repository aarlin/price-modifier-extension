export function isSnapOnPriceElement(element: HTMLElement): boolean {
  // Check if it's a price element with the correct class
  if (element.classList.contains('ng-star-inserted')) {
    const text = element.textContent?.trim() || '';
    // Only accept elements that contain a valid price format
    return /^\$[\d,]+\.\d{2}$/.test(text);
  }
  return false;
}

export function extractSnapOnPrice(element: HTMLElement): number | null {
  const text = element.textContent?.trim();
  if (!text) return null;

  // Extract the numeric value from the price string
  const match = text.match(/\$([\d,]+\.\d{2})/);
  if (!match) return null;

  // Remove commas and convert to number
  const numericValue = match[1].replace(/,/g, '');
  const price = Number(numericValue);
  return Number.isNaN(price) ? null : price;
}

export function updateSnapOnPrice(element: HTMLElement, newPrice: number): void {
  // Format the new price with commas and 2 decimal places
  const formattedPrice = newPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Only update if the element is a valid price element
  if (isSnapOnPriceElement(element)) {
    element.textContent = formattedPrice;
  }
}

export function findSnapOnPriceElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];
  
  // Find all elements with the ng-star-inserted class
  const potentialElements = document.querySelectorAll('.ng-star-inserted');
  
  // Filter to only include valid price elements
  for (const element of potentialElements) {
    if (element instanceof HTMLElement && isSnapOnPriceElement(element)) {
      elements.push(element);
    }
  }
  
  return elements;
}

// Helper function to validate price text
export function isPriceNode(text: string): boolean {
  return /^\$[\d,]+\.\d{2}$/.test(text.trim());
} 