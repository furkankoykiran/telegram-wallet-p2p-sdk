import { describe, it, expect } from "vitest";
import {
    WalletP2PError,
    AuthenticationError,
    AccessDeniedError,
    BadRequestError,
    RateLimitError,
    ServerError,
} from "../src/errors.js";

describe("Error classes", () => {
    it("WalletP2PError", () => {
        const err = new WalletP2PError("test error", 500);
        expect(err.message).toBe("test error");
        expect(err.statusCode).toBe(500);
        expect(err.name).toBe("WalletP2PError");
        expect(err).toBeInstanceOf(Error);
    });

    it("AuthenticationError", () => {
        const err = new AuthenticationError();
        expect(err.message).toBe("Invalid API key");
        expect(err.statusCode).toBe(401);
        expect(err).toBeInstanceOf(WalletP2PError);
    });

    it("AccessDeniedError", () => {
        const err = new AccessDeniedError("denied", "ACCESS_DENIED");
        expect(err.message).toBe("denied");
        expect(err.statusCode).toBe(403);
        expect(err.errorCode).toBe("ACCESS_DENIED");
        expect(err).toBeInstanceOf(WalletP2PError);
    });

    it("BadRequestError", () => {
        const err = new BadRequestError("bad currency", "CRYPTO_CURRENCY_NOT_SUPPORTED");
        expect(err.message).toBe("bad currency");
        expect(err.statusCode).toBe(400);
        expect(err.errorCode).toBe("CRYPTO_CURRENCY_NOT_SUPPORTED");
        expect(err).toBeInstanceOf(WalletP2PError);
    });

    it("RateLimitError", () => {
        const err = new RateLimitError();
        expect(err.message).toBe("Request limit reached");
        expect(err.statusCode).toBe(429);
        expect(err).toBeInstanceOf(WalletP2PError);
    });

    it("ServerError", () => {
        const err = new ServerError("unavail", 503, "INTERNAL_ERROR");
        expect(err.message).toBe("unavail");
        expect(err.statusCode).toBe(503);
        expect(err.errorCode).toBe("INTERNAL_ERROR");
        expect(err).toBeInstanceOf(WalletP2PError);
    });
});
