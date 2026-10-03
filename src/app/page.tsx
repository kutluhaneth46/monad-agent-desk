"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import type { AgentToolName } from "@/lib/tools";
import {
  verifyReceiptHash,
  type EdgeFlag,
  type HashedEvidence,
  type RunReceipt,
} from "@/lib/evidence";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustReceiptPanel } from "@/components/TrustReceiptPanel";

const GITHUB = "https://github.com/kutluhaneth46/monad-agent-desk";

type RunResponse = {
  ok: boolean;
  prompt?: string | null;
  tool?: AgentToolName;
  summary?: string;
  evidence?: HashedEvidence[];
  receipt?: RunReceipt;
  payload?: unknown;
  error?: string;
};

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
    label: "Balance",
    args: { address: "0x0000000000000000000000000000000000000000" },
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState("Network briefing");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyState, setVerifyState] = useState<"idle" | "ok" | "fail">("idle");

  const suggestions = useMemo(
    () => [
      "Network briefing",
      "Agent trust brief",
      "Issue trust receipt",
      "Current block",
    ],
    [],
  );

  const evidencePreview = useMemo(() => {
    const first = result?.evidence?.[0];
    if (!first) return null;
    return JSON.stringify(
      {
        endpoint: first.endpoint,
        mode: first.mode,
        status: first.status,
        url: first.url,
        params: first.params,
        evidenceHash: first.evidenceHash,
        flags: first.flags,
        sample: first.data,
      },
      null,
      2,
    ).slice(0, 3500);
  }, [result]);

  async function run(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setVerifyState("idle");
    setCopied(false);
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as RunResponse;
      if (!res.ok || !json.ok) {
        setError(json.error || "Something went wrong while running the desk");
        setResult(json);
      } else {
        setResult(json);
        requestAnimationFrame(() => {
          document.getElementById("evidence")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
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

  function runJuryDemo() {
    void run({ tool: "network_briefing" });
  }

  async function copyProof() {
    if (!result?.receipt) return;
    await navigator.clipboard.writeText(JSON.stringify(result.receipt, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function verifyProof() {
    if (!result?.receipt) return;
    const ok = await verifyReceiptHash(result.receipt);
    setVerifyState(ok ? "ok" : "fail");
  }

  const allFlags: EdgeFlag[] =
    result?.evidence?.flatMap((ev) => ev.flags || []) || [];

  return (
    <>
      <SiteHeader />
      <main
        id="top"
        className="relative z-[1] mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-5 py-8 md:gap-12 md:px-8 md:py-12"
      >
        <section className="animate-[rise_700ms_ease-out]">
          <div className="mb-5 flex items-center gap-4">
            <Image
              src="/logo.png"
              alt=""
              width={72}
              height={72}
              className="rounded-2xl shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
              priority
            />
            <div>
              <p
                className="font-[family-name:var(--mono)] text-xs tracking-[0.2em] uppercase"
                style={{ color: "var(--accent)" }}
              >
                Metropolis · Trust, Identity &amp; AI Infrastructure
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Monad testnet JSON-RPC · sealed run receipts
              </p>
            </div>
          </div>

          <h1
            className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl"
            style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
          >
            Monad Agent Desk
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--muted)" }}
          >
            Run agent tools on Monad testnet, get human-readable summaries, and
            export SHA-256 proof packs judges can verify in the browser.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runJuryDemo}
              disabled={loading}
              className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Running…" : "Run jury demo (60s)"}
            </button>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border px-5 py-3 text-sm font-semibold no-underline transition hover:border-[var(--accent-2)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              View source
            </a>
          </div>

          <ol
            className="mt-8 grid gap-3 border-t pt-6 sm:grid-cols-3"
            style={{ borderColor: "var(--line)" }}
            aria-label="Jury path"
          >
            {[
              {
                t: "What",
                b: "Desk runs MCP-style tools against Monad testnet RPC (or labeled mocks).",
              },
              {
                t: "Proof",
                b: "Each call is sealed with endpoint, params, status, and a response sample.",
              },
              {
                t: "Hash",
                b: "Receipt hash binds the run; verify locally to catch panel tampering.",
              },
            ].map((item) => (
              <li key={item.t} className="min-w-0">
                <p
                  className="font-[family-name:var(--mono)] text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  {item.t}
                </p>
                <p className="mt-1 text-sm leading-snug" style={{ color: "var(--muted)" }}>
                  {item.b}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="evidence"
          className="scroll-mt-24 rounded-2xl border p-5 md:p-7 animate-[rise_900ms_ease-out]"
          style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className="font-[family-name:var(--mono)] text-xs tracking-[0.18em] uppercase"
                style={{ color: "var(--accent)" }}
              >
                Run output
              </p>
              <h2
                className="mt-1 text-2xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
              >
                Evidence &amp; receipt
              </h2>
            </div>
            {result?.tool ? (
              <span
                className="rounded-full border px-3 py-1 font-[family-name:var(--mono)] text-xs tracking-wider uppercase"
                style={{ borderColor: "var(--line)", color: "var(--accent-2)" }}
              >
                {result.tool}
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="mb-4 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}

          {!result && !loading ? (
            <p style={{ color: "var(--muted)" }}>
              No run yet. Use the jury demo or desk tools below.
            </p>
          ) : null}

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Calling Monad RPC…</p>
          ) : null}

          {result?.summary ? (
            <p
              className="mb-5 text-base leading-relaxed md:text-lg"
              style={{ color: "var(--ink)" }}
            >
              {result.summary}
            </p>
          ) : null}

          {result?.receipt ? (
            <div
              className="mb-5 rounded-xl border p-4"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <p
                className="font-[family-name:var(--mono)] text-[11px] tracking-[0.16em] uppercase"
                style={{ color: "var(--accent)" }}
              >
                Sealed run receipt
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase" style={{ color: "var(--muted)" }}>
                    Run id
                  </dt>
                  <dd
                    className="mt-1 break-all font-[family-name:var(--mono)] text-xs"
                    style={{ color: "var(--ink)" }}
                  >
                    {result.receipt.runId}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase" style={{ color: "var(--muted)" }}>
                    Receipt hash
                  </dt>
                  <dd
                    className="mt-1 break-all font-[family-name:var(--mono)] text-xs"
                    style={{ color: "var(--ink)" }}
                  >
                    {result.receipt.receiptHash}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "var(--ink)" }}>
                  Trust note:{" "}
                </span>
                {result.receipt.trustNote}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyProof()}
                  className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  {copied ? "Copied" : "Copy proof pack"}
                </button>
                <button
                  type="button"
                  onClick={() => void verifyProof()}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  Verify hashes locally
                </button>
              </div>
              {verifyState === "ok" ? (
                <p className="mt-2 text-xs font-semibold" style={{ color: "var(--accent-2)" }}>
                  Receipt and call hashes verify.
                </p>
              ) : null}
              {verifyState === "fail" ? (
                <p className="mt-2 text-xs font-semibold" style={{ color: "var(--danger)" }}>
                  Verification failed — receipt or evidence was altered.
                </p>
              ) : null}
            </div>
          ) : null}

          {allFlags.length > 0 ? (
            <div className="mb-5">
              <h3
                className="mb-2 text-xs font-medium tracking-wide uppercase"
                style={{ color: "var(--muted)" }}
              >
                Edge flags
              </h3>
              <ul className="flex flex-col gap-2">
                {allFlags.map((flag, i) => (
                  <li
                    key={`${flag.code}-${i}`}
                    className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
                    style={{
                      borderColor:
                        flag.level === "error"
                          ? "color-mix(in srgb, var(--danger) 55%, var(--line))"
                          : "var(--line)",
                      color: "var(--ink)",
                      background: "var(--panel)",
                    }}
                  >
                    <span
                      className="font-[family-name:var(--mono)] uppercase tracking-wider"
                      style={{
                        color:
                          flag.level === "error"
                            ? "var(--danger)"
                            : flag.level === "warn"
                              ? "var(--accent)"
                              : "var(--muted)",
                      }}
                    >
                      {flag.level} · {flag.code}
                    </span>
                    <span className="mt-0.5 block" style={{ color: "var(--muted)" }}>
                      {flag.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result?.payload ? (
            <div className="mb-5 overflow-x-auto">
              <PayloadView payload={result.payload} />
            </div>
          ) : null}

          {evidencePreview ? (
            <div>
              <h3
                className="mb-2 text-xs font-medium tracking-wide uppercase"
                style={{ color: "var(--muted)" }}
              >
                Evidence preview
              </h3>
              <pre
                className="max-h-[360px] overflow-auto rounded-xl border p-4 font-[family-name:var(--mono)] text-[11px] leading-relaxed md:text-xs"
                style={{
                  background: "var(--bg)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              >
                {evidencePreview}
              </pre>
              {result?.evidence?.map((ev, i) => (
                <p
                  key={`${ev.endpoint}-${i}`}
                  className="mt-2 font-[family-name:var(--mono)] text-[11px]"
                  style={{ color: "var(--muted)" }}
                >
                  {ev.ok ? "OK" : "ERR"} · {ev.mode} · HTTP {ev.status} · {ev.endpoint} ·
                  hash {ev.evidenceHash.slice(0, 16)}… · {ev.fetchedAt}
                  {ev.error ? ` · ${ev.error}` : ""}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section id="desk" className="scroll-mt-24 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div
            className="rounded-2xl border p-5 md:p-7 animate-[rise_1000ms_ease-out]"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
          >
            <p
              className="font-[family-name:var(--mono)] text-xs tracking-[0.18em] uppercase"
              style={{ color: "var(--accent)" }}
            >
              Agent desk
            </p>
            <h2
              className="mt-1 text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
            >
              Prompt or pick a tool
            </h2>
            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <label
                className="text-xs font-medium tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                Agent prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border bg-transparent px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                placeholder="Chain id, block, gas, trust brief, or issue a receipt"
              />
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "Running…" : "Run agent"}
                </button>
                <a
                  href="/api/tools"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold underline-offset-4 hover:underline"
                  style={{ color: "var(--accent-2)" }}
                >
                  MCP tool manifest
                </a>
              </div>
            </form>

            <details className="mt-8">
              <summary
                className="cursor-pointer list-none text-sm font-semibold"
                style={{ color: "var(--ink)" }}
              >
                More tools.{" "}
                <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                  Monad-specific RPC and trust flows
                </span>
              </summary>
              <div className="mt-5 flex flex-wrap gap-2">
                {TOOL_CHIPS.map((chip) => (
                  <button
                    key={chip.tool + chip.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void run({ tool: chip.tool, args: chip.args || {} })}
                    className="rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:border-[var(--accent-2)] disabled:opacity-50"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <aside
            className="rounded-2xl border p-5 md:p-7 animate-[rise_1100ms_ease-out]"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
            >
              Why this desk
            </h2>
            <ul
              className="mt-4 space-y-3 text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              <li>
                <span style={{ color: "var(--ink)" }} className="font-medium">
                  Evidence-first runs —
                </span>
                every tool returns copyable RPC evidence with SHA-256 seals.
              </li>
              <li>
                <span style={{ color: "var(--ink)" }} className="font-medium">
                  Agent trust receipts —
                </span>
                bind claims to chain tip data on Monad testnet.
              </li>
            </ul>
            <p
              className="mt-6 rounded-xl border p-3 text-xs leading-relaxed"
              style={{ borderColor: "var(--line)", color: "var(--accent)" }}
            >
              Default RPC: testnet-rpc.monad.xyz · set MONAD_RPC_URL to override
            </p>
          </aside>
        </section>

        <TrustReceiptPanel />

        <section
          id="about"
          className="scroll-mt-24 rounded-2xl border p-5 md:p-8 animate-[rise_1300ms_ease-out]"
          style={{ background: "var(--panel)", borderColor: "var(--line)" }}
        >
          <p
            className="font-[family-name:var(--mono)] text-xs tracking-[0.18em] uppercase"
            style={{ color: "var(--accent)" }}
          >
            About
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
          >
            Evidence and trust on Monad
          </h2>
          <div
            className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed md:text-base"
            style={{ color: "var(--muted)" }}
          >
            <p>
              Monad Agent Desk is a public demo for the Metropolis track: agents
              discover tools via <code className="text-xs">/api/tools</code>, execute
              against Monad testnet JSON-RPC, and return sealed proof packs plus
              optional agent trust receipts.
            </p>
            <p>
              Unlike a generic chat wrapper, the jury path shows what was called,
              what came back, and cryptographic hashes you can verify without trusting
              the UI alone.
            </p>
            <p>
              Built by KutluhanETH · open source on GitHub · deployable to Vercel
              with env overrides for RPC and mock mode.
            </p>
          </div>
        </section>

        <footer
          className="flex flex-wrap items-center justify-between gap-4 border-t pb-10 pt-2 text-sm"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
            <span>Monad Agent Desk · Metropolis 2026</span>
          </div>
          <a href={GITHUB} target="_blank" rel="noreferrer">
            Source
          </a>
        </footer>
      </main>
    </>
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
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
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
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: "var(--line)" }}
          >
            <dt
              className="font-[family-name:var(--mono)] text-[10px] tracking-wider uppercase"
              style={{ color: "var(--muted)" }}
            >
              {k}
            </dt>
            <dd className="mt-1 text-sm break-all" style={{ color: "var(--ink)" }}>
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
