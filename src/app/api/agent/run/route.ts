import { NextResponse } from "next/server";
import {
  AGENT_TOOLS,
  routeIntent,
  runTool,
  type AgentToolName,
} from "@/lib/tools";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      prompt?: string;
      tool?: AgentToolName;
      args?: Record<string, string>;
    };

    let tool = body.tool;
    let args = body.args || {};

    if (!tool && body.prompt) {
      const routed = routeIntent(body.prompt);
      tool = routed.tool;
      args = { ...routed.args, ...args };
    }

    if (!tool || !AGENT_TOOLS.some((t) => t.name === tool)) {
      return NextResponse.json(
        { ok: false, error: "Unknown or missing tool" },
        { status: 400 },
      );
    }

    const result = await runTool(tool, args);
    return NextResponse.json({
      ok: true,
      prompt: body.prompt || null,
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Agent run failed",
      },
      { status: 500 },
    );
  }
}
