# Static Asset Investigation — Full Evidence Report

## TASK 1: Process Verification

| Check | Result |
|-------|--------|
| PID | 2563 (node), varies per restart |
| Port | 3000 (LISTEN confirmed via ss -tlnp) |
| Status | Process spawns successfully but dies between bash tool invocations |

Evidence: `ss -tlnp | grep 3000` → `LISTEN 0 511 *:3000 users:("next-server",pid=2563,fd=22)`

## TASK 2: Direct Application Test

```
curl -I http://localhost:3000
  → HTTP/1.1 200 OK
  → Content-Type: text/html; charset=utf-8
  → X-Powered-By: Next.js
  → Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'
  → link preload for 2 woff2 fonts
```

## TASK 3: Static Asset Delivery (Browser Verification)

ALL 23 JS chunks + 1 CSS + 2 fonts returned HTTP 200 when server was alive.

Sample from network log:
```
GET /_next/static/chunks/%5Broot-of-the-server%5D__0f0ba101._.css         200
GET /_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_..._.js    200
GET /_next/static/chunks/node_modules_next_dist_compiled_react-dom_..._.js 200
GET /_next/static/chunks/node_modules_next_dist_client_17643121._.js       200
GET /_next/static/chunks/_a0ff3932._.js                                    200
GET /_next/static/chunks/src_app_page_tsx_b4090435._.js                    200
GET /_next/static/media/797e433ab948586e-s.p.29207c2f.woff2                200
GET /_next/static/media/caa3a2e1cccd8315-s.p.3b6cae6d.woff2                200
```

Zero console errors. Zero failed network requests.

## TASK 4: Build Artifacts on Disk

```
find .next/static -type f | wc -l
→ 0
```

.next/static/chunks/ and .next/static/media/ are EMPTY on disk. This is NORMAL
for Turbopack dev mode. Turbopack compiles and serves chunks entirely from memory.

## TASK 5: Server Logs During Chunk Requests

When requesting a chunk while server is alive: no log entry (served silently).
When server is dead: curl returns HTTP 000 (connection refused).

## TASK 6: Routing/Proxy/Configuration Audit

### 6a. Middleware — NOT intercepting /_next/*
Matcher: ["/admin/:path*", "/customer/:path*"] only.

### 6b. next.config.ts — No incorrect assetPrefix/basePath
No assetPrefix, no basePath set. Only security headers and standalone output.

### 6c. CSP Headers — Allow 'self' for scripts/styles
All /_next/static/* assets are same-origin.

### 6d. Reverse Proxy — Correctly proxies to localhost:3000
All requests on port 81 forward to port 3000.
Test: Direct :3000 HTML=200 Chunk=200 | Proxy :81 HTML=200 Chunk=200 (when alive)
Test: Proxy :81 HTML=502 Chunk=502 (when server dead between sessions)

## TASK 7: Root Cause Determination

### Ruled Out:
- Next.js process crash during request — chunks served in <1ms when alive
- Missing chunk files — Turbopack serves from memory (normal for dev)
- Turbopack build failure — all 23 chunks + CSS + fonts return 200
- Middleware interference — matcher only covers /admin/* and /customer/*
- Incorrect assetPrefix/basePath — neither set
- CSP blocking — 'self' covers all /_next/static/*
- Reverse proxy misconfiguration — returns 200 when upstream alive

### Confirmed:
Sandbox process lifecycle — the dev server process is killed by the sandbox
environment between tool invocations. When the proxy tries to forward to
port 3000 and finds no process, it returns 502 Bad Gateway.