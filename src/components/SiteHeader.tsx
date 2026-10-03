"use client";

import Image from "next/image";

const GITHUB = "https://github.com/kutluhaneth46/monad-agent-desk";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ borderColor: "var(--line)", background: "var(--header-bg)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
        <a href="#top" className="flex items-center gap-3 no-underline">
          <Image
            src="/logo.png"
            alt="Monad Agent Desk logo"
            width={40}
            height={40}
            className="rounded-xl"
            priority
          />
          <div className="leading-tight">
            <p
              className="text-sm font-semibold tracking-tight md:text-base"
              style={{ color: "var(--ink)", fontFamily: "var(--display)" }}
            >
              Monad Agent Desk
            </p>
            <p
              className="hidden font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] uppercase sm:block"
              style={{ color: "var(--muted)" }}
            >
              Metropolis · Trust &amp; AI
            </p>
          </div>
        </a>

        <nav
          className="order-3 flex w-full items-center justify-center gap-5 text-xs font-semibold tracking-[0.14em] md:order-none md:w-auto md:text-[11px]"
          style={{ color: "var(--ink)" }}
        >
          <a href="#desk" className="opacity-80 transition hover:opacity-100">
            Desk
          </a>
          <a href="#evidence" className="opacity-80 transition hover:opacity-100">
            Proof
          </a>
          <a href="#trust" className="opacity-80 transition hover:opacity-100">
            Trust
          </a>
          <a href="#about" className="opacity-80 transition hover:opacity-100">
            About
          </a>
        </nav>

        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold no-underline transition hover:brightness-110"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
