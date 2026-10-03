import {
  hexToNumber,
  monadRpc,
  weiHexToMon,
  type MonadCallResult,
} from "@/lib/monad";
import { issueTrustReceipt, verifyTrustReceipt } from "@/lib/receipt";

export type AgentToolName =
  | "get_chain_id"
  | "get_block_number"
  | "get_gas_price"
  | "get_balance"
  | "get_code"
  | "network_briefing"
  | "agent_trust_brief"
  | "issue_trust_receipt"
  | "verify_trust_receipt";

export type AgentTool = {
  name: AgentToolName;
  description: string;
  endpoints: string[];
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
};

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "get_chain_id",
    description: "Return Monad chain id from eth_chainId.",
    endpoints: ["eth_chainId"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_block_number",
    description: "Return latest Monad block number.",
    endpoints: ["eth_blockNumber"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_gas_price",
    description: "Return current gas price on Monad.",
    endpoints: ["eth_gasPrice"],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_balance",
    description: "Fetch MON balance for an EVM address on Monad.",
    endpoints: ["eth_getBalance"],
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "0x EVM address",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_code",
    description: "Fetch contract bytecode for an address. Empty means EOA.",
    endpoints: ["eth_getCode"],
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "0x EVM address",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "network_briefing",
    description:
      "Combined Monad network snapshot: chain id, block, gas price, client version.",
    endpoints: [
      "eth_chainId",
      "eth_blockNumber",
      "eth_gasPrice",
      "web3_clientVersion",
    ],
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "agent_trust_brief",
    description:
      "Trust Identity AI track brief: network facts plus agent identity roadmap notes for ERC-8004 style work.",
    endpoints: ["eth_chainId", "eth_blockNumber"],
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "Optional local agent id label",
        },
      },
    },
  },
  {
    name: "issue_trust_receipt",
    description:
      "Issue a SHA-256 agent trust receipt bound to Monad chain id and block tip plus a claim string.",
    endpoints: ["eth_chainId", "eth_blockNumber"],
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "Local agent id label",
        },
        claim: {
          type: "string",
          description: "Human readable trust claim",
        },
      },
    },
  },
  {
    name: "verify_trust_receipt",
    description:
      "Recompute SHA-256 fingerprint for a trust receipt and compare to the provided hash.",
    endpoints: ["eth_blockNumber"],
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Agent id from receipt" },
        chainId: { type: "string", description: "Chain id number as string" },
        blockNumber: {
          type: "string",
          description: "Block number from receipt",
        },
        issuedAt: { type: "string", description: "ISO timestamp from receipt" },
        claim: { type: "string", description: "Claim string from receipt" },
        fingerprint: { type: "string", description: "SHA-256 hex fingerprint" },
      },
      required: [
        "agentId",
        "chainId",
        "blockNumber",
        "issuedAt",
        "claim",
        "fingerprint",
      ],
    },
  },
];

export type ToolRunResult = {
  tool: AgentToolName;
  summary: string;
  evidence: MonadCallResult[];
  payload: unknown;
};

function requireAddress(args: Record<string, string>): string {
  const address = args.address?.trim();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("valid 0x address is required");
  }
  return address;
}

export async function runTool(
  tool: AgentToolName,
  args: Record<string, string> = {},
): Promise<ToolRunResult> {
  switch (tool) {
    case "get_chain_id": {
      const evidence = await monadRpc("eth_chainId", []);
      const id = hexToNumber(evidence.data);
      return {
        tool,
        summary: evidence.ok
          ? `Monad chain id ${id} (${String(evidence.data)}).`
          : `eth_chainId failed: ${evidence.error || "unknown"}`,
        evidence: [evidence],
        payload: { chainId: id, hex: evidence.data },
      };
    }
    case "get_block_number": {
      const evidence = await monadRpc("eth_blockNumber", []);
      const n = hexToNumber(evidence.data);
      return {
        tool,
        summary: evidence.ok
          ? `Latest block ${n}.`
          : `eth_blockNumber failed: ${evidence.error || "unknown"}`,
        evidence: [evidence],
        payload: { blockNumber: n, hex: evidence.data },
      };
    }
    case "get_gas_price": {
      const evidence = await monadRpc("eth_gasPrice", []);
      const gwei = Number(BigInt(String(evidence.data || "0x0"))) / 1e9;
      return {
        tool,
        summary: evidence.ok
          ? `Gas price ~${gwei} gwei.`
          : `eth_gasPrice failed: ${evidence.error || "unknown"}`,
        evidence: [evidence],
        payload: { weiHex: evidence.data, gwei },
      };
    }
    case "get_balance": {
      const address = requireAddress(args);
      const evidence = await monadRpc("eth_getBalance", [address, "latest"]);
      const mon = weiHexToMon(evidence.data);
      return {
        tool,
        summary: evidence.ok
          ? `Balance ${mon} MON for ${address.slice(0, 6)}…${address.slice(-4)}.`
          : `eth_getBalance failed: ${evidence.error || "unknown"}`,
        evidence: [evidence],
        payload: { address, mon, weiHex: evidence.data },
      };
    }
    case "get_code": {
      const address = requireAddress(args);
      const evidence = await monadRpc("eth_getCode", [address, "latest"]);
      const code = String(evidence.data || "0x");
      const isContract = code !== "0x" && code.length > 2;
      return {
        tool,
        summary: evidence.ok
          ? isContract
            ? `Contract bytecode present at ${address.slice(0, 6)}… len=${code.length}.`
            : `EOA or empty code at ${address.slice(0, 6)}…`
          : `eth_getCode failed: ${evidence.error || "unknown"}`,
        evidence: [evidence],
        payload: {
          address,
          isContract,
          codeLength: code.length,
          sample: code.slice(0, 66),
        },
      };
    }
    case "network_briefing": {
      const evidence = await Promise.all([
        monadRpc("eth_chainId", []),
        monadRpc("eth_blockNumber", []),
        monadRpc("eth_gasPrice", []),
        monadRpc("web3_clientVersion", []),
      ]);
      const [chain, block, gas, client] = evidence;
      // web3_clientVersion may 404 on some RPCs; treat soft
      const okCount = evidence.filter((e) => e.ok).length;
      const chainId = hexToNumber(chain.data);
      const blockNumber = hexToNumber(block.data);
      const gwei = Number(BigInt(String(gas.data || "0x0"))) / 1e9;
      return {
        tool,
        summary: `Monad briefing ${okCount}/4 ok. chainId=${chainId}. block=${blockNumber}. gas~${gwei} gwei. client=${String(client.data ?? "n/a")}.`,
        evidence,
        payload: {
          chainId,
          blockNumber,
          gwei,
          client: client.data ?? null,
          rows: [
            { metric: "chainId", value: String(chainId) },
            { metric: "block", value: String(blockNumber) },
            { metric: "gasGwei", value: String(gwei) },
            { metric: "client", value: String(client.data ?? "n/a") },
          ],
        },
      };
    }
    case "agent_trust_brief": {
      const agentId = args.agentId?.trim() || "monad-agent-desk";
      const evidence = await Promise.all([
        monadRpc("eth_chainId", []),
        monadRpc("eth_blockNumber", []),
      ]);
      const [chain, block] = evidence;
      return {
        tool,
        summary: `Agent trust brief for ${agentId} on chain ${hexToNumber(chain.data)} at block ${hexToNumber(block.data)}. Next: register agent identity and reputation primitives for Trust Identity AI track.`,
        evidence,
        payload: {
          agentId,
          track: "Trust, Identity & AI Infrastructure",
          chainId: hexToNumber(chain.data),
          blockNumber: hexToNumber(block.data),
          roadmap: [
            "MCP tool manifest for agent discovery",
            "Onchain aware network evidence",
            "Agent identity / reputation surface ERC-8004 direction",
            "Signed action receipts agents can verify",
          ],
          rows: [
            { metric: "agentId", value: agentId },
            { metric: "chainId", value: String(hexToNumber(chain.data)) },
            { metric: "block", value: String(hexToNumber(block.data)) },
            { metric: "track", value: "Trust Identity AI" },
          ],
        },
      };
    }
    case "issue_trust_receipt": {
      const result = await issueTrustReceipt({
        agentId: args.agentId,
        claim: args.claim,
      });
      return { tool, ...result };
    }
    case "verify_trust_receipt": {
      const result = await verifyTrustReceipt({
        agentId: args.agentId || "",
        chainId: args.chainId || "",
        blockNumber: args.blockNumber || "",
        issuedAt: args.issuedAt || "",
        claim: args.claim || "",
        fingerprint: args.fingerprint || "",
      });
      return { tool, ...result };
    }
    default:
      throw new Error(`Unknown tool: ${tool as string}`);
  }
}

export function routeIntent(prompt: string): {
  tool: AgentToolName;
  args: Record<string, string>;
} {
  const p = prompt.toLowerCase();
  const addr = prompt.match(/0x[a-fA-F0-9]{40}/)?.[0];

  if (p.includes("verify") && (p.includes("receipt") || p.includes("fingerprint"))) {
    return {
      tool: "verify_trust_receipt",
      args: {},
    };
  }
  if (p.includes("receipt") || p.includes("fingerprint") || p.includes("issue trust")) {
    return {
      tool: "issue_trust_receipt",
      args: { agentId: "monad-agent-desk" },
    };
  }
  if (p.includes("trust") || p.includes("identity") || p.includes("agent")) {
    return { tool: "agent_trust_brief", args: { agentId: "monad-agent-desk" } };
  }
  if (addr && p.includes("code")) {
    return { tool: "get_code", args: { address: addr } };
  }
  if (addr && (p.includes("balance") || p.includes("mon"))) {
    return { tool: "get_balance", args: { address: addr } };
  }
  if (addr) {
    return { tool: "get_balance", args: { address: addr } };
  }
  if (p.includes("gas")) return { tool: "get_gas_price", args: {} };
  if (p.includes("chain")) return { tool: "get_chain_id", args: {} };
  if (p.includes("block")) return { tool: "get_block_number", args: {} };
  if (p.includes("brief") || p.includes("network") || p.includes("status")) {
    return { tool: "network_briefing", args: {} };
  }
  return { tool: "network_briefing", args: {} };
}
