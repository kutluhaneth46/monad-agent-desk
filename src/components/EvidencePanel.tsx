"use client";

import { useMemo, useState } from "react";

export type EvidenceRow = {
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

export function EvidencePanel({
  evidence,
  tool,
}: {
  evidence: EvidenceRow[];
  tool?: string;
}) {
  const [copied, setCopied] = useState(false);

  const pack = useMemo(
    () =>
      JSON.stringify(
        {
          tool: tool ?? null,
          evidenceCount: evidence.length,
          evidence,
        },
        null,
        2,
      ),
    [evidence, tool],
  );

  async function copyPack() {
    try {
      await navigator.clipboard.writeText(pack);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (!evidence.length) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3
          className="font-[family-name:var(--mono)] text-xs tracking-wider uppercase"
          style={{ color: "var(--muted)" }}
        >
          RPC call evidence · {evidence.length} call
          {evidence.length === 1 ? "" : "s"}
        </h3>
        <button
          type="button"
          onClick={() => void copyPack()}
          className="rounded-lg border px-3 py-1.5 font-[family-name:var(--mono)] text-[11px] uppercase tracking-wide"
          style={{ borderColor: "var(--line)", color: "var(--accent-2)" }}
        >
          {copied ? "Copied" : "Copy evidence pack"}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {evidence.map((ev, i) => (
          <div
            key={`${ev.endpoint}-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="rounded px-2 py-0.5 font-[family-name:var(--mono)] text-[10px] uppercase"
              style={{
                background: ev.ok ? "rgba(110,231,183,0.15)" : "rgba(248,113,113,0.15)",
                color: ev.ok ? "var(--ok)" : "var(--danger)",
              }}
            >
              {ev.ok ? "OK" : "ERR"}
            </span>
            <span
              className="rounded px-2 py-0.5 font-[family-name:var(--mono)] text-[10px] uppercase"
              style={{ background: "rgba(167,139,250,0.12)", color: "var(--accent)" }}
            >
              {ev.mode}
            </span>
            <span className="font-[family-name:var(--mono)]">{ev.endpoint}</span>
            <span style={{ color: "var(--muted)" }}>HTTP {ev.status}</span>
            <span style={{ color: "var(--muted)" }}>{ev.fetchedAt}</span>
            {ev.error ? (
              <span className="w-full break-all" style={{ color: "var(--danger)" }}>
                {ev.error}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <pre
        className="max-h-[420px] overflow-auto rounded-xl border p-4 font-[family-name:var(--mono)] text-[11px] leading-relaxed md:text-xs"
        style={{ background: "#08080e", borderColor: "var(--line)", color: "#d8d4ef" }}
      >
        {pack.slice(0, 12000)}
      </pre>
    </div>
  );
}
