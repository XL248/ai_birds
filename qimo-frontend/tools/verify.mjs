/**
 * 羽翼守望者 · 前端自检
 * =====================================================================
 * 前后端分离最容易出的问题不是"代码写错"，而是"有一处路径/引用没跟着搬家"，
 * 这种问题在页面上往往表现成"某个按钮点了没反应"，很难靠肉眼找。
 * 这个脚本把所有能静态验证的东西一次查完：
 *
 *   1. 每个 HTML 引用的本地 css/js/image 是否真的存在
 *   2. 每个 HTML 内链的 .html 目标是否存在
 *   3. 是否每个页面都加载了 config/api-base.js 与 app/api.js
 *   4. 是否还有 fetch('/api/...') 直接调用（应该全部走 QIMO_API）
 *   5. 是否还残留 '/html/...' 这类根路径引用（分离后部署在子路径会失效）
 *   6. 所有 js/*.js 与 app/*.js 语法是否可解析
 *   7. 是否残留 Windows 反斜杠路径
 *
 * 用法：node tools/verify.mjs [frontendRoot]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const ROOT = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)))

let failures = 0
let checks = 0
function ok(label) {
  checks++
  console.log('  ok   ' + label)
}
function fail(label, detail) {
  checks++
  failures++
  console.log('  FAIL ' + label + (detail ? ' :: ' + detail : ''))
}
function check(label, condition, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}
function section(title) {
  console.log('')
  console.log('# ' + title)
}

function walk(dir, filter, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'tools' || name === 'dist') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, filter, out)
    else if (filter(full)) out.push(full)
  }
  return out
}

const rel = (file) => file.slice(ROOT.length + 1).replace(/\\/g, '/')
const htmlFiles = walk(ROOT, (f) => f.toLowerCase().endsWith('.html'))
const jsFiles = walk(ROOT, (f) => /\.(js|mjs)$/i.test(f))

section('工程结构')
check('index.html 存在（首页）', existsSync(join(ROOT, 'index.html')))
if (existsSync(join(ROOT, 'index.html'))) {
  const home = readFileSync(join(ROOT, 'index.html'), 'utf8')
  check('index.html 是 Vue 应用入口', home.includes('id="app"') && home.includes('/src/main.js'))
  check('index.html 不是旧兼容跳转页', !home.includes('location.replace'))
}
check('main.html 兼容跳板存在', existsSync(join(ROOT, 'main.html')))
if (existsSync(join(ROOT, 'main.html'))) {
  const stub = readFileSync(join(ROOT, 'main.html'), 'utf8')
  check('main.html 是跳板（带 hash 转发）', stub.includes("location.replace('index.html'"))
}
check('config/api-base.js 存在', existsSync(join(ROOT, 'config', 'api-base.js')))
check('app/api.js 存在', existsSync(join(ROOT, 'app', 'api.js')))
check('server.mjs 存在', existsSync(join(ROOT, 'server.mjs')))
check('Vue 入口与路由存在', existsSync(join(ROOT, 'src', 'main.js')) && existsSync(join(ROOT, 'src', 'router.js')))
check('Vue 用户页已迁移', ['HomePage.vue', 'BirdCatalogPage.vue', 'BirdDetailPage.vue', 'ProfilePage.vue', 'DiaryPage.vue', 'LeaderboardPage.vue']
  .every((name) => existsSync(join(ROOT, 'src', 'pages', name))))
const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
check('Vue / Pinia / Vue Router 依赖已配置', ['vue', 'pinia', 'vue-router'].every((name) => packageJson.dependencies?.[name]))
check('Vite 开发和生产构建脚本已配置', Boolean(packageJson.scripts?.dev && packageJson.scripts?.build))
check('没有残留 static/ 目录', !existsSync(join(ROOT, 'static')))
console.log('  -- 共 ' + htmlFiles.length + ' 个 HTML，' + jsFiles.length + ' 个 JS 文件')

section('HTML 引用完整性')
const missingAssets = []
const missingPages = []
const rootPathRefs = []
const backslashRefs = []
const missingApiLayer = []
const apiLiteralFetches = []

for (const file of htmlFiles) {
  const text = readFileSync(file, 'utf8')
  const dir = file.slice(0, file.lastIndexOf('\\') >= 0 ? file.lastIndexOf('\\') : file.lastIndexOf('/'))

  // 反斜杠路径
  for (const match of text.matchAll(/(?:href|src)="([^"]*\\[^"]*)"/g)) {
    backslashRefs.push(rel(file) + ' -> ' + match[1])
  }

  // 根路径引用（排除外链、锚点、以及我们自己的 /api 字面量检查）
  for (const match of text.matchAll(/(?:href|src)="(\/(?:html|css|js|image|app|config)\/[^"]*)"/g)) {
    rootPathRefs.push(rel(file) + ' -> ' + match[1])
  }

  // 直接 fetch('/api/...')
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    if (/fetch\(\s*['"`]\/api\//.test(line)) {
      apiLiteralFetches.push(rel(file) + ':' + (index + 1))
    }
  })

  // 本地资源是否存在
  const head = text.slice(0, text.indexOf('</head>') + 8)
  for (const match of head.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1]
    if (/^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(value) || value.startsWith('data:')) continue
    if (value.startsWith('/') || value.startsWith('#')) continue
    const target = resolve(dir, value.split('#')[0].split('?')[0])
    if (!existsSync(target)) missingAssets.push(rel(file) + ' -> ' + value)
  }

  // 内链页面是否存在
  for (const match of text.matchAll(/href="([^"#?]+\.html)(?:[#?][^"]*)?"/g)) {
    const value = match[1]
    if (/^https?:/i.test(value)) continue
    const target = resolve(dir, value)
    if (!existsSync(target)) missingPages.push(rel(file) + ' -> ' + value)
  }

  // API 层是否加载（main.html 只是兼容跳板，不做接口调用，不要求它加载）
  const relativeFile = rel(file)
  const isAppShell = relativeFile === 'main.html' || relativeFile === 'index.html'
  if (!isAppShell && (!text.includes('config/api-base.js') || !text.includes('app/api.js'))) {
    missingApiLayer.push(rel(file))
  }
}

check('没有 Windows 反斜杠路径', backslashRefs.length === 0, backslashRefs.slice(0, 5).join(' | '))
check('没有 /html|css|js|image 根路径引用', rootPathRefs.length === 0, rootPathRefs.slice(0, 5).join(' | '))
check('所有 HTML 头部引用的资源都存在', missingAssets.length === 0, missingAssets.slice(0, 8).join(' | '))
check('所有内部 .html 链接都有对应文件', missingPages.length === 0, missingPages.slice(0, 8).join(' | '))
check('所有页面都加载了 API 配置层', missingApiLayer.length === 0, missingApiLayer.slice(0, 8).join(' | '))
check('没有 fetch(\'/api/...\') 残留', apiLiteralFetches.length === 0, apiLiteralFetches.slice(0, 8).join(' | '))

section('JS 语法')
// ESM imports are checked by Node; Vue templates are checked by the Vite build.
const browserScripts = jsFiles.filter((f) => !/server\.mjs$/i.test(f) && !f.includes('tools'))
let syntaxFailures = 0
for (const file of browserScripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (result.status !== 0) {
    syntaxFailures++
    fail(rel(file), result.stderr.trim())
  }
}
if (syntaxFailures === 0) ok(browserScripts.length + ' 个浏览器端 JS 文件语法均可解析')
if (!browserScripts.some((f) => /server\.mjs$/i.test(f)) && existsSync(join(ROOT, 'server.mjs'))) {
  ok('server.mjs 存在（ESM 语法由 node --check 验证，见 README）')
}

section('API 层自检（把 app/api.js 放进沙箱跑一遍）')
const nativeFetchStub = () =>
  Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: () => Promise.resolve({}) })
const sandboxWindow = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  console: { log: () => {} },
  fetch: nativeFetchStub
}
sandboxWindow.window = sandboxWindow
const context = vm.createContext(sandboxWindow)

try {
  vm.runInContext(readFileSync(join(ROOT, 'config', 'api-base.js'), 'utf8'), context, { filename: 'config/api-base.js' })
  vm.runInContext(readFileSync(join(ROOT, 'app', 'api.js'), 'utf8'), context, { filename: 'app/api.js' })

  const api = sandboxWindow.QIMO_API
  check('QIMO_CONFIG 已注入', sandboxWindow.QIMO_CONFIG !== undefined)
  check('QIMO_API 已注入', api !== undefined)
  check(
    'credentials 默认 include（跨源也要带 Cookie）',
    sandboxWindow.QIMO_CONFIG && sandboxWindow.QIMO_CONFIG.credentials === 'include',
    String(sandboxWindow.QIMO_CONFIG && sandboxWindow.QIMO_CONFIG.credentials)
  )
  check('同源时 url() 原样返回', api.url('/api/health') === '/api/health', api.url('/api/health'))
  check('fetch 被包装（拦截器已装）', sandboxWindow.fetch !== nativeFetchStub)

  // 跨源配置下 url() 是否拼接正确
  sandboxWindow.QIMO_CONFIG.apiBase = 'http://localhost:8080'
  check(
    '跨源时 url() 拼完整地址',
    api.url('/api/health') === 'http://localhost:8080/api/health',
    api.url('/api/health')
  )
  check('跨源时末尾不带双斜杠', api.url('api/health') === 'http://localhost:8080/api/health', api.url('api/health'))
} catch (error) {
  fail('API 层沙箱执行', error.message)
}

console.log('')
console.log(failures === 0 ? '全部通过（' + checks + ' 项）' : failures + '/' + checks + ' 项失败')
process.exit(failures === 0 ? 0 : 1)
