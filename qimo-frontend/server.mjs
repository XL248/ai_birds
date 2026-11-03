/**
 * 羽翼守望者 · 前端静态服务器 + 接口反向代理（零依赖，只用 Node 内置模块）
 * =====================================================================
 * 前后端分离之后，前端需要"一个人"把它发出去。这个脚本就是那个人：
 *
 *   node server.mjs             # 默认 http://127.0.0.1:5173
 *   node server.mjs --port 3000
 *   node server.mjs --api http://192.168.1.8:8080
 *
 * 两种工作方式，二选一：
 *
 *   A. 代理模式（默认，推荐本地开发）
 *      前端页面发出的 /api/** 请求由本进程转发到后端（默认 http://localhost:8080）。
 *      浏览器眼里前后端同源，因此 Cookie 与会话完全不用额外配置。
 *
 *   B. 直连模式（--no-proxy）
 *      不代理，页面直接把请求打到 config/api-base.js 里配的地址。
 *      这才是"真正跨源"的形态，需要后端开 CORS + Cookie 带 SameSite=None; Secure。
 *
 * 配置也可以写在同目录的 qimo.config.json 里，命令行参数优先级更高。
 * =====================================================================
 */
import { createServer, request as httpRequest } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DIST = join(ROOT, 'dist')
const STATIC_ROOT = existsSync(join(DIST, 'index.html')) ? DIST : ROOT

function argOf(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined
}

/** 空串与 null 都算"没配"，回退到默认值。 */
function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return undefined
}

const configPath = join(ROOT, 'qimo.config.json')
const fileConfig = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {}

const port = Number(firstNonEmpty(argOf('--port'), fileConfig.port, 5173))
const host = firstNonEmpty(argOf('--host'), fileConfig.host, '127.0.0.1')
// 空串表示"没指定后端"，此时回退到本机 8080，代理模式才开箱可用。
const apiBase = String(firstNonEmpty(argOf('--api'), fileConfig.apiBase, 'http://localhost:8080')).replace(/\/+$/, '')
const proxyPrefix = firstNonEmpty(fileConfig.proxyPrefix, '/api')
const proxyEnabled = !process.argv.includes('--no-proxy')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
}

/** 把一次请求转发给后端，并把响应原样搬回来（包括 Set-Cookie）。 */
function proxy(req, res) {
  const target = new URL(req.url, apiBase)
  const headers = Object.assign({}, req.headers)
  headers.host = target.host
  headers['x-forwarded-host'] = req.headers.host ?? ''
  headers['x-forwarded-proto'] = 'http'

  const upstream = httpRequest(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
      upstreamRes.pipe(res)
    }
  )

  upstream.on('error', (error) => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        success: false,
        message: '代理失败：连不上后端 ' + apiBase + '（' + error.code + '）。请确认后端已启动。'
      })
    )
  })

  req.pipe(upstream)
}

/** 把一个静态文件发出去。目录请求补 index.html。 */
function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (urlPath.endsWith('/')) urlPath += 'index.html'

  const relative = normalize(urlPath).replace(/^([/\\])+/, '')
  let filePath = resolve(STATIC_ROOT, relative)

  // 目录穿越防护：解析后必须还在 ROOT 之内
  if (filePath !== STATIC_ROOT && !filePath.startsWith(STATIC_ROOT + sep)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('403 越界访问')
    return
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
    res.end(
      '<!doctype html><meta charset="utf-8"><title>404</title>' +
        '<body style="font-family:system-ui;padding:40px">' +
        '<h1>404</h1><p>没有这个文件：<code>' +
        urlPath.replace(/[<>&]/g, '') +
        '</code></p><p><a href="/index.html">回首页</a></p>'
    )
    return
  }

  res.writeHead(200, {
    'content-type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-cache'
  })
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  if (proxyEnabled && (req.url ?? '').startsWith(proxyPrefix + '/')) {
    proxy(req, res)
    return
  }
  serveStatic(req, res)
})

server.listen(port, host, () => {
  console.log('')
  console.log('  羽翼守望者 · 前端已启动')
  console.log('  ------------------------------------------------------------')
  console.log('  页面地址 : http://' + host + ':' + port + '/index.html')
  console.log('  静态根   : ' + STATIC_ROOT)
  if (proxyEnabled && apiBase !== '') {
    console.log('  接口模式 : 代理  ' + proxyPrefix + '/**  ->  ' + apiBase)
  } else {
    console.log('  接口模式 : 直连  由 config/api-base.js 决定后端地址')
  }
  console.log('  ------------------------------------------------------------')
  console.log('  按 Ctrl+C 停止')
  console.log('')
})
