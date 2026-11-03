# 前端工程说明

羽翼守望者（qimo）的**前端**，从原 Spring Boot 工程的 `src/main/resources/static` 整体迁出。

它现在是一个**不依赖任何构建工具、不需要 npm install 的静态站点**：一堆 HTML/CSS/JS/图片，
外加一层"后端在哪"的配置。你可以用任何静态服务器把它发出去。

---

## 1. 目录结构

```
qimo-frontend/
├── index.html                  ← 首页（原 main.html）
├── main.html                   ← 兼容跳板：老地址 /main.html 自动带 hash 跳到 index.html
├── config/
│   └── api-base.js             ★ 唯一决定"后端在哪"的地方
├── app/
│   └── api.js                  ★ 统一 API 客户端（QIMO_API）
├── css/
│   └── main.css
├── js/
│   ├── main.js                 首页交互动画
│   ├── auth-modal.js           登录/注册模态框 + 导航栏登录态
│   └── bird-interact.js        鸟类详情页的打卡/收藏/评论
├── html/
│   ├── habitat/                8 个栖息地页
│   ├── Bird-Atlas/             鸟类图鉴（多样性 / 生态价值）
│   ├── Protection-Action/      保护行动
│   └── user/                   个人中心 / 观鸟日记 / 排行榜
├── image/                      全部配图（约 170 MB）
├── server.mjs                  零依赖静态服务器 + 接口反向代理
├── qimo.config.json            端口 / 代理 / 后端地址
└── tools/verify.mjs            自检脚本
```

---

## 2. 跑起来（本地开发）

前置：装了 Node 18+。**不需要 `npm install`**，这个工程没有任何 npm 依赖。

```powershell
cd D:\modify\qimo-frontend
node server.mjs
# 然后打开 http://127.0.0.1:5173/index.html
```

`server.mjs` 默认做两件事：

1. 把当前目录当静态站点发出去；
2. 把 `/api/**` 反向代理到 `http://localhost:8080`（后端）。

**代理是关键**：浏览器眼里前后端同源，所以 Session Cookie 完全不用额外配置。
先用这个方式把整条链路跑通，再去折腾跨源。

后端不在本机时：

```powershell
node server.mjs --api http://192.168.1.8:8080
```

换端口：

```powershell
node server.mjs --port 3000
```

也可以用 `qimo.config.json` 固定这些参数：

```json
{
  "port": 5173,
  "host": "127.0.0.1",
  "proxyPrefix": "/api",
  "apiBase": "http://localhost:8080"
}
```

---

## 3. 后端地址怎么配（`config/api-base.js`）

这是分离改造里最核心的一个文件。三种方式，优先级从高到低：

| 方式 | 怎么做 | 适用场景 |
|---|---|---|
| 运行时覆盖 | 浏览器控制台 `localStorage.setItem('QIMO_API_BASE','http://192.168.1.8:8080')` 后刷新 | 临时调试、换机器演示 |
| 改默认值 | 编辑 `config/api-base.js` 里的 `defaultBase` | 固定部署 |
| 保持留空 | 什么都不做，`defaultBase = ''` 表示**同源** | 反向代理部署（生产推荐） |

留空（同源）是最省事的做法，因为 `server.mjs` 已经帮你把 `/api` 代理过去了，
Nginx 部署时也可以用 `location /api/ { proxy_pass http://127.0.0.1:8080; }` 达到同样效果。

### 所有请求都走 `QIMO_API`

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

`app/api.js` 里做了四件原来没人做的事：

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

会检查 7 类问题：HTML 引用的资源是否存在、内链目标是否存在、每个页面是否加载了 API 配置层、
是否还有裸 `fetch('/api/...')`、是否残留 `/html/...` 这类根路径、JS 语法能否解析、
是否残留 Windows 反斜杠路径。**搬家类改造最怕"某一页漏了一处"，这个脚本就是拿来兜这个的。**

---

## 5. 部署

### 方式一：Nginx 同域（推荐）

```nginx
server {
    listen 80;
    server_name bird.example.com;
    root /var/www/qimo-frontend;      # 把本工程整个目录传上去即可
    index index.html;

    location / {
        try_files $uri $uri/ =404;
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

1. `config/api-base.js` 里 `defaultBase` 指向后端完整地址；
2. 后端 `application.properties` 的 `app.cors.allowed-origins` 包含前端来源（精确写，不能 `*`）；
3. 后端 Cookie 能跨站：`server.servlet.session.cookie.same-site=none` + `cookie.secure=true`，
   并且**整个链路必须是 HTTPS**（`SameSite=None` 配 HTTP 会被浏览器直接丢掉）。

第 3 条是真正麻烦的地方，所以生产环境一般选方式一。

### 方式三：直接双击 HTML

**不行**。用 `file://` 打开时 `fetch` 会因为跨源被浏览器拦掉，而且 `config/api-base.js` 里的
同源假设也不成立。请至少用 `server.mjs` 或 `python -m http.server` 起一个静态服务器。

---

## 6. 从原工程过来的对照表

| 原来 | 现在 |
|---|---|
| `src/main/resources/static/main.html` | `index.html` |
| `src/main/resources/static/html/**` | `html/**`（层数不变，所以页内相对链接不用改） |
| `src/main/resources/static/{css,js,image}/**` | 同名目录 |
| `src/main/resources/static/js/auth-modal.js` 里 `/css/auth-modal.css` | 相对路径（支持部署到子路径） |
| 导航下拉里的 `/html/user/profile.html` | `profile.html`（同目录相对路径） |
| 全站 `main.html` 链接 | `index.html`（`main.html` 保留为跳板） |
| `href="html\habitat\forest.html"` 反斜杠 | `href="html/habitat/forest.html"` |
| 页面里的 `fetch('/api/...')` | `QIMO_API.get/post/put/del(...)` |

原工程 `src/main/` 下还有一份 `html/ css/ js/ image/` 的**旧副本**（早于 `resources/static` 的版本，
文件更小、内容更旧），没有被 Spring Boot 伺服，因此**没有搬过来**。它们只存在于原工程里，
随时可以删。
