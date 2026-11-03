# qimo 前后端分离改造

原项目：`D:\Za_Lei\web模板\qimo`（Spring Boot 单体，页面与接口由同一个进程发出）
改造产物：本目录，分为两个**互相独立、可分别部署**的工程。

```
D:\modify\
├── qimo-frontend\     前端：Vue 3 + Vite（保留原有知识文章与图片）
├── qimo-backend\      后端：Spring Boot，只提供 /api/** 的 JSON 接口
└── README.md          本文件
```

原项目**没有改动一个字节**，仍然完整躺在 `D:\Za_Lei\web模板\qimo`。这里是它的改造副本。

---

## 1. 一句话说清做了什么

改造前，前端页面是后端从 `src/main/resources/static` 一起发出去的，所以前端和 jar 绑死在
同一台 8080 上——`fetch('/api/...')` 能用，只因为"页面和后端同源"这个隐含前提成立。

改造后：

- **前端**搬进 `qimo-frontend` 并重构为 Vue 3 应用，生产构建后可用 Nginx / CDN 独立发布；
- **后端**删掉 `static` 目录，只留 `/api/**`，另外补上跨源必需的 CORS 配置；
- Vue 页面通过 `src/api.js` 统一调用后端；保留的静态文章页继续使用原 API 配置层。

**后端本来就已经是 REST API**（`AuthController` / `UserController` / `SocialController` 全是
`@RestController`，路径都在 `/api` 下），所以这次改造没有重写任何业务代码——Controller、
Service、Mapper、Entity、DTO、建表脚本全部原样保留。

---

## 2. 快速上手（两条命令）

### 后端（需要 JDK 17 + MySQL）

```powershell
cd D:\modify\qimo-backend
mvn spring-boot:run
# 验证：curl http://localhost:8080/api/health
```

> ⚠️ 这台机器的 `JAVA_HOME` 指向 `jdk1.8.0_202`，而 Spring Boot 3.x 要求 17+。
> 编译前先设：`$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"`

### 前端（Node 18+）

```powershell
cd qimo-frontend
npm install
npm run dev
# 打开 http://127.0.0.1:5173/
```

Vite 会把 `/api/**` 反向代理到 `http://localhost:8080`。
浏览器眼里前后端同源，所以 Session Cookie 完全不用额外配置——**先用这个把链路跑通**。

---

## 3. 改造清单（17 个文件新增或改写）

### 后端（7 个）

| 文件 | 改动 |
|---|---|
| `src/main/java/com/eco/bird/qidong.java` | 去掉"启动完自动打开浏览器跳 main.html"；改为打印接口地址 |
| `src/main/java/com/eco/bird/config/CorsConfig.java` | **新增**：`/api/**` 跨源配置，来源可配、允许携带 Cookie |
| `src/main/java/com/eco/bird/config/WebMvcConfiguration.java` | **新增**：`/` → 302 `/api/health`（原来根路径是静态首页） |
| `src/main/java/com/eco/bird/config/SessionConfig.java` | **改写**：清掉一个从未生效的 `connect.sid` 改名 Bean，注明真相 |
| `src/main/java/com/eco/bird/controller/HealthController.java` | **新增**：`/api/health` 存活探针 |
| `src/main/java/com/eco/bird/service/SocialService.java` | **改写**：补完 `getLeaderboard()`（原来恒返回空数组） |
| `src/main/java/com/eco/bird/dto/LeaderboardDTO.java` | **改写**：字段名对齐前端（`checkin_count` / `fav_count`） |
| `src/main/resources/application.properties` | 加 CORS、会话、建表容错配置 |

**删除**：`src/main/resources/static/**` 全部前端产物（317 个文件、约 171 MB），以及
`src/main/` 下那份更旧的 `html/ css/ js/ image/` 副本。

### 前端（9 个新增 + 5 个改写）

新增：

| 文件 | 作用 |
|---|---|
| `config/api-base.js` | **后端地址的唯一入口**（留空 = 同源） |
| `app/api.js` | 统一 API 客户端 `QIMO_API`（地址拼接 / 带 Cookie / 错误分类 / 兜底拦截器） |
| `server.mjs` | 零依赖静态服务器 + `/api` 反向代理 |
| `package.json` / `qimo.config.json` / `.gitignore` | 工程清单与本地配置 |
| `tools/verify.mjs` | 自检脚本（21 项） |
| `README.md` | 前端说明 |
| `main.html` | 兼容跳板（老地址带 hash 跳到 `index.html`） |

改写：

| 文件 | 改动 |
|---|---|
| `index.html`（原 main.html）+ 其余 56 个 HTML | 注入 API 配置层；`main.html`→`index.html`；`/js/...` 根路径→相对路径；`html\habitat\x.html` 反斜杠→正斜杠 |
| `js/auth-modal.js` | 4 处 fetch → `QIMO_API`；CSS 注入改相对路径；导航下拉 `/html/user/*.html` 改相对路径 |
| `js/bird-interact.js` | 8 处 fetch → `QIMO_API`；顺手合并了 `isCheckedIn ? A : A` 的重复分支；本地 `showToast` 改名 `qimoToast` 避免遮蔽 main.js 的同名全局函数 |
| `html/user/profile.html` | 6 处 fetch → `QIMO_API`；`r.status === 401` 判断改为 `error.unauthorized` |
| `html/user/diary.html`、`leaderboard.html` | 共 4 处 fetch → `QIMO_API`（排行榜那处原先连 `credentials` 都没写） |
| `js/main.js` | 首页占位提示不再绑在 `.compare-card` / `.gallery-item` 上（它们是 `<a>`，原先既跳转又弹提示，还会把裸文本节点插进 body） |

---

## 4. 验证结果

### 后端

- ✅ **真编译通过**：`mvn -DskipTests compile` → `BUILD SUCCESS`，29 个源文件，JDK 17
- ✅ **真启动通过**：Tomcat 8080 起来，Hikari 连上 MySQL 8.0.41，Security 过滤器链里能看到 `CorsFilter`
- ✅ `/api/health` → `200 {"success":true,"service":"qimo-backend",...}`
- ✅ `/` → `302 Location: http://127.0.0.1:8080/api/health`
- ✅ 已不再伺服任何页面：`/index.html`、`/main.html`、`/css/main.css`、`/js/*.js` 全部 404
- ✅ **跨源**：`Origin: http://localhost:5173` → `Access-Control-Allow-Origin: http://localhost:5173`
  + `Access-Control-Allow-Credentials: true`
- ✅ **预检**：`OPTIONS /api/auth/login` → 200，`Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`，`Max-Age: 3600`
- ✅ **未授权来源被拒**：`Origin: http://evil.example.com` → 403

### 端到端业务流（数据库起来后真跑的，共 31 项断言）

用一个临时账号走完整流程，跑完已清理（只删自己的数据，你原有的 5 个用户 / 11 条打卡 /
2 条收藏 / 12 条评论一条没动）：

| 流程 | 结果 |
|---|---|
| 注册 → 登录 | ✅ 200，中文提示无乱码 |
| **会话 Cookie 跨请求保持** | ✅ `GET /api/auth/me` → `{"loggedIn":true,"username":"..."}` |
| 用户资料 | ✅ 返回 id / username / createdAt |
| 打卡 → 查状态 → 列列表 | ✅ `checkedIn` 由 false 变 true，鸟名"杜鹃属"存取均正确 |
| 收藏 → 查状态 → 列列表 | ✅ `favorited=true` |
| 评论 → 按鸟名取回 | ✅ 中文内容完整 |
| 日记 → 列表 | ✅ 标题/鸟名中文完整，分页字段正常 |
| 排行榜 | ✅ 返回真实数据（`xxx` 打卡 10、收藏 2 排第一） |
| 取消打卡 / 取消收藏（DELETE 带 body） | ✅ |
| 退出登录 → 再查会话 | ✅ `loggedIn=false` |

### 前端

- ✅ `node tools/verify.mjs` → **全部通过（24 项）**，覆盖：资源引用完整性、内链目标存在、
  每个页面都加载 API 配置层、无裸 `fetch('/api/...')`、无 `/html|css|js|image` 根路径、
  无 Windows 反斜杠、浏览器端 JS 语法、首页完整性（必须是真首页而不是跳转页）、
  API 层沙箱行为（同源/跨源地址拼接、credentials 默认值）
- ✅ **真起服务器验证**：`index.html`、`css/main.css`、`config/api-base.js`、`app/api.js`、
  `js/auth-modal.js`、深层页 `html/user/profile.html`、图片 `image/koshi.png`、兼容跳板 `main.html` 全部 200；不存在的文件正确 404
- ✅ **端到端经代理**：`http://127.0.0.1:5173/api/health` → 后端 JSON；
  `http://127.0.0.1:5173/api/auth/me` → `{"loggedIn":false}`

### 仍然没能验证的

- ⚠️ **没有跑过真实浏览器**（这个环境里没有可自动化的浏览器）。上面所有验证都是 HTTP 请求 +
  静态检查做的：能证明"接口都对、字段都对、文件都在、CORS 会说人话"，
  但**证明不了"页面上点下去没有 JS 运行时错误"**。请在浏览器里过一遍，控制台有报错就发我。

### 顺带修掉的两个原有 bug

跑端到端时撞出来的，**都不是分离改造引入的**，详见后端 README 第 4.5 节：

1. **`SocialService.getLeaderboard()` 是个空实现**——库里明明有 10 条打卡，接口永远返回 `[]`，
   排行榜页面永远显示"还没有数据"。
2. **`LeaderboardDTO` 字段名与前端对不上**——后端发 `checkinCount`，前端读 `checkin_count`，
   所以就算 bug 1 修好了，那一列仍然空白。

另外实测发现 **Cookie 名是 `JSESSIONID` 而不是 `connect.sid`**：`pom.xml` 里只有
`spring-session-core`（接口层，不接管会话），`SessionConfig` 里那个改名 Bean 从未生效。
已清掉并写进后端 README 第 8 节。

---

## 5. 后端地址怎么配（最常问的一个）

只改一个文件：`qimo-frontend/config/api-base.js`

| 场景 | 怎么配 |
|---|---|
| 用 `server.mjs` 本地开发（推荐） | 什么都不用改，`defaultBase` 留空 = 同源，代理帮你转 |
| Nginx 同域部署（生产推荐） | 留空，Nginx 里 `location /api/ { proxy_pass http://127.0.0.1:8080; }` |
| 前后端不同域 | `defaultBase = 'http://你的后端:8080'`，并同步改后端 `app.cors.allowed-origins` |
| 临时换个后端演示 | 浏览器控制台 `localStorage.setItem('QIMO_API_BASE','http://192.168.1.8:8080')` 后刷新 |

**跨源时还有一个坑**：后端登录态走 Cookie，真跨域部署必须
`server.servlet.session.cookie.same-site=none` + `cookie.secure=true`，而且**整个链路要 HTTPS**
（`SameSite=None` 配 HTTP 会被浏览器直接丢掉，症状是"登录说成功，下一个请求又说未登录"）。
所以生产环境建议走同域反向代理。详见 `qimo-frontend/README.md` 第 5 节。

---

## 6. 两个工程各自的文档

- [`qimo-frontend/README.md`](qimo-frontend/README.md) —— 目录结构、启动、API 配置层用法、
  自检、三种部署方式、从原工程的迁移对照表
- [`qimo-backend/README.md`](qimo-backend/README.md) —— 改造前后对比、启动、**完整接口清单**
  （含请求体字段和校验规则）、CORS 原理、部署、数据库说明

---

## 7. 改造过程中踩到的坑（写下来免得你再踩）

### 恋恋自己写错的

1. **行尾符**：原工程文件是 CRLF，恋恋用 LF 写的查找串匹配不上，两处替换静默失败。
   迁移脚本现在会把两侧统一成 LF 再匹配、按原风格写回。
2. **站点根绝对路径**：原页面用 `/js/auth-modal.js` 是能跑的（后端从站点根发出），
   但前端一旦部署到子路径（`https://host/bird/`）就会指到站点根。已全部改成按页面深度
   计算的相对路径。
3. **`server.mjs` 的"空串不等于没配"**：`qimo.config.json` 里 `apiBase: ""` 用 `??` 判断时
   不会回退默认值，导致服务器以为"用户不想要代理"——而这时 `/api` 根本没人处理，
   开箱即用直接失败。现在空串视为未配置，回退到 `http://localhost:8080`。
4. **兼容跳板覆盖了真首页**：骨架化脚本第二次运行时，把 `main.html` 跳板当成"旧首页"
   又改名成 `index.html`。表面上"文件存在"，打开只是一句 `location.replace`。
   已改成"只在 index.html 不存在时才改名"，并给自检加了一条专盯这个的断言。

### 测试时才暴露的（值得记住的教训）

5. **PowerShell 发中文 JSON 会把内容变成 `?`**。恋恋第一轮用 `Invoke-WebRequest` 测打卡，
   鸟名"杜鹃属"被发成 `???`，于是"打卡后状态查询返回 false"——看着像应用 bug，其实是
   测试脚本的编码问题。查数据库 `HEX(bird_name)` 是 `3F3F3F`（`?` 的 ASCII），才定位到。
   后来改用 Node 的 `fetch`（与浏览器同一条路）重测，30/31 通过。
   **结论：中文相关的接口验证，别用 PowerShell 的 `Invoke-WebRequest` 发 body。**
6. **"接口 200 且返回 success"不等于"页面上看得见"**。排行榜的 `checkinCount` 与前端读的
   `checkin_count` 不一致，接口层面完全正常，页面却是空白。字段名这种契约问题，
   只有对着前端代码逐字核对才能发现。
