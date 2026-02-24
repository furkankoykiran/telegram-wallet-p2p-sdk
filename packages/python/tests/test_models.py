"""Tests for data models."""

from telegram_wallet_p2p.models import (
    GetOnlineItemsRequest,
    GetOnlineItemsResponse,
    MerchantLevel,
    OnlineItem,
    TradeSide,
)

SAMPLE_ITEM_DATA = {
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


def test_online_item_from_dict():
    item = OnlineItem.model_validate(SAMPLE_ITEM_DATA)
    assert item.id == "12345"
    assert item.number == "A1B2C3"
    assert item.user_id == 67890
    assert item.nickname == "CryptoTrader"
    assert item.crypto_currency == "USDT"
    assert item.fiat_currency == "RUB"
    assert item.side == TradeSide.SELL
    assert item.price == "98.50"
    assert item.last_quantity == "1500.00"
    assert item.min_amount == "1000.00"
    assert item.max_amount == "50000.00"
    assert item.payments == ["sberbank", "tinkoff"]
    assert item.order_num == 156
    assert item.execute_rate == "0.9875"
    assert item.is_online is True
    assert item.merchant_level == MerchantLevel.MERCHANT
    assert item.payment_period == 15
    assert item.is_auto_accept is True


def test_online_item_null_max_amount():
    data = {**SAMPLE_ITEM_DATA, "maxAmount": None}
    item = OnlineItem.model_validate(data)
    assert item.max_amount is None


def test_online_item_serialization():
    item = OnlineItem.model_validate(SAMPLE_ITEM_DATA)
    dumped = item.model_dump(by_alias=True)
    assert dumped["userId"] == 67890
    assert dumped["cryptoCurrency"] == "USDT"
    assert dumped["isAutoAccept"] is True


def test_get_online_items_request_defaults():
    req = GetOnlineItemsRequest(
        crypto_currency="USDT",
        fiat_currency="RUB",
        side=TradeSide.SELL,
    )
    assert req.page == 1
    assert req.page_size == 10


def test_get_online_items_request_serialization():
    req = GetOnlineItemsRequest(
        crypto_currency="BTC",
        fiat_currency="USD",
        side=TradeSide.BUY,
        page=2,
        page_size=50,
    )
    dumped = req.model_dump(by_alias=True)
    assert dumped["cryptoCurrency"] == "BTC"
    assert dumped["fiatCurrency"] == "USD"
    assert dumped["side"] == "BUY"
    assert dumped["pageSize"] == 50


def test_get_online_items_response():
    data = {
        "status": "SUCCESS",
        "data": [SAMPLE_ITEM_DATA],
    }
    resp = GetOnlineItemsResponse.model_validate(data)
    assert resp.status == "SUCCESS"
    assert len(resp.data) == 1
    assert resp.data[0].id == "12345"


def test_trade_side_enum():
    assert TradeSide.BUY.value == "BUY"
    assert TradeSide.SELL.value == "SELL"


def test_merchant_level_enum():
    assert MerchantLevel.REGULAR_USER.value == "REGULAR_USER"
    assert MerchantLevel.MERCHANT.value == "MERCHANT"
    assert MerchantLevel.TRUSTED_MERCHANT.value == "TRUSTED_MERCHANT"
