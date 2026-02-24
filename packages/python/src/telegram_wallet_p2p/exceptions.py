"""Exception classes for the Telegram Wallet P2P SDK."""

from __future__ import annotations

from typing import Optional


class WalletP2PError(Exception):
    """Base exception for all Wallet P2P SDK errors."""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(WalletP2PError):
    """Raised when the API key is invalid (HTTP 401)."""

    def __init__(self, message: str = "Invalid API key") -> None:
        super().__init__(message, status_code=401)


class AccessDeniedError(WalletP2PError):
    """Raised when access is denied (HTTP 403)."""

    def __init__(
        self,
        message: str = "Access denied",
        error_code: Optional[str] = None,
    ) -> None:
        self.error_code = error_code
        super().__init__(message, status_code=403)


class BadRequestError(WalletP2PError):
    """Raised on invalid request parameters (HTTP 400).

    Contains the specific error_code from the API response, e.g.:
    - CRYPTO_CURRENCY_NOT_SUPPORTED
    - FIAT_CURRENCY_NOT_SUPPORTED
    """

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
    ) -> None:
        self.error_code = error_code
        super().__init__(message, status_code=400)


class RateLimitError(WalletP2PError):
    """Raised when the request rate limit is exceeded (HTTP 429)."""

    def __init__(self, message: str = "Request limit reached") -> None:
        super().__init__(message, status_code=429)


class ServerError(WalletP2PError):
    """Raised on server-side errors (HTTP 5xx)."""

    def __init__(
        self,
        message: str = "Service temporarily unavailable",
        status_code: int = 503,
        error_code: Optional[str] = None,
    ) -> None:
        self.error_code = error_code
        super().__init__(message, status_code=status_code)
