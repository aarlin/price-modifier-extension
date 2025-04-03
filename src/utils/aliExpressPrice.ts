export function isAliExpressPriceElement(element: HTMLElement): boolean {
  return element.classList.contains('kc_k6');
}

export function extractAliExpressPrice(element: HTMLElement): number | null {
  const spans = element.querySelectorAll('span');
  if (spans.length < 4) return null;

  // Get the whole and decimal parts
  const wholePart = spans[1]?.textContent || '0';
  const decimalPart = spans[3]?.textContent || '00';

  // Combine and parse the price
  const price = Number.parseFloat(`${wholePart}.${decimalPart}`);
  return Number.isNaN(price) ? null : price;
}

export function updateAliExpressPrice(element: HTMLElement, newPrice: number): void {
  const formattedPrice = newPrice.toFixed(2);
  const [wholePart, decimalPart] = formattedPrice.split('.');

  const spans = element.querySelectorAll('span');
  if (spans.length >= 4) {
    // Update the whole number part
    if (spans[1]) spans[1].textContent = wholePart;
    // Update the decimal part
    if (spans[3]) spans[3].textContent = decimalPart;
  }
}

export function findAliExpressPriceElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const aliExpressPriceElements = document.querySelectorAll('.kc_k6');
  for (const element of aliExpressPriceElements) {
    if (element instanceof HTMLElement) {
      elements.push(element);
    }
  }
  return elements;
} 