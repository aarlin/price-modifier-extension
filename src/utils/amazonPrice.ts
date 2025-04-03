export function isAmazonPriceElement(element: HTMLElement): boolean {
  return element.classList.contains('a-price');
}

export function extractAmazonPrice(element: HTMLElement): number | null {
  const wholeElement = element.querySelector('.a-price-whole');
  const fractionElement = element.querySelector('.a-price-fraction');
  
  if (!wholeElement || !fractionElement) return null;
  
  const wholePart = wholeElement.textContent?.trim() || '0';
  const fractionPart = fractionElement.textContent?.trim() || '00';
  
  // Convert to cents to avoid floating point issues
  const wholeInCents = parseInt(wholePart, 10) * 100;
  const fractionInCents = parseInt(fractionPart, 10);
  
  return (wholeInCents + fractionInCents) / 100;
}

export function updateAmazonPrice(element: HTMLElement, newPrice: number): void {
  // Format the price to ensure we have exactly 2 decimal places
  const formattedPrice = newPrice.toFixed(2);
  const [wholePart, fractionPart] = formattedPrice.split('.');

  const wholeElement = element.querySelector('.a-price-whole');
  const fractionElement = element.querySelector('.a-price-fraction');
  
  if (wholeElement) wholeElement.textContent = wholePart;
  if (fractionElement) fractionElement.textContent = fractionPart;
}

export function findAmazonPriceElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const amazonPriceElements = document.querySelectorAll('.a-price');
  for (const element of amazonPriceElements) {
    if (element instanceof HTMLElement) {
      elements.push(element);
    }
  }
  return elements;
} 