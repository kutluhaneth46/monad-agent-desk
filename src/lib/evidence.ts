import type { MonadCallResult } from "@/lib/monad";

export type EdgeFlag = {
  code:
    | "rpc_error"
    | "mock_mode"
    | "mock_fallback"
    | "unreachable"
    | "empty_data"
    | "http_error";
  level: "info" | "warn" | "error";
  message: string;
};

export type HashedEvidence = MonadCallResult & {
  evidenceHash: string;
  hashedPayload: Record<string, unknown>;
  flags: EdgeFlag[];
};

export type RunReceipt = {
  runId: string;
  tool: string;
  summary: string;
  createdAt: string;
  trustNote: string;
  calls: HashedEvidence[];
  receiptHash: string;
  algorithm: "sha-256";
};

const SAMPLE_MAX = 2000;

const TRUST_NOTE =
  "Hashes bind method, params, endpoint label, status, and response sample for this run. The desk server still produces the receipt. The hash makes a silent rewrite of the evidence panel detectable.";

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }
  return value;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sampleForHash(data: unknown): unknown {
  try {
    const raw = JSON.stringify(data);
    if (raw.length <= SAMPLE_MAX) return data ?? null;
    return { _truncated: true, preview: raw.slice(0, SAMPLE_MAX) };
  } catch {
    return { _unserializable: true };
  }
}

export function flagsForCall(ev: MonadCallResult): EdgeFlag[] {
  const flags: EdgeFlag[] = [];
  if (ev.mode === "mock") {
    flags.push({
      code: "mock_mode",
      level: "warn",
      message: "Response served from mock fixtures (not a live RPC body).",
    });
  }
  if (ev.error?.toLowerCase().includes("mock fallback")) {
    flags.push({
      code: "mock_fallback",
      level: "warn",
      message: "Live RPC was unreachable; desk fell back to mock data.",
    });
  }
  if (!ev.ok) {
    flags.push({
      code: "rpc_error",
      level: "error",
      message: ev.error || "RPC call failed.",
    });
  }
  if (ev.status === 0) {
    flags.push({
      code: "unreachable",
      level: "error",
      message: "Endpoint unreachable (network/TLS).",
    });
  } else if (ev.status >= 400) {
    flags.push({
      code: "http_error",
      level: "error",
      message: `HTTP ${ev.status}`,
    });
  }
  if (ev.ok && (ev.data === null || ev.data === undefined)) {
    flags.push({
      code: "empty_data",
      level: "warn",
      message: "Call reported OK but returned empty data.",
    });
  }
  return flags;
}

export function buildHashedPayload(ev: MonadCallResult): Record<string, unknown> {
  return {
    endpoint: ev.endpoint,
    mode: ev.mode,
    status: ev.status,
    url: ev.url,
    params: ev.params,
    ok: ev.ok,
    error: ev.error ?? null,
    sample: sampleForHash(ev.data),
    fetchedAt: ev.fetchedAt,
  };
}

export async function sealEvidenceCall(
  ev: MonadCallResult,
): Promise<HashedEvidence> {
  const hashedPayload = buildHashedPayload(ev);
  const evidenceHash = await sha256Hex(stableStringify(hashedPayload));
  return {
    ...ev,
    evidenceHash,
    hashedPayload,
    flags: flagsForCall(ev),
  };
}

export async function sealRun(input: {
  tool: string;
  summary: string;
  evidence: MonadCallResult[];
}): Promise<RunReceipt> {
  const createdAt = new Date().toISOString();
  const runId = globalThis.crypto.randomUUID();
  const calls = await Promise.all(input.evidence.map(sealEvidenceCall));
  const receiptBody = {
    runId,
    tool: input.tool,
    createdAt,
    callHashes: calls.map((c) => c.evidenceHash),
  };
  const receiptHash = await sha256Hex(stableStringify(receiptBody));
  return {
    runId,
    tool: input.tool,
    summary: input.summary,
    createdAt,
    trustNote: TRUST_NOTE,
    calls,
    receiptHash,
    algorithm: "sha-256",
  };
}

export async function verifyEvidenceHash(
  hashedPayload: Record<string, unknown>,
  evidenceHash: string,
): Promise<boolean> {
  const again = await sha256Hex(stableStringify(hashedPayload));
  return again === evidenceHash;
}

export async function verifyReceiptHash(receipt: RunReceipt): Promise<boolean> {
  const body = {
    runId: receipt.runId,
    tool: receipt.tool,
    createdAt: receipt.createdAt,
    callHashes: receipt.calls.map((c) => c.evidenceHash),
  };
  const again = await sha256Hex(stableStringify(body));
  if (again !== receipt.receiptHash) return false;
  for (const call of receipt.calls) {
    const ok = await verifyEvidenceHash(call.hashedPayload, call.evidenceHash);
    if (!ok) return false;
  }
  return true;
}
