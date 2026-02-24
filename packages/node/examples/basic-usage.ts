/**
 * Example: Basic usage of the Telegram Wallet P2P SDK (Unofficial)
 *
 * Before running:
 *   npm install telegram-wallet-p2p
 *
 * Set your API key:
 *   export WALLET_P2P_API_KEY=your-api-key
 *
 * Run:
 *   npx tsx examples/basic-usage.ts
 *
 * This is an UNOFFICIAL SDK.
 * Not affiliated with Telegram or Wallet.
 */

import {
    WalletP2PClient,
    TradeSide,
    bestPrice,
    priceSpread,
    marketSummary,
} from "telegram-wallet-p2p";

async function main() {
    const apiKey = process.env.WALLET_P2P_API_KEY;
    if (!apiKey) {
        console.error("Error: Set WALLET_P2P_API_KEY environment variable");
        process.exit(1);
    }

    const client = new WalletP2PClient({ apiKey });

    // Fetch USDT/RUB sell ads
    const response = await client.getOnlineItems({
        cryptoCurrency: "USDT",
        fiatCurrency: "RUB",
        side: TradeSide.SELL,
        pageSize: 20,
    });

    console.log(`Found ${response.data.length} ads\n`);

    // Display each ad
    for (const item of response.data) {
        console.log(
            `  [${item.merchantLevel}] ${item.nickname} — ` +
            `₽${item.price}/USDT — ` +
            `Qty: ${item.lastQuantity} — ` +
            `Methods: ${item.payments.join(", ")}`
        );
    }

    // Analytics
    console.log("\n--- Price Spread ---");
    const spread = priceSpread(response.data);
    if (spread) {
        console.log(`  Min: ${spread.min}`);
        console.log(`  Max: ${spread.max}`);
        console.log(`  Avg: ${spread.avg}`);
        console.log(`  Spread: ${spread.spread}`);
    }

    console.log("\n--- Best Price ---");
    const best = bestPrice(response.data, TradeSide.SELL);
    if (best) {
        console.log(`  Best sell: ₽${best.price} by ${best.nickname}`);
    }

    console.log("\n--- Market Summary ---");
    const summary = marketSummary(response.data);
    console.log(`  Total ads: ${summary.totalAds}`);
    console.log(`  Online: ${summary.onlineCount}`);
    console.log(`  Auto-accept: ${summary.autoAcceptCount}`);
    console.log(`  Avg completion rate: ${summary.avgCompletionRate}`);
}

main().catch(console.error);
