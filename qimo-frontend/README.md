# 前端工程说明

羽翼守望者（qimo）的**前端**，从原 Spring Boot 工程迁出后重构为 Vue 3 + Vite 应用。
首页、图鉴交互、登录注册、个人档案、日记和排行榜由 Vue 管理；原有鸟类与保护知识文章作为静态内容页保留。

---

## 1. 目录结构

```
qimo-frontend/
├── index.html                  ← Vue 应用入口
├── src/
│   ├── App.vue                 全局导航、页脚与认证弹窗
│   ├── router.js               保留原首页锚点跳转的 History 路由
│   ├── api.js                  带 Session Cookie 的 API 客户端
│   ├── stores/session.js       Pinia 登录态
│   ├── components/             公用 Vue 组件
│   ├── pages/                  首页、图鉴、档案、日记、排行榜
│   └── style.css               响应式样式
├── public/                     Vite 原样复制到站点根目录的静态文件
│   ├── html/                   旧版鸟类 / 栖息地 / 保护知识文章
│   ├── image/                  图片资源
│   ├── css/、js/               旧静态页面依赖
│   ├── app/、config/           旧静态页 API 客户端与配置
│   └── main.html               旧首页地址兼容跳板
├── vite.config.js              Vue 插件与 API 开发代理
├── package.json                Vue / Vite 工程脚本
├── server.mjs                  构建产物静态服务器 + 接口反向代理
├── qimo.config.json            端口 / 代理 / 后端地址
└── tools/verify.mjs            自检脚本
```

`src/` 只放 Vue 应用代码；历史静态页面与其依赖统一放在 `public/`。Vite 会将 `public/` 内容原样复制到构建产物根目录，所以现有 `/html/...`、`/image/...` 地址保持不变。

---

## 2. 跑起来（本地开发）

前置：Node 18+。

```powershell
cd qimo-frontend
npm install
npm run dev
# 打开 http://127.0.0.1:5173/
```

Vite 将 `/api/**` 代理到 `http://localhost:8080`，浏览器和 API 同源，Session Cookie 可以正常工作。
如果后端地址不同，修改 `qimo.config.json` 的 `apiBase`。

生产构建和本地预览：

```powershell
npm run build
npm run preview
```

```json
{
  "port": 5173,
  "host": "127.0.0.1",
  "proxyPrefix": "/api",
  "apiBase": "http://localhost:8080"
}
```

---

## 3. 后端地址怎么配

Vue 页面在 `src/api.js` 中统一发起请求，默认走同源 `/api`，开发与预览由 Vite/静态服务器代理。
原有静态文章页仍使用 `public/config/api-base.js` 与 `public/app/api.js`。

需要跨源直连时，可在启动 Vite 前设置 `VITE_API_BASE`，并同步配置后端 CORS 与 Cookie：

| 方式 | 怎么做 | 适用场景 |
|---|---|---|
| 开发代理（默认） | `qimo.config.json` 中 `apiBase` 留空 | 本机开发 |
| 指定后端 | `qimo.config.json` 填 `http://主机:8080` | 开发代理到其他后端 |
| 跨源直连 | 设置 `VITE_API_BASE` | 前后端分域部署 |

同源代理是最省事的方式。Nginx 部署时也可以用 `location /api/ { proxy_pass http://127.0.0.1:8080; }`。

### Vue API 客户端与历史静态页

改造后，页面里不再出现裸的 `fetch('/api/...')`：

```js
// 以前（依赖"页面由后端发出"这个前提）
fetch('/api/social/checkins', { credentials: 'same-origin' })

// 现在
QIMO_API.get('/api/social/checkins')
QIMO_API.post('/api/social/checkin', { birdName })
QIMO_API.del('/api/social/favorite', { birdName })
QIMO_API.put('/api/user/profile', { nickname, bio })
QIMO_API.auth.me()
```

Vue 页面通过 `src/api.js` 统一处理 JSON、Session Cookie、401 和网络错误。保留下来的历史静态文章页继续用 `public/app/api.js` 的 `QIMO_API`。

历史页 API 层还负责：

- **地址统一拼接**：换后端只改一个地方；
- **`credentials: 'include'`**：跨源时 Cookie 才会带上，否则后端永远认为你没登录；
- **错误归类**：给错误对象挂上 `status` / `unauthorized` / `network`，页面能区分
  "未登录"和"后端没起来"；
- **兜底拦截器**：万一还有漏网的 `fetch('/api/...')`，会被自动改写到配置的后端地址，
  不会静默打到前端静态服务器上变成 404。

---

## 4. 自检

```powershell
node tools/verify.mjs
```

会检查 Vue 工程依赖、路由和 API 客户端、旧知识页与静态资源是否保留；Vue 单文件组件再由 `npm run build` 编译校验。

---

## 5. 部署

### 方式一：Nginx 同域（推荐）

```nginx
server {
    listen 80;
    server_name bird.example.com;
    root /var/www/qimo-frontend/dist; # 先执行 npm run build，再部署 dist
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 同源反向代理，Cookie 不需要任何跨源设置
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 方式二：前后端不同域（真跨源）

前端（任意静态服务器）+ 后端（8080）分别部署，此时必须三件事同时满足，缺一个就一直"未登录"：

1. 构建时通过 `VITE_API_BASE` 配置后端完整地址；
2. 后端 `application.properties` 的 `app.cors.allowed-origins` 包含前端来源（精确写，不能 `*`）；
3. 后端 Cookie 能跨站：`server.servlet.session.cookie.same-site=none` + `cookie.secure=true`，
   并且**整个链路必须是 HTTPS**（`SameSite=None` 配 HTTP 会被浏览器直接丢掉）。

第 3 条是真正麻烦的地方，所以生产环境一般选方式一。

### 方式三：直接双击 HTML

**不行**。用 `file://` 打开时 Vue 模块和 `fetch` 都不能正常工作。请执行 `npm run dev`，或构建后运行 `npm run preview`。

---

## 6. 从原工程过来的对照表

| 原来 | 现在 |
|---|---|
| `src/main/resources/static/main.html` | Vue SPA `index.html` |
| `src/main/resources/static/html/**` | `public/html/**`（发布后仍位于站点 `/html/**`） |
| `src/main/resources/static/{css,js,image}/**` | `public/{css,js,image}/**`（发布 URL 不变） |
| `src/main/resources/static/js/auth-modal.js` 里 `/css/auth-modal.css` | 相对路径（支持部署到子路径） |
| 导航下拉里的 `/html/user/profile.html` | `profile.html`（同目录相对路径） |
| 全站 `main.html` 链接 | `index.html`（`main.html` 保留为跳板） |
| `href="html\habitat\forest.html"` 反斜杠 | `href="html/habitat/forest.html"` |
| 页面里的 `fetch('/api/...')` | `QIMO_API.get/post/put/del(...)` |

原工程 `src/main/` 下还有一份 `html/ css/ js/ image/` 的**旧副本**（早于 `resources/static` 的版本，
文件更小、内容更旧），没有被 Spring Boot 伺服，因此**没有搬过来**。它们只存在于原工程里，
随时可以删。
