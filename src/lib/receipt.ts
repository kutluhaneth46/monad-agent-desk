import { createHash } from "node:crypto";
import {
  hexToNumber,
  monadRpc,
  type MonadCallResult,
} from "@/lib/monad";

export type TrustReceipt = {
  version: 1;
  agentId: string;
  track: string;
  chainId: number;
  blockNumber: number;
  issuedAt: string;
  claims: string[];
  fingerprint: string;
};

function canonicalPayload(parts: {
  agentId: string;
  track: string;
  chainId: number;
  blockNumber: number;
  issuedAt: string;
  claims: string[];
}): string {
  return JSON.stringify({
    v: 1,
    agentId: parts.agentId,
    track: parts.track,
    chainId: parts.chainId,
    blockNumber: parts.blockNumber,
    issuedAt: parts.issuedAt,
    claims: parts.claims,
  });
}

export function fingerprintReceipt(parts: {
  agentId: string;
  track: string;
  chainId: number;
  blockNumber: number;
  issuedAt: string;
  claims: string[];
}): string {
  return createHash("sha256")
    .update(canonicalPayload(parts), "utf8")
    .digest("hex");
}

export type IssueReceiptResult = {
  summary: string;
  evidence: MonadCallResult[];
  payload: Record<string, unknown>;
};

export async function issueTrustReceipt(args: {
  agentId?: string;
  claim?: string;
}): Promise<IssueReceiptResult> {
  const agentId = args.agentId?.trim() || "monad-agent-desk";
  const claim =
    args.claim?.trim() ||
    "MCP desk issued network-bound agent trust receipt";
  const track = "Trust, Identity & AI Infrastructure";
  const evidence = await Promise.all([
    monadRpc("eth_chainId", []),
    monadRpc("eth_blockNumber", []),
  ]);
  const [chain, block] = evidence;
  const chainId = hexToNumber(chain.data);
  const blockNumber = hexToNumber(block.data);
  const issuedAt = new Date().toISOString();
  const claims = [claim];
  const fingerprint = fingerprintReceipt({
    agentId,
    track,
    chainId,
    blockNumber,
    issuedAt,
    claims,
  });

  const receipt: TrustReceipt = {
    version: 1,
    agentId,
    track,
    chainId,
    blockNumber,
    issuedAt,
    claims,
    fingerprint,
  };

  const ok = chain.ok && block.ok;
  return {
    summary: ok
      ? `Trust receipt issued for ${agentId}. chainId=${chainId} block=${blockNumber} fp=${fingerprint.slice(0, 12)}…`
      : `Trust receipt drafted with degraded RPC evidence. fp=${fingerprint.slice(0, 12)}…`,
    evidence,
    payload: {
      ready: ok,
      receipt,
      verifyHint:
        "Pass fingerprint + same fields to verify_trust_receipt to recompute the hash.",
      rows: [
        { metric: "agentId", value: agentId },
        { metric: "chainId", value: String(chainId) },
        { metric: "block", value: String(blockNumber) },
        { metric: "fingerprint", value: fingerprint },
        { metric: "issuedAt", value: issuedAt },
      ],
    },
  };
}

export type VerifyReceiptResult = {
  summary: string;
  evidence: MonadCallResult[];
  payload: Record<string, unknown>;
};

export async function verifyTrustReceipt(args: {
  agentId: string;
  chainId: string;
  blockNumber: string;
  issuedAt: string;
  claim: string;
  fingerprint: string;
}): Promise<VerifyReceiptResult> {
  const agentId = args.agentId.trim();
  const fingerprint = args.fingerprint.trim().toLowerCase();
  const chainId = Number(args.chainId);
  const blockNumber = Number(args.blockNumber);
  const issuedAt = args.issuedAt.trim();
  const claim = args.claim.trim();
  const track = "Trust, Identity & AI Infrastructure";

  if (!agentId || !fingerprint || !issuedAt || !claim) {
    throw new Error("agentId, fingerprint, issuedAt, and claim are required");
  }
  if (!Number.isFinite(chainId) || !Number.isFinite(blockNumber)) {
    throw new Error("chainId and blockNumber must be numbers");
  }

  const expected = fingerprintReceipt({
    agentId,
    track,
    chainId,
    blockNumber,
    issuedAt,
    claims: [claim],
  });
  const match = expected === fingerprint;

  // Live chain tip for context only — verification is hash recompute.
  const tip = await monadRpc("eth_blockNumber", []);
  const tipBlock = hexToNumber(tip.data);

  return {
    summary: match
      ? `Receipt valid. fingerprint matches. tip block=${tipBlock}.`
      : `Receipt INVALID. expected ${expected.slice(0, 12)}… got ${fingerprint.slice(0, 12)}…`,
    evidence: [tip],
    payload: {
      valid: match,
      expected,
      provided: fingerprint,
      tipBlock,
      rows: [
        { metric: "valid", value: match ? "true" : "false" },
        { metric: "expected", value: expected },
        { metric: "provided", value: fingerprint },
        { metric: "tipBlock", value: String(tipBlock) },
      ],
    },
  };
}
