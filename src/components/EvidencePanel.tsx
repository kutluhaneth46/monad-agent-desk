"use client";

import { useMemo, useState } from "react";
import type { EdgeFlag, HashedEvidence } from "@/lib/evidence";

export type EvidenceRow = HashedEvidence;

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

  const allFlags = useMemo(
    () => evidence.flatMap((ev) => ev.flags || []),
    [evidence],
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
          className="btn-secondary rounded-lg px-3 py-1.5 font-[family-name:var(--mono)] text-[11px] uppercase tracking-wide"
        >
          {copied ? "Copied" : "Copy evidence pack"}
        </button>
      </div>

      {allFlags.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-2">
          {allFlags.map((flag: EdgeFlag, i) => (
            <li
              key={`${flag.code}-${i}`}
              className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              style={{
                borderColor:
                  flag.level === "error"
                    ? "color-mix(in srgb, var(--danger) 55%, var(--line))"
                    : "var(--line)",
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
      ) : null}

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
            {ev.evidenceHash ? (
              <span
                className="font-[family-name:var(--mono)] break-all"
                style={{ color: "var(--accent-2)" }}
              >
                hash {ev.evidenceHash.slice(0, 20)}…
              </span>
            ) : null}
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
        style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--ink)" }}
      >
        {pack.slice(0, 12000)}
      </pre>
    </div>
  );
}
