/**
 * Analytics utilities for P2P market data.
 *
 * All functions are pure and operate on arrays of OnlineItem.
 * They do not make any API calls.
 */

import { TradeSide } from "./types.js";
import type { OnlineItem, PriceSpread, MarketSummary } from "./types.js";

/**
 * Find the ad with the best price for the given trade side.
 *
 * For BUY: the lowest price (cheapest to buy crypto).
 * For SELL: the highest price (best rate to sell crypto).
 */
export function bestPrice(
    items: OnlineItem[],
    side: TradeSide
): OnlineItem | null {
    if (items.length === 0) return null;

    return items.reduce((best, item) => {
        const bestVal = parseFloat(best.price);
        const itemVal = parseFloat(item.price);

        if (side === TradeSide.BUY) {
            return itemVal < bestVal ? item : best;
        } else {
            return itemVal > bestVal ? item : best;
        }
    });
}

/**
 * Calculate price spread statistics across all ads.
 */
export function priceSpread(items: OnlineItem[]): PriceSpread | null {
    if (items.length === 0) return null;

    const prices = items.map((item) => parseFloat(item.price)).sort((a, b) => a - b);

    const min = prices[0]!;
    const max = prices[prices.length - 1]!;
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const mid = Math.floor(prices.length / 2);
    const median =
        prices.length % 2 !== 0
            ? prices[mid]!
            : (prices[mid - 1]! + prices[mid]!) / 2;

    return {
        min: min.toFixed(4),
        max: max.toFixed(4),
        avg: avg.toFixed(4),
        median: median.toFixed(4),
        spread: (max - min).toFixed(4),
        count: prices.length,
    };
}

/**
 * Filter ads that accept a specific payment method.
 */
export function filterByPayment(
    items: OnlineItem[],
    method: string
): OnlineItem[] {
    const methodLower = method.toLowerCase();
    return items.filter((item) =>
        item.payments.some((p) => p.toLowerCase() === methodLower)
    );
}

/**
 * Filter ads by merchant verification level.
 */
export function filterByMerchantLevel(
    items: OnlineItem[],
    level: string
): OnlineItem[] {
    return items.filter((item) => item.merchantLevel === level);
}

/**
 * Generate a comprehensive market summary from a list of ads.
 */
export function marketSummary(items: OnlineItem[]): MarketSummary {
    if (items.length === 0) {
        return {
            totalAds: 0,
            priceStats: null,
            onlineCount: 0,
            autoAcceptCount: 0,
            paymentMethods: {},
            merchantDistribution: {},
            avgCompletionRate: "0",
        };
    }

    const paymentMethods: Record<string, number> = {};
    for (const item of items) {
        for (const method of item.payments) {
            paymentMethods[method] = (paymentMethods[method] ?? 0) + 1;
        }
    }

    const merchantDistribution: Record<string, number> = {};
    for (const item of items) {
        merchantDistribution[item.merchantLevel] =
            (merchantDistribution[item.merchantLevel] ?? 0) + 1;
    }

    const totalRate = items.reduce(
        (sum, item) => sum + parseFloat(item.executeRate),
        0
    );

    return {
        totalAds: items.length,
        priceStats: priceSpread(items),
        onlineCount: items.filter((item) => item.isOnline).length,
        autoAcceptCount: items.filter((item) => item.isAutoAccept).length,
        paymentMethods,
        merchantDistribution,
        avgCompletionRate: (totalRate / items.length).toFixed(4),
    };
}
