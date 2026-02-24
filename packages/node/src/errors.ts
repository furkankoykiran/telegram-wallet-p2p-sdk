/**
 * Error classes for the Telegram Wallet P2P SDK.
 */

/** Base error for all Wallet P2P SDK errors. */
export class WalletP2PError extends Error {
    public readonly statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = "WalletP2PError";
        this.statusCode = statusCode;
    }
}

/** Raised when the API key is invalid (HTTP 401). */
export class AuthenticationError extends WalletP2PError {
    constructor(message = "Invalid API key") {
        super(message, 401);
        this.name = "AuthenticationError";
    }
}

/** Raised when access is denied (HTTP 403). */
export class AccessDeniedError extends WalletP2PError {
    public readonly errorCode?: string;

    constructor(message = "Access denied", errorCode?: string) {
        super(message, 403);
        this.name = "AccessDeniedError";
        this.errorCode = errorCode;
    }
}

/**
 * Raised on invalid request parameters (HTTP 400).
 *
 * Contains the specific errorCode from the API, e.g.:
 * - CRYPTO_CURRENCY_NOT_SUPPORTED
 * - FIAT_CURRENCY_NOT_SUPPORTED
 */
export class BadRequestError extends WalletP2PError {
    public readonly errorCode?: string;

    constructor(message: string, errorCode?: string) {
        super(message, 400);
        this.name = "BadRequestError";
        this.errorCode = errorCode;
    }
}

/** Raised when the rate limit is exceeded (HTTP 429). */
export class RateLimitError extends WalletP2PError {
    constructor(message = "Request limit reached") {
        super(message, 429);
        this.name = "RateLimitError";
    }
}

/** Raised on server-side errors (HTTP 5xx). */
export class ServerError extends WalletP2PError {
    public readonly errorCode?: string;

    constructor(
        message = "Service temporarily unavailable",
        statusCode = 503,
        errorCode?: string
    ) {
        super(message, statusCode);
        this.name = "ServerError";
        this.errorCode = errorCode;
    }
}
