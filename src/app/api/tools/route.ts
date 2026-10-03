import { NextResponse } from "next/server";
import { AGENT_TOOLS } from "@/lib/tools";
import { resolveMode, resolveRpcUrl } from "@/lib/monad";

export async function GET() {
  return NextResponse.json({
    name: "monad-agent-desk",
    track: "Metropolis · Trust, Identity & AI Infrastructure",
    mode: resolveMode(),
    rpc: resolveRpcUrl(),
    protocol: "MCP-compatible tool descriptors for agent workflows",
    tools: AGENT_TOOLS,
  });
}
