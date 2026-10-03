export type MonadCallResult = {
  ok: boolean;
  mode: "live" | "mock";
  endpoint: string;
  url: string;
  params: Record<string, unknown>;
  status: number;
  data: unknown;
  error?: string;
  fetchedAt: string;
};

const DEFAULT_RPC = "https://testnet-rpc.monad.xyz";
export const MONAD_TESTNET_CHAIN_ID = 10143;

export function resolveRpcUrl(): string {
  return process.env.MONAD_RPC_URL?.trim() || DEFAULT_RPC;
}

export function resolveMode(): "live" | "mock" {
  return process.env.MONAD_FORCE_MOCK === "1" ? "mock" : "live";
}

type RpcResponse = {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
};

async function mockResult(
  method: string,
  params: unknown[],
): Promise<MonadCallResult> {
  const fixtures: Record<string, unknown> = {
    eth_chainId: "0x279f",
    eth_blockNumber: "0x1e8480",
    eth_gasPrice: "0x3b9aca00",
    eth_getBalance: "0xde0b6b3a7640000",
    eth_getCode: "0x",
    eth_clientVersion: "monad-mock/0.15.2",
    web3_clientVersion: "monad-mock/0.15.2",
  };

  return {
    ok: true,
    mode: "mock",
    endpoint: method,
    url: "mock://monad",
    params: { method, params },
    status: 200,
    data: fixtures[method] ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function monadRpc(
  method: string,
  params: unknown[] = [],
): Promise<MonadCallResult> {
  const fetchedAt = new Date().toISOString();
  const url = resolveRpcUrl();
  const mode = resolveMode();

  if (mode === "mock") {
    return mockResult(method, params);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
      cache: "no-store",
    });

    const json = (await res.json()) as RpcResponse;
    if (!res.ok || json.error) {
      return {
        ok: false,
        mode: "live",
        endpoint: method,
        url,
        params: { method, params },
        status: res.status,
        data: json,
        error: json.error?.message || `HTTP ${res.status}`,
        fetchedAt,
      };
    }

    return {
      ok: true,
      mode: "live",
      endpoint: method,
      url,
      params: { method, params },
      status: res.status,
      data: json.result,
      fetchedAt,
    };
  } catch (e) {
    if (process.env.MONAD_FORCE_LIVE !== "1") {
      const mocked = await mockResult(method, params);
      return {
        ...mocked,
        error: `live RPC unreachable, mock fallback: ${e instanceof Error ? e.message : "fetch failed"}`,
      };
    }
    return {
      ok: false,
      mode: "live",
      endpoint: method,
      url,
      params: { method, params },
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : "RPC request failed",
      fetchedAt,
    };
  }
}

export function hexToNumber(hex: unknown): number {
  if (typeof hex !== "string") return 0;
  try {
    return Number(BigInt(hex));
  } catch {
    return 0;
  }
}

export function weiHexToMon(hex: unknown): string {
  if (typeof hex !== "string") return "0";
  try {
    const wei = BigInt(hex);
    const eth = BigInt("1000000000000000000");
    const whole = wei / eth;
    const frac = wei % eth;
    const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return "0";
  }
}
