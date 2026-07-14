import { resolve } from "node:path";
import { AccountLedgerStore } from "../server/account/store";

const code = process.argv[2] || "";
const status = process.argv[3] === "inactive" || process.argv[3] === "disabled" ? process.argv[3] : "active";
const pepper = process.env.LOTTOMIND_REDEMPTION_PEPPER || "";
if (!code || !pepper) {
  console.error("Usage: LOTTOMIND_REDEMPTION_PEPPER=<secret> npm run provision:collectible -- <one-time-code> [active|inactive|disabled]");
  process.exitCode = 1;
} else {
  const store = new AccountLedgerStore(resolve(".data", "account-ledger.json"), pepper, true);
  await store.init();
  await store.provisionCollectible({ code, status });
  console.log("Collectible provisioned. The plaintext code was not stored.");
}

