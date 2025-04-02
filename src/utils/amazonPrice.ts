export function isAmazonPriceElement(element: HTMLElement): boolean {
  return element.classList.contains('a-price');
}

export function extractAmazonPrice(element: HTMLElement): number | null {
  const wholePart = element.querySelector('.a-price-whole')?.textContent?.trim() || '0';
  const fractionPart = element.querySelector('.a-price-fraction')?.textContent?.trim() || '00';
  return Number.parseFloat(`${wholePart}.${fractionPart}`);
}

export function updateAmazonPrice(element: HTMLElement, newPrice: number): void {
  const wholePart = Math.floor(newPrice).toString();
  const fractionPart = Math.round((newPrice % 1) * 100).toString().padStart(2, '0');
  
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