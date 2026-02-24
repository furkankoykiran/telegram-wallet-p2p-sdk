"""Async HTTP client for the Telegram Wallet P2P API."""

from __future__ import annotations

import asyncio
import logging
from types import TracebackType
from typing import Optional

import aiohttp

from telegram_wallet_p2p.exceptions import (
    AccessDeniedError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
    ServerError,
    WalletP2PError,
)
from telegram_wallet_p2p.models import (
    GetOnlineItemsResponse,
    TradeSide,
)

logger = logging.getLogger("telegram_wallet_p2p")

DEFAULT_BASE_URL = "https://p2p.walletbot.me"
ONLINE_ITEMS_PATH = "/p2p/integration-api/v1/item/online"


class WalletP2PClient:
    """Async client for the Telegram Wallet P2P API.

    This is an UNOFFICIAL SDK. Not affiliated with Telegram or Wallet.

    Usage::

        async with WalletP2PClient(api_key="your-key") as client:
            response = await client.get_online_items(
                crypto_currency="USDT",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
            for item in response.data:
                print(f"{item.nickname}: {item.price}")
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = 30,
        max_retries: int = 3,
        retry_base_delay: float = 1.0,
    ) -> None:
        """Initialize the client.

        Args:
            api_key: Your Wallet P2P API key.
            base_url: API base URL. Defaults to the official endpoint.
            timeout: Request timeout in seconds.
            max_retries: Max retry attempts on transient errors (429/5xx).
            retry_base_delay: Base delay in seconds for exponential backoff.
        """
        if not api_key:
            raise ValueError("api_key must not be empty")

        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = aiohttp.ClientTimeout(total=timeout)
        self._max_retries = max_retries
        self._retry_base_delay = retry_base_delay
        self._session: Optional[aiohttp.ClientSession] = None

    def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=self._timeout,
                headers={
                    "X-API-Key": self._api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
        return self._session

    async def close(self) -> None:
        """Close the underlying HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def __aenter__(self) -> WalletP2PClient:
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.close()

    async def get_online_items(
        self,
        crypto_currency: str,
        fiat_currency: str,
        side: TradeSide,
        *,
        page: int = 1,
        page_size: int = 10,
    ) -> GetOnlineItemsResponse:
        """Fetch active P2P ads from the market.

        Args:
            crypto_currency: Cryptocurrency code (e.g., "USDT", "BTC").
            fiat_currency: Fiat currency code (e.g., "RUB", "USD").
            side: Trade direction — BUY or SELL.
            page: Page number (starts at 1).
            page_size: Number of items per page (1–50, default 10).

        Returns:
            GetOnlineItemsResponse with status and list of OnlineItem.

        Raises:
            BadRequestError: If a currency is not supported.
            AuthenticationError: If the API key is invalid.
            AccessDeniedError: If access is denied.
            RateLimitError: If rate limit is exceeded.
            ServerError: On server-side errors.
            WalletP2PError: On unexpected errors.
        """
        payload = {
            "cryptoCurrency": crypto_currency,
            "fiatCurrency": fiat_currency,
            "side": side.value if isinstance(side, TradeSide) else side,
            "page": page,
            "pageSize": page_size,
        }

        url = f"{self._base_url}{ONLINE_ITEMS_PATH}"
        data = await self._request_with_retry(url, payload)
        return GetOnlineItemsResponse.model_validate(data)

    async def _request_with_retry(
        self, url: str, payload: dict
    ) -> dict:
        """Execute a POST request with exponential backoff on retryable errors."""
        last_exception: Optional[Exception] = None

        for attempt in range(self._max_retries + 1):
            try:
                return await self._do_request(url, payload)
            except (RateLimitError, ServerError) as exc:
                last_exception = exc
                if attempt < self._max_retries:
                    delay = self._retry_base_delay * (2**attempt)
                    logger.warning(
                        "Request failed (attempt %d/%d): %s. Retrying in %.1fs...",
                        attempt + 1,
                        self._max_retries + 1,
                        exc.message,
                        delay,
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        "Request failed after %d attempts: %s",
                        self._max_retries + 1,
                        exc.message,
                    )

        raise last_exception  # type: ignore[misc]

    async def _do_request(self, url: str, payload: dict) -> dict:
        """Execute a single POST request and handle error responses."""
        session = self._get_session()

        try:
            async with session.post(url, json=payload) as resp:
                status = resp.status

                if status == 200:
                    return await resp.json()

                # Try to parse error body
                error_body = {}
                try:
                    error_body = await resp.json()
                except Exception:
                    pass

                error_code = error_body.get("errorCode", "")
                error_message = error_body.get("errorMessage", resp.reason or "Unknown error")

                if status == 400:
                    raise BadRequestError(
                        message=error_message,
                        error_code=error_code,
                    )
                elif status == 401:
                    raise AuthenticationError(message=error_message)
                elif status == 403:
                    raise AccessDeniedError(
                        message=error_message,
                        error_code=error_code,
                    )
                elif status == 429:
                    raise RateLimitError(message=error_message)
                elif status >= 500:
                    raise ServerError(
                        message=error_message,
                        status_code=status,
                        error_code=error_code,
                    )
                else:
                    raise WalletP2PError(
                        message=f"Unexpected status {status}: {error_message}",
                        status_code=status,
                    )

        except aiohttp.ClientError as exc:
            raise WalletP2PError(
                message=f"HTTP request failed: {exc}",
            ) from exc
