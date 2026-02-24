/**
 * HTTP client for the Telegram Wallet P2P API.
 *
 * This is an UNOFFICIAL SDK. Not affiliated with Telegram or Wallet.
 */

import {
    AccessDeniedError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
    ServerError,
    WalletP2PError,
} from "./errors.js";
import type {
    ClientOptions,
    GetOnlineItemsResponse,
    TradeSide,
    WalletP2PErrorResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://p2p.walletbot.me";
const ONLINE_ITEMS_PATH = "/p2p/integration-api/v1/item/online";

export class WalletP2PClient {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly maxRetries: number;
    private readonly retryBaseDelay: number;

    /**
     * Create a new Wallet P2P API client.
     *
     * @example
     * ```ts
     * const client = new WalletP2PClient({
     *   apiKey: process.env.WALLET_P2P_API_KEY!,
     * });
     * const response = await client.getOnlineItems({
     *   cryptoCurrency: "USDT",
     *   fiatCurrency: "RUB",
     *   side: TradeSide.SELL,
     * });
     * ```
     */
    constructor(options: ClientOptions) {
        if (!options.apiKey) {
            throw new Error("apiKey must not be empty");
        }

        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.timeout = options.timeout ?? 30_000;
        this.maxRetries = options.maxRetries ?? 3;
        this.retryBaseDelay = options.retryBaseDelay ?? 1_000;
    }

    /**
     * Fetch active P2P ads from the market.
     *
     * @param params.cryptoCurrency - Cryptocurrency code (e.g., "USDT", "BTC")
     * @param params.fiatCurrency - Fiat currency code (e.g., "RUB", "USD")
     * @param params.side - Trade direction: BUY or SELL
     * @param params.page - Page number (default: 1)
     * @param params.pageSize - Items per page (1-50, default: 10)
     * @returns Response with status and list of online items
     *
     * @throws {BadRequestError} If a currency is not supported
     * @throws {AuthenticationError} If the API key is invalid
     * @throws {AccessDeniedError} If access is denied
     * @throws {RateLimitError} If the rate limit is exceeded
     * @throws {ServerError} On server-side errors
     */
    async getOnlineItems(params: {
        cryptoCurrency: string;
        fiatCurrency: string;
        side: TradeSide;
        page?: number;
        pageSize?: number;
    }): Promise<GetOnlineItemsResponse> {
        const body = {
            cryptoCurrency: params.cryptoCurrency,
            fiatCurrency: params.fiatCurrency,
            side: params.side,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
        };

        return this.requestWithRetry<GetOnlineItemsResponse>(
            `${this.baseUrl}${ONLINE_ITEMS_PATH}`,
            body
        );
    }

    private async requestWithRetry<T>(url: string, body: unknown): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.doRequest<T>(url, body);
            } catch (err) {
                if (err instanceof RateLimitError || err instanceof ServerError) {
                    lastError = err;
                    if (attempt < this.maxRetries) {
                        const delay = this.retryBaseDelay * 2 ** attempt;
                        await this.sleep(delay);
                    }
                } else {
                    throw err;
                }
            }
        }

        throw lastError!;
    }

    private async doRequest<T>(url: string, body: unknown): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "X-API-Key": this.apiKey,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return (await response.json()) as T;
            }

            let errorBody: WalletP2PErrorResponse | undefined;
            try {
                errorBody = (await response.json()) as WalletP2PErrorResponse;
            } catch {
                // ignore parse errors
            }

            const errorCode = errorBody?.errorCode ?? "";
            const errorMessage =
                errorBody?.errorMessage ?? response.statusText ?? "Unknown error";

            switch (response.status) {
                case 400:
                    throw new BadRequestError(errorMessage, errorCode);
                case 401:
                    throw new AuthenticationError(errorMessage);
                case 403:
                    throw new AccessDeniedError(errorMessage, errorCode);
                case 429:
                    throw new RateLimitError(errorMessage);
                default:
                    if (response.status >= 500) {
                        throw new ServerError(errorMessage, response.status, errorCode);
                    }
                    throw new WalletP2PError(
                        `Unexpected status ${response.status}: ${errorMessage}`,
                        response.status
                    );
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err instanceof WalletP2PError) throw err;
            if (err instanceof DOMException && err.name === "AbortError") {
                throw new WalletP2PError("Request timed out", 408);
            }
            throw new WalletP2PError(
                `HTTP request failed: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
