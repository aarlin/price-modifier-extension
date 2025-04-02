import { containsCurrency, isPriceNode } from '@/utils/helpers'; // Adjust the import paths as needed

export function snapOnEpcUseCase(node: Node): number | NodeFilter {
    // Check if the current URL is snaponepc.com
    if (!window.location.href.includes('snaponepc.com')) {
        return NodeFilter.FILTER_SKIP;
    }

    if (!node.parentElement) {
        return NodeFilter.FILTER_REJECT;
    }

    // Check if the parent element has a title attribute containing a currency
    const title = node.parentElement.getAttribute('title');
    if (title && containsCurrency(title)) {
        return NodeFilter.FILTER_ACCEPT;
    }

    const grandparent = node.parentElement.parentElement
    if (grandparent?.className === 'ng-star-inserted') {
        const priceText = node.textContent?.trim();
        if (priceText && isPriceNode(priceText)) {
            return NodeFilter.FILTER_ACCEPT;
        }
    }

    return NodeFilter.FILTER_SKIP;
}