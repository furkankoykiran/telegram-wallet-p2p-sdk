"""Data models derived from the Telegram Wallet P2P API OpenAPI specification."""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TradeSide(str, Enum):
    """Trade direction."""

    BUY = "BUY"
    SELL = "SELL"


class MerchantLevel(str, Enum):
    """Merchant verification level."""

    REGULAR_USER = "REGULAR_USER"
    MERCHANT = "MERCHANT"
    TRUSTED_MERCHANT = "TRUSTED_MERCHANT"


class OnlineItem(BaseModel):
    """A single P2P market ad (item).

    All price/quantity fields are strings to preserve decimal precision.
    """

    id: str = Field(description="Item (ad) ID")
    number: str = Field(description="Item (ad) human-readable number")
    user_id: int = Field(alias="userId", description="User ID of the item owner")
    nickname: str = Field(description="Nickname of the item owner")
    crypto_currency: str = Field(alias="cryptoCurrency", description="Cryptocurrency code")
    fiat_currency: str = Field(alias="fiatCurrency", description="Fiat currency code")
    side: TradeSide = Field(description="Trade side: BUY or SELL")
    price: str = Field(description="Price per unit of cryptocurrency")
    last_quantity: str = Field(alias="lastQuantity", description="Available quantity")
    min_amount: str = Field(alias="minAmount", description="Minimum order amount in fiat")
    max_amount: Optional[str] = Field(
        default=None,
        alias="maxAmount",
        description="Maximum order amount in fiat. None if no maximum limit.",
    )
    payments: List[str] = Field(description="List of accepted payment method codes")
    order_num: int = Field(alias="orderNum", description="Number of completed orders")
    execute_rate: str = Field(
        alias="executeRate", description="Order completion rate (0-1)"
    )
    is_online: bool = Field(alias="isOnline", description="Whether the user is currently online")
    merchant_level: MerchantLevel = Field(
        alias="merchantLevel", description="Merchant verification level"
    )
    payment_period: int = Field(
        alias="paymentPeriod", description="Payment timeout in minutes"
    )
    is_auto_accept: bool = Field(
        alias="isAutoAccept", description="Whether the ad has auto-accept enabled"
    )

    model_config = {"populate_by_name": True}


class GetOnlineItemsRequest(BaseModel):
    """Request body for fetching online P2P ads."""

    crypto_currency: str = Field(alias="cryptoCurrency", description="Cryptocurrency code")
    fiat_currency: str = Field(alias="fiatCurrency", description="Fiat currency code")
    side: TradeSide = Field(description="Trade side: BUY or SELL")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(
        default=10, ge=1, le=50, alias="pageSize", description="Items per page (max 50)"
    )

    model_config = {"populate_by_name": True}


class GetOnlineItemsResponse(BaseModel):
    """Response from the online items endpoint."""

    status: str = Field(description="Status of request execution")
    data: List[OnlineItem] = Field(description="List of online items")
