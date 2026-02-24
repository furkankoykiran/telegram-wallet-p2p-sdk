"""Tests for the async HTTP client."""

import pytest
from aioresponses import aioresponses

from telegram_wallet_p2p.client import DEFAULT_BASE_URL, ONLINE_ITEMS_PATH, WalletP2PClient
from telegram_wallet_p2p.exceptions import (
    AccessDeniedError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
    ServerError,
)
from telegram_wallet_p2p.models import TradeSide

URL = f"{DEFAULT_BASE_URL}{ONLINE_ITEMS_PATH}"

SAMPLE_RESPONSE = {
    "status": "SUCCESS",
    "data": [
        {
            "id": "12345",
            "number": "A1B2C3",
            "userId": 67890,
            "nickname": "CryptoTrader",
            "cryptoCurrency": "USDT",
            "fiatCurrency": "RUB",
            "side": "SELL",
            "price": "98.50",
            "lastQuantity": "1500.00",
            "minAmount": "1000.00",
            "maxAmount": "50000.00",
            "payments": ["sberbank", "tinkoff"],
            "orderNum": 156,
            "executeRate": "0.9875",
            "isOnline": True,
            "merchantLevel": "MERCHANT",
            "paymentPeriod": 15,
            "isAutoAccept": True,
        }
    ],
}


@pytest.fixture
def client():
    return WalletP2PClient(api_key="test-key", max_retries=0)


@pytest.mark.asyncio
async def test_get_online_items_success(client):
    with aioresponses() as mocked:
        mocked.post(URL, payload=SAMPLE_RESPONSE)
        response = await client.get_online_items(
            crypto_currency="USDT",
            fiat_currency="RUB",
            side=TradeSide.SELL,
        )
        assert response.status == "SUCCESS"
        assert len(response.data) == 1
        assert response.data[0].id == "12345"
        assert response.data[0].price == "98.50"
    await client.close()


@pytest.mark.asyncio
async def test_bad_request_error(client):
    with aioresponses() as mocked:
        mocked.post(
            URL,
            status=400,
            payload={
                "errorCode": "CRYPTO_CURRENCY_NOT_SUPPORTED",
                "errorMessage": "crypto currency XYZ is not supported.",
            },
        )
        with pytest.raises(BadRequestError) as exc_info:
            await client.get_online_items(
                crypto_currency="XYZ",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
        assert exc_info.value.error_code == "CRYPTO_CURRENCY_NOT_SUPPORTED"
    await client.close()


@pytest.mark.asyncio
async def test_authentication_error(client):
    with aioresponses() as mocked:
        mocked.post(URL, status=401, payload={})
        with pytest.raises(AuthenticationError):
            await client.get_online_items(
                crypto_currency="USDT",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
    await client.close()


@pytest.mark.asyncio
async def test_access_denied_error(client):
    with aioresponses() as mocked:
        mocked.post(
            URL,
            status=403,
            payload={
                "errorCode": "ACCESS_DENIED",
                "errorMessage": "access denied.",
            },
        )
        with pytest.raises(AccessDeniedError):
            await client.get_online_items(
                crypto_currency="USDT",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
    await client.close()


@pytest.mark.asyncio
async def test_rate_limit_error(client):
    with aioresponses() as mocked:
        mocked.post(URL, status=429, payload={})
        with pytest.raises(RateLimitError):
            await client.get_online_items(
                crypto_currency="USDT",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
    await client.close()


@pytest.mark.asyncio
async def test_server_error(client):
    with aioresponses() as mocked:
        mocked.post(
            URL,
            status=503,
            payload={
                "errorCode": "INTERNAL_ERROR",
                "errorMessage": "service is temporarily unavailable.",
            },
        )
        with pytest.raises(ServerError) as exc_info:
            await client.get_online_items(
                crypto_currency="USDT",
                fiat_currency="RUB",
                side=TradeSide.SELL,
            )
        assert exc_info.value.status_code == 503
    await client.close()


@pytest.mark.asyncio
async def test_retry_on_server_error():
    client = WalletP2PClient(api_key="test-key", max_retries=2, retry_base_delay=0.01)
    with aioresponses() as mocked:
        error_payload = {"errorCode": "INTERNAL_ERROR", "errorMessage": "fail"}
        mocked.post(URL, status=503, payload=error_payload)
        mocked.post(URL, status=503, payload=error_payload)
        mocked.post(URL, payload=SAMPLE_RESPONSE)

        response = await client.get_online_items(
            crypto_currency="USDT",
            fiat_currency="RUB",
            side=TradeSide.SELL,
        )
        assert response.status == "SUCCESS"
    await client.close()


@pytest.mark.asyncio
async def test_context_manager():
    async with WalletP2PClient(api_key="test-key") as client:
        assert client._api_key == "test-key"


def test_empty_api_key_raises():
    with pytest.raises(ValueError, match="api_key must not be empty"):
        WalletP2PClient(api_key="")
