# Monad Agent Desk

Monad **Metropolis** project by **KutluhanETH**.

Track: **Trust, Identity & AI Infrastructure**

Open TypeScript agent tooling on Monad: MCP style tool discovery, testnet RPC tools, agent trust brief, SHA-256 trust receipts, and copyable call evidence.

## Run

```bash
cd monad-agent-desk
npm install
npm run dev
```

Open http://127.0.0.1:43175

Optional `.env.local`:

```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
# MONAD_FORCE_MOCK=1
```

Live RPC falls back to mock fixtures if the endpoint is unreachable unless `MONAD_FORCE_LIVE=1`.

## Tools

| Tool | RPC / behavior |
|---|---|
| `get_chain_id` | eth_chainId |
| `get_block_number` | eth_blockNumber |
| `get_gas_price` | eth_gasPrice |
| `get_balance` | eth_getBalance |
| `get_code` | eth_getCode |
| `network_briefing` | chain + block + gas + client |
| `agent_trust_brief` | chain + block + identity roadmap |
| `issue_trust_receipt` | chain + block → SHA-256 receipt fingerprint |
| `verify_trust_receipt` | recompute fingerprint and compare |

Manifest: `GET /api/tools`  
Runner: `POST /api/agent/run`

## Live

- Planned production: https://monad-agent-desk.vercel.app
- Publish from Windows: `PUBLISH_MONAD_PC.ps1` (public GitHub + Vercel)

## Portal

https://hackathon.monad.xyz · submit by **14 Oct 2026 06:59 GMT+3**

Track: Trust, Identity & AI Infrastructure  
Submit pack: `money-ops/career/packs/MONAD_METROPOLIS_SUBMIT.txt` (in the cloud monorepo)
