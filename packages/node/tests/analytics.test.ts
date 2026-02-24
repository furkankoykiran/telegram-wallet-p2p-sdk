import { describe, it, expect } from "vitest";
import {
    TradeSide,
    MerchantLevel,
} from "../src/types.js";
import type { OnlineItem } from "../src/types.js";
import {
    bestPrice,
    priceSpread,
    filterByPayment,
    filterByMerchantLevel,
    marketSummary,
} from "../src/analytics.js";

function makeItem(overrides: Partial<OnlineItem> = {}): OnlineItem {
    return {
        id: "1",
        number: "A1",
        userId: 100,
        nickname: "Trader",
        cryptoCurrency: "USDT",
        fiatCurrency: "RUB",
        side: TradeSide.SELL,
        price: "100.00",
        lastQuantity: "1000.00",
        minAmount: "500.00",
        maxAmount: "10000.00",
        payments: ["sberbank"],
        orderNum: 50,
        executeRate: "0.95",
        isOnline: true,
        merchantLevel: MerchantLevel.MERCHANT,
        paymentPeriod: 15,
        isAutoAccept: true,
        ...overrides,
    };
}

describe("bestPrice", () => {
    it("returns lowest price for BUY side", () => {
        const items = [
            makeItem({ id: "1", price: "100.00" }),
            makeItem({ id: "2", price: "95.00" }),
            makeItem({ id: "3", price: "102.00" }),
        ];
        const result = bestPrice(items, TradeSide.BUY);
        expect(result?.id).toBe("2");
    });

    it("returns highest price for SELL side", () => {
        const items = [
            makeItem({ id: "1", price: "100.00" }),
            makeItem({ id: "2", price: "95.00" }),
            makeItem({ id: "3", price: "102.00" }),
        ];
        const result = bestPrice(items, TradeSide.SELL);
        expect(result?.id).toBe("3");
    });

    it("returns null for empty array", () => {
        expect(bestPrice([], TradeSide.BUY)).toBeNull();
    });
});

describe("priceSpread", () => {
    it("calculates correct spread statistics", () => {
        const items = [
            makeItem({ price: "90.00" }),
            makeItem({ price: "100.00" }),
            makeItem({ price: "110.00" }),
        ];
        const result = priceSpread(items);
        expect(result).not.toBeNull();
        expect(result!.min).toBe("90.0000");
        expect(result!.max).toBe("110.0000");
        expect(result!.spread).toBe("20.0000");
        expect(result!.count).toBe(3);
    });

    it("returns null for empty array", () => {
        expect(priceSpread([])).toBeNull();
    });
});

describe("filterByPayment", () => {
    it("filters items by payment method", () => {
        const items = [
            makeItem({ id: "1", payments: ["sberbank", "tinkoff"] }),
            makeItem({ id: "2", payments: ["tinkoff"] }),
            makeItem({ id: "3", payments: ["sberbank"] }),
        ];
        const result = filterByPayment(items, "tinkoff");
        expect(result).toHaveLength(2);
        expect(result.map((i) => i.id).sort()).toEqual(["1", "2"]);
    });

    it("is case insensitive", () => {
        const items = [makeItem({ payments: ["Sberbank"] })];
        const result = filterByPayment(items, "sberbank");
        expect(result).toHaveLength(1);
    });
});

describe("filterByMerchantLevel", () => {
    it("filters items by merchant level", () => {
        const items = [
            makeItem({ id: "1", merchantLevel: MerchantLevel.REGULAR_USER }),
            makeItem({ id: "2", merchantLevel: MerchantLevel.MERCHANT }),
            makeItem({ id: "3", merchantLevel: MerchantLevel.TRUSTED_MERCHANT }),
        ];
        const result = filterByMerchantLevel(items, MerchantLevel.MERCHANT);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe("2");
    });
});

describe("marketSummary", () => {
    it("generates comprehensive summary", () => {
        const items = [
            makeItem({
                id: "1",
                price: "95.00",
                payments: ["sberbank", "tinkoff"],
                merchantLevel: MerchantLevel.MERCHANT,
                executeRate: "0.90",
                isOnline: true,
                isAutoAccept: true,
            }),
            makeItem({
                id: "2",
                price: "100.00",
                payments: ["tinkoff"],
                merchantLevel: MerchantLevel.TRUSTED_MERCHANT,
                executeRate: "0.98",
                isOnline: false,
                isAutoAccept: false,
            }),
        ];
        const summary = marketSummary(items);
        expect(summary.totalAds).toBe(2);
        expect(summary.onlineCount).toBe(1);
        expect(summary.autoAcceptCount).toBe(1);
        expect(summary.paymentMethods["tinkoff"]).toBe(2);
        expect(summary.paymentMethods["sberbank"]).toBe(1);
        expect(summary.merchantDistribution[MerchantLevel.MERCHANT]).toBe(1);
        expect(summary.merchantDistribution[MerchantLevel.TRUSTED_MERCHANT]).toBe(1);
    });

    it("handles empty array", () => {
        const summary = marketSummary([]);
        expect(summary.totalAds).toBe(0);
        expect(summary.priceStats).toBeNull();
    });
});
