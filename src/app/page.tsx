"use client";

import { FormEvent, useState } from "react";
import type { AgentToolName } from "@/lib/tools";
import { EvidencePanel } from "@/components/EvidencePanel";
import { TrustReceiptPanel } from "@/components/TrustReceiptPanel";

type Evidence = {
  ok: boolean;
  mode: string;
  endpoint: string;
  url: string;
  params: Record<string, unknown>;
  status: number;
  data: unknown;
  error?: string;
  fetchedAt: string;
};

type RunResponse = {
  ok: boolean;
  prompt?: string | null;
  tool?: AgentToolName;
  summary?: string;
  evidence?: Evidence[];
  payload?: unknown;
  error?: string;
};

const SUGGESTIONS = [
  "Network briefing",
  "Agent trust brief",
  "Issue trust receipt",
  "Current block",
  "Chain id",
  "Gas price",
];

const TOOL_CHIPS: {
  tool: AgentToolName;
  label: string;
  args?: Record<string, string>;
}[] = [
  { tool: "network_briefing", label: "Briefing" },
  { tool: "agent_trust_brief", label: "Trust brief" },
  { tool: "issue_trust_receipt", label: "Issue receipt" },
  { tool: "get_chain_id", label: "Chain id" },
  { tool: "get_block_number", label: "Block" },
  { tool: "get_gas_price", label: "Gas" },
  {
    tool: "get_balance",
    label: "Zero balance",
    args: { address: "0x0000000000000000000000000000000000000000" },
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState("Network briefing");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as RunResponse;
      if (!res.ok || !json.ok) {
        setError(json.error || "Agent run failed");
        setResult(json);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run({ prompt });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
      <header className="animate-[rise_700ms_ease-out]">
        <p
          className="mb-3 font-[family-name:var(--mono)] text-xs tracking-[0.22em] uppercase"
          style={{ color: "var(--accent)" }}
        >
          Metropolis · Trust, Identity &amp; AI Infrastructure
        </p>
        <h1
          className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl"
          style={{ fontFamily: "var(--display)" }}
        >
          Monad Agent Desk
        </h1>
        <p
          className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--muted)" }}
        >
          Open agent tooling on Monad. Plain language prompts hit testnet JSON-RPC,
          issue verifiable trust receipts, and show call evidence agents can audit.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="rounded-2xl border p-5 md:p-6 animate-[rise_900ms_ease-out]"
          style={{ background: "var(--panel)", borderColor: "var(--line)" }}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label
              className="font-[family-name:var(--mono)] text-xs tracking-wider uppercase"
              style={{ color: "var(--muted)" }}
            >
              Agent prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border bg-transparent px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              placeholder="Ask for chain id, block, gas, balance, trust brief, or issue a receipt"
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="rounded-full border px-3 py-1.5 text-xs transition hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "Running tools…" : "Run agent"}
              </button>
              <a
                href="/api/tools"
                target="_blank"
                rel="noreferrer"
                className="text-sm underline-offset-4 hover:underline"
                style={{ color: "var(--accent-2)" }}
              >
                MCP tool manifest
              </a>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            {TOOL_CHIPS.map((chip) => (
              <button
                key={chip.tool + chip.label}
                type="button"
                disabled={loading}
                onClick={() => void run({ tool: chip.tool, args: chip.args || {} })}
                className="rounded-lg border px-3 py-2 font-[family-name:var(--mono)] text-xs tracking-wide uppercase transition hover:border-[var(--accent-2)]"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <aside
          className="rounded-2xl border p-5 md:p-6 animate-[rise_1100ms_ease-out]"
          style={{ background: "rgba(23,23,34,0.8)", borderColor: "var(--line)" }}
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--display)" }}>
            Why this BUIDL
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            <li>Track: Trust, Identity and AI Infrastructure</li>
            <li>MCP style /api/tools for agent discovery on Monad</li>
            <li>Live or mock Monad testnet RPC evidence on every run</li>
            <li>SHA-256 trust receipts agents can recompute and verify</li>
          </ul>
          <p
            className="mt-5 font-[family-name:var(--mono)] text-xs"
            style={{ color: "var(--accent)" }}
          >
            Default RPC: testnet-rpc.monad.xyz · set MONAD_RPC_URL to override
          </p>
        </aside>
      </section>

      <TrustReceiptPanel />

      <section
        className="rounded-2xl border p-5 md:p-6 animate-[rise_1200ms_ease-out]"
        style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--display)" }}>
            Run result
          </h2>
          {result?.tool ? (
            <span
              className="font-[family-name:var(--mono)] text-xs tracking-wider uppercase"
              style={{ color: "var(--accent-2)" }}
            >
              tool · {result.tool}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mb-4 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}

        {!result && !loading ? (
          <p style={{ color: "var(--muted)" }}>No run yet. Trigger a prompt or tool chip.</p>
        ) : null}

        {loading ? <p style={{ color: "var(--muted)" }}>Calling Monad RPC…</p> : null}

        {result?.summary ? (
          <p className="mb-5 text-base leading-relaxed md:text-lg">{result.summary}</p>
        ) : null}

        {result?.payload ? (
          <div className="mb-5 overflow-x-auto">
            <PayloadView payload={result.payload} />
          </div>
        ) : null}

        {result?.evidence?.length ? (
          <EvidencePanel evidence={result.evidence} tool={result.tool} />
        ) : null}
      </section>

      <footer className="pb-8 text-sm" style={{ color: "var(--muted)" }}>
        Built by KutluhanETH for Monad Metropolis · Monad Agent Desk
      </footer>

      <style jsx global>{`
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

function PayloadView({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") {
    return <pre className="font-[family-name:var(--mono)] text-xs">{String(payload)}</pre>;
  }

  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.rows)) {
    const rows = obj.rows as Record<string, unknown>[];
    const keys = Object.keys(rows[0] || {});
    return (
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            {keys.map((k) => (
              <th
                key={k}
                className="border-b px-3 py-2 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td
                  key={k}
                  className="border-b px-3 py-2 font-[family-name:var(--mono)] text-xs md:text-sm"
                  style={{ borderColor: "var(--line)" }}
                >
                  {String(row[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {Object.entries(obj)
        .filter(([k]) => k !== "roadmap" && k !== "receipt")
        .map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--line)" }}
          >
            <dt
              className="font-[family-name:var(--mono)] text-[10px] tracking-wider uppercase"
              style={{ color: "var(--muted)" }}
            >
              {k}
            </dt>
            <dd className="mt-1 text-sm break-all">
              {Array.isArray(v)
                ? v.join(" · ")
                : v && typeof v === "object"
                  ? Object.entries(v as Record<string, unknown>)
                      .map(([ik, iv]) => `${ik}: ${String(iv)}`)
                      .join(" · ")
                  : String(v)}
            </dd>
          </div>
        ))}
    </dl>
  );
}
