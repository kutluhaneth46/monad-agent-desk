# Monad Agent Desk — jury polish redeploy (Windows)
# Assumes repo already exists at $HOME\Projects\monad-agent-desk (git clone or monorepo copy).

$ErrorActionPreference = "Stop"
$Root = Join-Path $HOME "Projects" "monad-agent-desk"
if (-not (Test-Path $Root)) {
  Write-Error "Expected repo at $Root — clone https://github.com/kutluhaneth46/monad-agent-desk first."
}
Set-Location $Root

Write-Host "== pull latest ==" -ForegroundColor Cyan
git pull origin main

Write-Host "== install & build ==" -ForegroundColor Cyan
if (-not (Test-Path node_modules)) { npm ci } else { npm install }
npm run build

Write-Host "== commit & push ==" -ForegroundColor Cyan
git add -A
git status
git commit -m "Apply Monad jury polish redeploy" -ErrorAction SilentlyContinue
git push -u origin main

Write-Host "== vercel prod ==" -ForegroundColor Cyan
vercel --prod --yes

Write-Host ""
Write-Host "DONE" -ForegroundColor Green
Write-Host "Live: https://monad-agent-desk.vercel.app"
