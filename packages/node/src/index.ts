/**
 * Telegram Wallet P2P SDK (Unofficial)
 *
 * A TypeScript SDK for the Telegram Wallet P2P API.
 * This is an UNOFFICIAL project and is not affiliated with Telegram or Wallet.
 *
 * Provides read-only access to P2P market data for analytics and monitoring.
 *
 * @packageDocumentation
 */

export { WalletP2PClient } from "./client.js";

export {
    WalletP2PError,
    AuthenticationError,
    AccessDeniedError,
    BadRequestError,
    RateLimitError,
    ServerError,
} from "./errors.js";

export {
    TradeSide,
    MerchantLevel,
    ErrorCode,
} from "./types.js";

export type {
    OnlineItem,
    GetOnlineItemsRequest,
    GetOnlineItemsResponse,
    WalletP2PErrorResponse,
    ClientOptions,
    PriceSpread,
    MarketSummary,
} from "./types.js";

export {
    bestPrice,
    priceSpread,
    filterByPayment,
    filterByMerchantLevel,
    marketSummary,
} from "./analytics.js";
