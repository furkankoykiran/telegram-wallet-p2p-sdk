import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletP2PClient } from "../src/client.js";
import { TradeSide } from "../src/types.js";
import {
    BadRequestError,
    AuthenticationError,
    AccessDeniedError,
    RateLimitError,
    ServerError,
} from "../src/errors.js";

const SAMPLE_RESPONSE = {
    status: "SUCCESS" as const,
    data: [
        {
            id: "12345",
            number: "A1B2C3",
            userId: 67890,
            nickname: "CryptoTrader",
            cryptoCurrency: "USDT",
            fiatCurrency: "RUB",
            side: TradeSide.SELL,
            price: "98.50",
            lastQuantity: "1500.00",
            minAmount: "1000.00",
            maxAmount: "50000.00",
            payments: ["sberbank", "tinkoff"],
            orderNum: 156,
            executeRate: "0.9875",
            isOnline: true,
            merchantLevel: "MERCHANT",
            paymentPeriod: 15,
            isAutoAccept: true,
        },
    ],
};

function mockFetch(response: {
    ok?: boolean;
    status: number;
    statusText?: string;
    json: unknown;
}) {
    return vi.fn().mockResolvedValue({
        ok: response.ok ?? response.status === 200,
        status: response.status,
        statusText: response.statusText ?? "OK",
        json: vi.fn().mockResolvedValue(response.json),
    });
}

describe("WalletP2PClient", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("throws on empty API key", () => {
        expect(() => new WalletP2PClient({ apiKey: "" })).toThrow(
            "apiKey must not be empty"
        );
    });

    it("fetches online items successfully", async () => {
        const fetchMock = mockFetch({ status: 200, json: SAMPLE_RESPONSE });
        vi.stubGlobal("fetch", fetchMock);

        const client = new WalletP2PClient({
            apiKey: "test-key",
            maxRetries: 0,
        });

        const result = await client.getOnlineItems({
            cryptoCurrency: "USDT",
            fiatCurrency: "RUB",
            side: TradeSide.SELL,
        });

        expect(result.status).toBe("SUCCESS");
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.id).toBe("12345");

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, options] = fetchMock.mock.calls[0]!;
        expect(url).toContain("/p2p/integration-api/v1/item/online");
        expect(options.headers["X-API-Key"]).toBe("test-key");
    });

    it("throws BadRequestError on 400", async () => {
        vi.stubGlobal(
            "fetch",
            mockFetch({
                status: 400,
                json: {
                    errorCode: "CRYPTO_CURRENCY_NOT_SUPPORTED",
                    errorMessage: "crypto currency XYZ is not supported.",
                },
            })
        );

        const client = new WalletP2PClient({ apiKey: "test", maxRetries: 0 });
        await expect(
            client.getOnlineItems({
                cryptoCurrency: "XYZ",
                fiatCurrency: "RUB",
                side: TradeSide.SELL,
            })
        ).rejects.toThrow(BadRequestError);
    });

    it("throws AuthenticationError on 401", async () => {
        vi.stubGlobal("fetch", mockFetch({ status: 401, json: {} }));
        const client = new WalletP2PClient({ apiKey: "bad", maxRetries: 0 });
        await expect(
            client.getOnlineItems({
                cryptoCurrency: "USDT",
                fiatCurrency: "RUB",
                side: TradeSide.SELL,
            })
        ).rejects.toThrow(AuthenticationError);
    });

    it("throws AccessDeniedError on 403", async () => {
        vi.stubGlobal(
            "fetch",
            mockFetch({
                status: 403,
                json: { errorCode: "ACCESS_DENIED", errorMessage: "denied" },
            })
        );
        const client = new WalletP2PClient({ apiKey: "test", maxRetries: 0 });
        await expect(
            client.getOnlineItems({
                cryptoCurrency: "USDT",
                fiatCurrency: "RUB",
                side: TradeSide.SELL,
            })
        ).rejects.toThrow(AccessDeniedError);
    });

    it("throws RateLimitError on 429", async () => {
        vi.stubGlobal("fetch", mockFetch({ status: 429, json: {} }));
        const client = new WalletP2PClient({ apiKey: "test", maxRetries: 0 });
        await expect(
            client.getOnlineItems({
                cryptoCurrency: "USDT",
                fiatCurrency: "RUB",
                side: TradeSide.SELL,
            })
        ).rejects.toThrow(RateLimitError);
    });

    it("throws ServerError on 503", async () => {
        vi.stubGlobal(
            "fetch",
            mockFetch({
                status: 503,
                json: {
                    errorCode: "INTERNAL_ERROR",
                    errorMessage: "service unavailable",
                },
            })
        );
        const client = new WalletP2PClient({ apiKey: "test", maxRetries: 0 });
        await expect(
            client.getOnlineItems({
                cryptoCurrency: "USDT",
                fiatCurrency: "RUB",
                side: TradeSide.SELL,
            })
        ).rejects.toThrow(ServerError);
    });

    it("retries on server error and succeeds", async () => {
        let callCount = 0;
        vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount < 3) {
                return Promise.resolve({
                    ok: false,
                    status: 503,
                    statusText: "Service Unavailable",
                    json: () =>
                        Promise.resolve({
                            errorCode: "INTERNAL_ERROR",
                            errorMessage: "fail",
                        }),
                });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve(SAMPLE_RESPONSE),
            });
        }));

        const client = new WalletP2PClient({
            apiKey: "test",
            maxRetries: 3,
            retryBaseDelay: 10,
        });

        const result = await client.getOnlineItems({
            cryptoCurrency: "USDT",
            fiatCurrency: "RUB",
            side: TradeSide.SELL,
        });

        expect(result.status).toBe("SUCCESS");
        expect(callCount).toBe(3);
    });
});
