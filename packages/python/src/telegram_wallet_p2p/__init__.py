"""
Telegram Wallet P2P SDK (Unofficial)

A Python SDK for the Telegram Wallet P2P API.
This is an UNOFFICIAL project and is not affiliated with Telegram or Wallet.

Provides read-only access to P2P market data for analytics and monitoring.
"""

from telegram_wallet_p2p.client import WalletP2PClient
from telegram_wallet_p2p.exceptions import (
    AccessDeniedError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
    ServerError,
    WalletP2PError,
)
from telegram_wallet_p2p.models import (
    GetOnlineItemsRequest,
    GetOnlineItemsResponse,
    MerchantLevel,
    OnlineItem,
    TradeSide,
)

__version__ = "0.1.0"

__all__ = [
    "WalletP2PClient",
    "WalletP2PError",
    "AuthenticationError",
    "AccessDeniedError",
    "BadRequestError",
    "RateLimitError",
    "ServerError",
    "OnlineItem",
    "GetOnlineItemsRequest",
    "GetOnlineItemsResponse",
    "TradeSide",
    "MerchantLevel",
]
