import { BaseError } from "viem";

// The UI only needs enough to tell someone what to do next, not a raw RPC/provider
// dump (request args, contract call, docs link, version). The full error always still
// goes to the console for debugging.
export function shortErrorMessage(error: unknown): string {
  if (!error) return "";
  console.error(error);
  const raw =
    error instanceof BaseError ? (error.shortMessage ?? error.message) : error instanceof Error ? error.message : String(error);
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}

function messageOf(error: unknown): string {
  return (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
}

export function isInsufficientFundsError(error: unknown): boolean {
  const msg = messageOf(error);
  return msg.includes("insufficient funds") || msg.includes("exceeds the balance");
}

export function isProviderNotFoundError(error: unknown): boolean {
  return messageOf(error).includes("provider not found");
}

export function isUserRejectedError(error: unknown): boolean {
  const msg = messageOf(error);
  return msg.includes("user rejected") || msg.includes("rejected the request");
}
