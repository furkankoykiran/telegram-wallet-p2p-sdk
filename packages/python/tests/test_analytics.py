"""Tests for analytics utilities."""

from telegram_wallet_p2p.analytics import (
    best_price,
    filter_by_merchant_level,
    filter_by_payment,
    market_summary,
    price_spread,
)
from telegram_wallet_p2p.models import MerchantLevel, OnlineItem, TradeSide


def _make_item(**overrides) -> OnlineItem:
    defaults = {
        "id": "1",
        "number": "A1",
        "userId": 100,
        "nickname": "Trader",
        "cryptoCurrency": "USDT",
        "fiatCurrency": "RUB",
        "side": "SELL",
        "price": "100.00",
        "lastQuantity": "1000.00",
        "minAmount": "500.00",
        "maxAmount": "10000.00",
        "payments": ["sberbank"],
        "orderNum": 50,
        "executeRate": "0.95",
        "isOnline": True,
        "merchantLevel": "MERCHANT",
        "paymentPeriod": 15,
        "isAutoAccept": True,
    }
    defaults.update(overrides)
    return OnlineItem.model_validate(defaults)


def test_best_price_buy():
    items = [
        _make_item(id="1", price="100.00"),
        _make_item(id="2", price="95.00"),
        _make_item(id="3", price="102.00"),
    ]
    result = best_price(items, TradeSide.BUY)
    assert result is not None
    assert result.id == "2"  # lowest price


def test_best_price_sell():
    items = [
        _make_item(id="1", price="100.00"),
        _make_item(id="2", price="95.00"),
        _make_item(id="3", price="102.00"),
    ]
    result = best_price(items, TradeSide.SELL)
    assert result is not None
    assert result.id == "3"  # highest price


def test_best_price_empty():
    assert best_price([], TradeSide.BUY) is None


def test_price_spread_basic():
    items = [
        _make_item(price="90.00"),
        _make_item(price="100.00"),
        _make_item(price="110.00"),
    ]
    result = price_spread(items)
    assert result is not None
    assert result["min"] == "90.00"
    assert result["max"] == "110.00"
    assert result["spread"] == "20.00"
    assert result["count"] == "3"


def test_price_spread_empty():
    assert price_spread([]) is None


def test_filter_by_payment():
    items = [
        _make_item(id="1", payments=["sberbank", "tinkoff"]),
        _make_item(id="2", payments=["tinkoff"]),
        _make_item(id="3", payments=["sberbank"]),
    ]
    result = filter_by_payment(items, "tinkoff")
    assert len(result) == 2
    assert {item.id for item in result} == {"1", "2"}


def test_filter_by_payment_case_insensitive():
    items = [_make_item(payments=["Sberbank"])]
    result = filter_by_payment(items, "sberbank")
    assert len(result) == 1


def test_filter_by_merchant_level():
    items = [
        _make_item(id="1", merchantLevel="REGULAR_USER"),
        _make_item(id="2", merchantLevel="MERCHANT"),
        _make_item(id="3", merchantLevel="TRUSTED_MERCHANT"),
    ]
    result = filter_by_merchant_level(items, MerchantLevel.MERCHANT)
    assert len(result) == 1
    assert result[0].id == "2"


def test_market_summary():
    items = [
        _make_item(
            id="1",
            price="95.00",
            payments=["sberbank", "tinkoff"],
            merchantLevel="MERCHANT",
            executeRate="0.90",
            isOnline=True,
            isAutoAccept=True,
        ),
        _make_item(
            id="2",
            price="100.00",
            payments=["tinkoff"],
            merchantLevel="TRUSTED_MERCHANT",
            executeRate="0.98",
            isOnline=False,
            isAutoAccept=False,
        ),
    ]
    summary = market_summary(items)
    assert summary["total_ads"] == 2
    assert summary["online_count"] == 1
    assert summary["auto_accept_count"] == 1
    assert summary["payment_methods"]["tinkoff"] == 2
    assert summary["payment_methods"]["sberbank"] == 1
    assert summary["merchant_distribution"]["MERCHANT"] == 1
    assert summary["merchant_distribution"]["TRUSTED_MERCHANT"] == 1


def test_market_summary_empty():
    summary = market_summary([])
    assert summary["total_ads"] == 0
