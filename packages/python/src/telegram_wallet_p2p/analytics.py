"""Analytics utilities for P2P market data.

All functions are pure and operate on lists of OnlineItem.
They do not make any API calls.
"""

from __future__ import annotations

from decimal import Decimal
from statistics import median
from typing import Dict, List, Optional

from telegram_wallet_p2p.models import MerchantLevel, OnlineItem, TradeSide


def best_price(items: List[OnlineItem], side: TradeSide) -> Optional[OnlineItem]:
    """Find the ad with the best price for the given trade side.

    For BUY side: the lowest price (cheapest to buy crypto).
    For SELL side: the highest price (best rate for selling crypto).

    Args:
        items: List of OnlineItem ads to search.
        side: Trade side to evaluate from the taker's perspective.

    Returns:
        The OnlineItem with the best price, or None if the list is empty.
    """
    if not items:
        return None

    if side == TradeSide.BUY:
        return min(items, key=lambda x: Decimal(x.price))
    else:
        return max(items, key=lambda x: Decimal(x.price))


def price_spread(items: List[OnlineItem]) -> Optional[Dict[str, str]]:
    """Calculate price spread statistics across all ads.

    Args:
        items: List of OnlineItem ads.

    Returns:
        Dictionary with min, max, avg, median prices as strings,
        or None if the list is empty.
    """
    if not items:
        return None

    prices = [Decimal(item.price) for item in items]

    min_price = min(prices)
    max_price = max(prices)
    avg_price = sum(prices) / len(prices)
    median_price = median(prices)

    return {
        "min": str(min_price),
        "max": str(max_price),
        "avg": str(round(avg_price, 4)),
        "median": str(median_price),
        "spread": str(max_price - min_price),
        "count": str(len(prices)),
    }


def filter_by_payment(items: List[OnlineItem], method: str) -> List[OnlineItem]:
    """Filter ads that accept a specific payment method.

    Args:
        items: List of OnlineItem ads.
        method: Payment method code (e.g., "sberbank", "tinkoff").

    Returns:
        Filtered list of items accepting the given payment method.
    """
    method_lower = method.lower()
    return [item for item in items if method_lower in [p.lower() for p in item.payments]]


def filter_by_merchant_level(
    items: List[OnlineItem],
    level: MerchantLevel,
) -> List[OnlineItem]:
    """Filter ads by merchant verification level.

    Args:
        items: List of OnlineItem ads.
        level: Required minimum merchant level.

    Returns:
        Filtered list of items matching the given merchant level.
    """
    return [item for item in items if item.merchant_level == level]


def market_summary(items: List[OnlineItem]) -> Dict[str, object]:
    """Generate a comprehensive market summary from a list of ads.

    Args:
        items: List of OnlineItem ads.

    Returns:
        Dictionary containing:
        - total_ads: number of ads
        - price_stats: price spread statistics
        - online_count: number of online traders
        - auto_accept_count: number of auto-accept ads
        - payment_methods: unique payment methods with counts
        - merchant_distribution: count per merchant level
        - avg_completion_rate: average order completion rate
    """
    if not items:
        return {"total_ads": 0}

    payment_counts: Dict[str, int] = {}
    for item in items:
        for method in item.payments:
            payment_counts[method] = payment_counts.get(method, 0) + 1

    merchant_dist: Dict[str, int] = {}
    for item in items:
        level_name = item.merchant_level.value
        merchant_dist[level_name] = merchant_dist.get(level_name, 0) + 1

    completion_rates = [Decimal(item.execute_rate) for item in items]
    avg_rate = sum(completion_rates) / len(completion_rates)

    return {
        "total_ads": len(items),
        "price_stats": price_spread(items),
        "online_count": sum(1 for item in items if item.is_online),
        "auto_accept_count": sum(1 for item in items if item.is_auto_accept),
        "payment_methods": payment_counts,
        "merchant_distribution": merchant_dist,
        "avg_completion_rate": str(round(avg_rate, 4)),
    }
