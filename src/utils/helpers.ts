export function isPriceNode(text: string): boolean {
    if (!text) return false;
    const currencyRegex = /(?:^\$|\$\s+|\s+\$|\s+€|\s+£|\s+¥)?\s*\d+(?:,\d{3})*(?:\.\d{2})?/;
    return currencyRegex.test(text);
}

export function containsCurrency(text: string): boolean {
    const currencyRegex = /\b(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR)\b/i;
    return currencyRegex.test(text);
}

export function getPriceFromChildNodes(element: HTMLElement): string | null {
    const traverse = (node: Node): string | null => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const text = node.textContent.trim();
            if (isPriceNode(text)) {
                return text;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const child of Array.from(node.childNodes)) {
                const result = traverse(child);
                if (result) return result;
            }
        }
        return null;
    };

    return traverse(element);
}