#!/usr/bin/env node

/**
 * Telegram Wallet P2P MCP Server (Unofficial)
 *
 * An MCP server providing read-only tools for Telegram Wallet P2P market data.
 * This is an UNOFFICIAL project — not affiliated with Telegram or Wallet.
 *
 * Tools:
 * - get_p2p_ads: Fetch filtered P2P ads from the market
 * - get_market_summary: Get aggregated market analytics
 * - get_best_price: Find the best buy/sell price
 *
 * Configuration:
 * - WALLET_P2P_API_KEY: Required environment variable for API authentication
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://p2p.walletbot.me";
const ONLINE_ITEMS_PATH = "/p2p/integration-api/v1/item/online";

// --- Types (inline to avoid cross-package dependency at runtime) ---

interface OnlineItem {
    id: string;
    number: string;
    userId: number;
    nickname: string;
    cryptoCurrency: string;
    fiatCurrency: string;
    side: string;
    price: string;
    lastQuantity: string;
    minAmount: string;
    maxAmount: string | null;
    payments: string[];
    orderNum: number;
    executeRate: string;
    isOnline: boolean;
    merchantLevel: string;
    paymentPeriod: number;
    isAutoAccept: boolean;
}

interface ApiResponse {
    status: string;
    data: OnlineItem[];
}

interface ApiErrorResponse {
    errorCode: string;
    errorMessage: string;
}

// --- API Client ---

async function fetchAds(
    apiKey: string,
    params: {
        cryptoCurrency: string;
        fiatCurrency: string;
        side: string;
        page?: number;
        pageSize?: number;
    }
): Promise<OnlineItem[]> {
    const url = `${BASE_URL}${ONLINE_ITEMS_PATH}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            cryptoCurrency: params.cryptoCurrency,
            fiatCurrency: params.fiatCurrency,
            side: params.side,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 50,
        }),
    });

    if (!response.ok) {
        let errorMsg = `API error: ${response.status}`;
        try {
            const errorBody = (await response.json()) as ApiErrorResponse;
            errorMsg = `API error ${response.status}: [${errorBody.errorCode}] ${errorBody.errorMessage}`;
        } catch {
            // ignore parse errors
        }
        throw new Error(errorMsg);
    }

    const data = (await response.json()) as ApiResponse;
    return data.data;
}

// --- Analytics helpers ---

function calcPriceSpread(items: OnlineItem[]) {
    if (items.length === 0) return null;
    const prices = items.map((i) => parseFloat(i.price)).sort((a, b) => a - b);
    const min = prices[0]!;
    const max = prices[prices.length - 1]!;
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
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

// --- Server setup ---

function getApiKey(): string {
    const key = process.env.WALLET_P2P_API_KEY;
    if (!key) {
        console.error(
            "Error: WALLET_P2P_API_KEY environment variable is required."
        );
        process.exit(1);
    }
    return key;
}

const apiKey = getApiKey();

const server = new McpServer({
    name: "telegram-wallet-p2p",
    version: "0.1.0",
});

// --- Tool: get_p2p_ads ---

server.tool(
    "get_p2p_ads",
    "Fetch active P2P market ads filtered by cryptocurrency, fiat currency, and trade side. Returns detailed ad data including price, quantity, payment methods, and trader info. This is an UNOFFICIAL tool — not affiliated with Telegram or Wallet.",
    {
        cryptoCurrency: z
            .string()
            .describe('Cryptocurrency code, e.g. "USDT", "BTC", "TON"'),
        fiatCurrency: z
            .string()
            .describe('Fiat currency code, e.g. "RUB", "USD", "EUR"'),
        side: z.enum(["BUY", "SELL"]).describe("Trade side from the ad maker perspective"),
        page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
        pageSize: z
            .number()
            .int()
            .min(1)
            .max(50)
            .optional()
            .describe("Items per page (default: 50, max: 50)"),
    },
    async ({ cryptoCurrency, fiatCurrency, side, page, pageSize }) => {
        try {
            const items = await fetchAds(apiKey, {
                cryptoCurrency,
                fiatCurrency,
                side,
                page,
                pageSize,
            });

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(
                            {
                                totalResults: items.length,
                                cryptoCurrency,
                                fiatCurrency,
                                side,
                                ads: items.map((item) => ({
                                    id: item.id,
                                    nickname: item.nickname,
                                    price: item.price,
                                    availableQuantity: item.lastQuantity,
                                    minAmount: item.minAmount,
                                    maxAmount: item.maxAmount,
                                    payments: item.payments,
                                    completedOrders: item.orderNum,
                                    completionRate: item.executeRate,
                                    isOnline: item.isOnline,
                                    merchantLevel: item.merchantLevel,
                                    paymentPeriod: item.paymentPeriod,
                                    autoAccept: item.isAutoAccept,
                                })),
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Error fetching ads: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// --- Tool: get_market_summary ---

server.tool(
    "get_market_summary",
    "Get aggregated market analytics for a cryptocurrency/fiat pair including price statistics, payment method distribution, merchant levels, and trader metrics. This is an UNOFFICIAL tool.",
    {
        cryptoCurrency: z
            .string()
            .describe('Cryptocurrency code, e.g. "USDT"'),
        fiatCurrency: z
            .string()
            .describe('Fiat currency code, e.g. "RUB"'),
        side: z.enum(["BUY", "SELL"]).describe("Trade side to analyze"),
    },
    async ({ cryptoCurrency, fiatCurrency, side }) => {
        try {
            const items = await fetchAds(apiKey, {
                cryptoCurrency,
                fiatCurrency,
                side,
                pageSize: 50,
            });

            const priceStats = calcPriceSpread(items);

            const paymentMethods: Record<string, number> = {};
            for (const item of items) {
                for (const method of item.payments) {
                    paymentMethods[method] = (paymentMethods[method] ?? 0) + 1;
                }
            }

            const merchantDist: Record<string, number> = {};
            for (const item of items) {
                merchantDist[item.merchantLevel] =
                    (merchantDist[item.merchantLevel] ?? 0) + 1;
            }

            const avgRate =
                items.length > 0
                    ? items.reduce((s, i) => s + parseFloat(i.executeRate), 0) /
                    items.length
                    : 0;

            const summary = {
                cryptoCurrency,
                fiatCurrency,
                side,
                totalAds: items.length,
                priceStats,
                onlineTraders: items.filter((i) => i.isOnline).length,
                autoAcceptAds: items.filter((i) => i.isAutoAccept).length,
                paymentMethods,
                merchantDistribution: merchantDist,
                avgCompletionRate: avgRate.toFixed(4),
            };

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(summary, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Error generating summary: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// --- Tool: get_best_price ---

server.tool(
    "get_best_price",
    "Find the best available price for buying or selling crypto on the P2P market. Returns the top ad with the most favorable price. This is an UNOFFICIAL tool.",
    {
        cryptoCurrency: z
            .string()
            .describe('Cryptocurrency code, e.g. "USDT"'),
        fiatCurrency: z
            .string()
            .describe('Fiat currency code, e.g. "RUB"'),
        side: z
            .enum(["BUY", "SELL"])
            .describe("Trade side: BUY = find cheapest to buy, SELL = find highest to sell"),
    },
    async ({ cryptoCurrency, fiatCurrency, side }) => {
        try {
            const items = await fetchAds(apiKey, {
                cryptoCurrency,
                fiatCurrency,
                side,
                pageSize: 50,
            });

            if (items.length === 0) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                message: "No ads found for the specified criteria.",
                                cryptoCurrency,
                                fiatCurrency,
                                side,
                            }),
                        },
                    ],
                };
            }

            const best = items.reduce((best, item) => {
                const bestVal = parseFloat(best.price);
                const itemVal = parseFloat(item.price);
                if (side === "BUY") {
                    return itemVal < bestVal ? item : best;
                } else {
                    return itemVal > bestVal ? item : best;
                }
            });

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(
                            {
                                cryptoCurrency,
                                fiatCurrency,
                                side,
                                bestPrice: best.price,
                                trader: {
                                    nickname: best.nickname,
                                    merchantLevel: best.merchantLevel,
                                    completedOrders: best.orderNum,
                                    completionRate: best.executeRate,
                                    isOnline: best.isOnline,
                                },
                                availableQuantity: best.lastQuantity,
                                amountRange: {
                                    min: best.minAmount,
                                    max: best.maxAmount,
                                },
                                payments: best.payments,
                                autoAccept: best.isAutoAccept,
                                paymentPeriod: best.paymentPeriod,
                                totalAdsScanned: items.length,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Error finding best price: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// --- Start server ---

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Telegram Wallet P2P MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
