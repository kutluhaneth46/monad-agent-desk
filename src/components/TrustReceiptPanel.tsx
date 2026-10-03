"use client";

import { FormEvent, useState } from "react";

type Receipt = {
  agentId?: string;
  chainId?: number;
  blockNumber?: number;
  issuedAt?: string;
  claims?: string[];
  fingerprint?: string;
};

type RunJson = {
  ok: boolean;
  summary?: string;
  payload?: { receipt?: Receipt; valid?: boolean };
  error?: string;
};

async function runTool(
  tool: string,
  args: Record<string, string>,
): Promise<RunJson> {
  const res = await fetch("/api/agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  return res.json();
}

export function TrustReceiptPanel() {
  const [agentId, setAgentId] = useState("monad-agent-desk");
  const [claim, setClaim] = useState(
    "MCP desk issued network-bound agent trust receipt",
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [verifyNote, setVerifyNote] = useState("");

  async function onIssue(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setVerifyNote("");
    try {
      const json = await runTool("issue_trust_receipt", {
        agentId: agentId.trim(),
        claim: claim.trim(),
      });
      if (!json.ok) throw new Error(json.error || "issue failed");
      setReceipt(json.payload?.receipt || null);
      setStatus(json.summary || "Receipt issued");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Issue failed");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    if (!receipt?.fingerprint || !receipt.issuedAt || !receipt.claims?.[0]) {
      setVerifyNote("Issue a receipt first");
      return;
    }
    setBusy(true);
    setVerifyNote("");
    try {
      const json = await runTool("verify_trust_receipt", {
        agentId: receipt.agentId || agentId,
        chainId: String(receipt.chainId ?? ""),
        blockNumber: String(receipt.blockNumber ?? ""),
        issuedAt: receipt.issuedAt,
        claim: receipt.claims[0],
        fingerprint: receipt.fingerprint,
      });
      if (!json.ok) throw new Error(json.error || "verify failed");
      setVerifyNote(json.summary || "");
    } catch (err) {
      setVerifyNote(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border p-5 md:p-6 animate-[rise_1000ms_ease-out]"
      style={{ background: "var(--panel)", borderColor: "var(--line)" }}
    >
      <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--display)" }}>
        Agent trust receipt
      </h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        Bind an agent id to live Monad chain tip evidence and issue a SHA-256
        fingerprint judges or agents can recompute.
      </p>

      <form onSubmit={onIssue} className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span
            className="font-[family-name:var(--mono)] text-[10px] tracking-wider uppercase"
            style={{ color: "var(--muted)" }}
          >
            Agent id
          </span>
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
          <span
            className="font-[family-name:var(--mono)] text-[10px] tracking-wider uppercase"
            style={{ color: "var(--muted)" }}
          >
            Claim
          </span>
          <input
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "Working…" : "Issue receipt"}
          </button>
          <button
            type="button"
            disabled={busy || !receipt}
            onClick={() => void onVerify()}
            className="rounded-xl border px-4 py-2.5 text-sm disabled:opacity-60"
            style={{ borderColor: "var(--line)" }}
          >
            Verify fingerprint
          </button>
        </div>
      </form>

      {status ? (
        <p className="mt-4 text-sm" style={{ color: "var(--ink)" }}>
          {status}
        </p>
      ) : null}
      {verifyNote ? (
        <p className="mt-2 text-sm" style={{ color: "var(--accent-2)" }}>
          {verifyNote}
        </p>
      ) : null}

      {receipt ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["agentId", receipt.agentId],
            ["chainId", receipt.chainId],
            ["block", receipt.blockNumber],
            ["issuedAt", receipt.issuedAt],
            ["fingerprint", receipt.fingerprint],
          ].map(([k, v]) => (
            <div
              key={String(k)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--line)" }}
            >
              <dt
                className="font-[family-name:var(--mono)] text-[10px] tracking-wider uppercase"
                style={{ color: "var(--muted)" }}
              >
                {k}
              </dt>
              <dd className="mt-1 font-[family-name:var(--mono)] text-xs break-all">
                {String(v ?? "")}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
