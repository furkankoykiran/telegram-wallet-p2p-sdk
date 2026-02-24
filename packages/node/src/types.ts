/**
 * Type definitions for the Telegram Wallet P2P API.
 *
 * Derived from the official OpenAPI specification.
 * This is an UNOFFICIAL SDK — not affiliated with Telegram or Wallet.
 */

/** Trade direction. */
export enum TradeSide {
    BUY = "BUY",
    SELL = "SELL",
}

/** Merchant verification level. */
export enum MerchantLevel {
    REGULAR_USER = "REGULAR_USER",
    MERCHANT = "MERCHANT",
    TRUSTED_MERCHANT = "TRUSTED_MERCHANT",
}

/** API error codes. */
export enum ErrorCode {
    CRYPTO_CURRENCY_NOT_SUPPORTED = "CRYPTO_CURRENCY_NOT_SUPPORTED",
    FIAT_CURRENCY_NOT_SUPPORTED = "FIAT_CURRENCY_NOT_SUPPORTED",
    ACCESS_DENIED = "ACCESS_DENIED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * A single P2P market ad (item).
 * Price and quantity fields are strings to preserve decimal precision.
 */
export interface OnlineItem {
    /** Item (ad) ID */
    id: string;
    /** Item (ad) human-readable number */
    number: string;
    /** User ID of the item owner */
    userId: number;
    /** Nickname of the item owner */
    nickname: string;
    /** Cryptocurrency code */
    cryptoCurrency: string;
    /** Fiat currency code */
    fiatCurrency: string;
    /** Trade side: BUY or SELL */
    side: TradeSide;
    /** Price per unit of cryptocurrency */
    price: string;
    /** Available quantity */
    lastQuantity: string;
    /** Minimum order amount in fiat */
    minAmount: string;
    /** Maximum order amount in fiat. null if no maximum limit. */
    maxAmount: string | null;
    /** List of accepted payment method codes */
    payments: string[];
    /** Number of completed orders */
    orderNum: number;
    /** Order completion rate (0-1) */
    executeRate: string;
    /** Whether the user is currently online */
    isOnline: boolean;
    /** Merchant verification level */
    merchantLevel: MerchantLevel;
    /** Payment timeout in minutes */
    paymentPeriod: number;
    /** Whether the ad has auto-accept enabled */
    isAutoAccept: boolean;
}

/** Request body for fetching online P2P ads. */
export interface GetOnlineItemsRequest {
    /** Cryptocurrency code (e.g., "USDT") */
    cryptoCurrency: string;
    /** Fiat currency code (e.g., "RUB") */
    fiatCurrency: string;
    /** Trade side: BUY or SELL */
    side: TradeSide;
    /** Page number (default: 1) */
    page?: number;
    /** Items per page (default: 10, max: 50) */
    pageSize?: number;
}

/** Successful response from the online items endpoint. */
export interface GetOnlineItemsResponse {
    /** Status of request execution */
    status: "SUCCESS";
    /** List of online items */
    data: OnlineItem[];
}

/** Error response from the API. */
export interface WalletP2PErrorResponse {
    /** Error code */
    errorCode: string;
    /** Error details */
    errorMessage: string;
}

/** Client configuration options. */
export interface ClientOptions {
    /** Your Wallet P2P API key. */
    apiKey: string;
    /** API base URL. Defaults to https://p2p.walletbot.me */
    baseUrl?: string;
    /** Request timeout in milliseconds. Default: 30000 */
    timeout?: number;
    /** Max retry attempts on transient errors. Default: 3 */
    maxRetries?: number;
    /** Base delay in ms for exponential backoff. Default: 1000 */
    retryBaseDelay?: number;
}

/** Price spread statistics. */
export interface PriceSpread {
    min: string;
    max: string;
    avg: string;
    median: string;
    spread: string;
    count: number;
}

/** Comprehensive market summary. */
export interface MarketSummary {
    totalAds: number;
    priceStats: PriceSpread | null;
    onlineCount: number;
    autoAcceptCount: number;
    paymentMethods: Record<string, number>;
    merchantDistribution: Record<string, number>;
    avgCompletionRate: string;
}
