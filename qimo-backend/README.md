# 后端工程说明

羽翼守望者（qimo）的**后端**，Spring Boot 3.2.5 + MyBatis-Plus 3.5.5 + MySQL。

分离改造之后，这个进程**只提供 JSON 接口**，不再伺服任何页面、样式、脚本和图片。

---

## 1. 改造前后对比

| | 改造前 | 改造后 |
|---|---|---|
| 页面 | Spring Boot 从 `src/main/resources/static` 一起发出去 | 由前端工程（`D:\modify\qimo-frontend`）独立提供 |
| 接口 | `/api/**`（本来就有） | `/api/**`（不变） |
| 跨源 | 不存在这个问题（同源） | 新增 `config/CorsConfig.java`，来源可配 |
| 启动行为 | 起完自动 `Desktop.browse("http://localhost:8080/main.html")` | 去掉，只在控制台打印接口地址 |
| 根路径 `/` | 静态首页 | 302 到 `/api/health` |
| HTTP 端口 | 8080 | 8080（不变） |
| 排行榜 | **永远返回空数组（未实现的桩）** | 已实现：按打卡→收藏→答题分排序，取前 100 |
| 排行榜字段名 | `checkinCount`（前端读不到） | `checkin_count`（与前端及其余接口一致） |
| `SessionConfig` | 一个从未生效的 `connect.sid` 改名 Bean | 清空，并注明真相（见第 8 节） |

**Controller 的接口签名、Service 的其余逻辑、Mapper、Entity、建表脚本都没有改**——原本就已经是
标准的 `@RestController` + `/api` 前缀结构，这一层不需要动。改的只有上面这几处。

---

## 2. 目录结构

```
qimo-backend/
├── pom.xml
└── src/main/
    ├── java/com/eco/bird/
    │   ├── qidong.java                     启动类（已去掉自动开浏览器）
    │   ├── config/
    │   │   ├── CorsConfig.java             ★ 新增：跨源配置
    │   │   ├── WebMvcConfiguration.java    ★ 新增：/ -> /api/health
    │   │   ├── SecurityConfig.java         放行所有请求、关掉表单登录
    │   │   ├── SessionConfig.java          ★ 改写：清掉从未生效的 Cookie 改名 Bean
    │   │   └── MyBatisPlusConfig.java      created_at / updated_at 自动填充
    │   ├── controller/
    │   │   ├── HealthController.java       ★ 新增：/api/health
    │   │   ├── AuthController.java         /api/auth/**
    │   │   ├── UserController.java         /api/user/**
    │   │   └── SocialController.java       /api/social/**
    │   ├── dto/
    │   │   ├── LeaderboardDTO.java         ★ 改写：字段名对齐前端（下划线）
    │   │   └── 其余 DTO                     原样保留
    │   ├── service/
    │   │   ├── SocialService.java          ★ 改写：补完 getLeaderboard()
    │   │   └── UserService / impl          原样保留
    │   ├── entity/ mapper/                 原样保留
    └── resources/
        ├── application.properties          已改写（含 CORS、会话、建表开关）
        └── init.sql                        建表脚本（原样保留，内容本来就是好的）
```

★ = 本次改造新增或改写的文件。

> **注意**：`src/main/resources/static/` 已经不存在了。不要往回拷前端产物——那等于把两边又粘
> 回去。单机部署请照 README 第 6 节做反向代理。

---

## 3. 跑起来

前置：**JDK 17**（不是 8）+ MySQL + Maven。

```powershell
# 1. 建库建表（init.sql 里也做了，这步可以跳过）
mysql -u root -p < src/main/resources/init.sql

# 2. 改数据库密码
#    src/main/resources/application.properties 里的 spring.datasource.password

# 3. 起后端
mvn spring-boot:run

# 或者打成 jar 再跑
mvn -DskipTests package
java -jar target/bird-watcher-1.0-SNAPSHOT.jar
```

验证：

```powershell
curl http://localhost:8080/api/health
# {"success":true,"service":"qimo-backend","apiPrefix":"/api","time":"..."}
```

> **JDK 版本是这次踩到的一个坑**：这台机器上 `JAVA_HOME` 指向 `jdk1.8.0_202`，
> 而 Spring Boot 3.x 要求 17+。用 8 编译会直接失败。请确认：
> ```powershell
> $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
> java -version   # 应显示 17
> ```

---

## 4. 接口清单

所有接口前缀 `/api`，登录态走 HttpSession（Cookie 名 `connect.sid`）。
标 🔒 的需要先登录，未登录返回 401 `{"success":false,"message":"请先登录"}`。

### 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 存活探针，不碰数据库，无需登录 |

### 账号 `/api/auth`

| 方法 | 路径 | 请求体 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | `{username, password}` | 用户名 2–32 字符不含空格；密码 ≥6 位。重名 409 |
| POST | `/api/auth/login` | `{username, password}` | 成功写 session；失败 401 |
| POST | `/api/auth/logout` | — | `session.invalidate()` |
| GET | `/api/auth/me` | — | `{loggedIn, username?}` |

### 用户 `/api/user`

| 方法 | 路径 | 请求体 | 说明 |
|---|---|---|---|
| GET | 🔒 `/api/user/profile` | — | `{success, profile:{username,nickname,bio,created_at,...}}` |
| PUT | 🔒 `/api/user/profile` | `{nickname, bio}` | 昵称 ≤32，简介 ≤500 |
| PUT | 🔒 `/api/user/password` | `{oldPassword, newPassword}` | 新密码 ≥6 位 |

### 社交 `/api/social`

| 方法 | 路径 | 请求体 / 参数 | 说明 |
|---|---|---|---|
| POST | 🔒 `/api/social/checkin` | `{birdName}` | 打卡，返回 `total` |
| DELETE | 🔒 `/api/social/checkin` | `{birdName}` | 取消打卡 |
| GET | 🔒 `/api/social/checkins` | — | `{birds:[...], total}` |
| GET | `/api/social/bird-status?birdName=` | — | `{checkedIn, favorited}`，未登录两个都是 false |
| POST | 🔒 `/api/social/favorite` | `{birdName}` | 收藏 |
| DELETE | 🔒 `/api/social/favorite` | `{birdName}` | 取消收藏 |
| GET | 🔒 `/api/social/favorites` | — | `{birds:[...]}` |
| GET | `/api/social/comments?birdName=` | — | `{comments:[...]}` |
| POST | 🔒 `/api/social/comment` | `{birdName, content}` | 内容 ≤500 字 |
| POST | 🔒 `/api/social/diary` | `{title, content, location, birdName}` | 标题必填 ≤128 |
| GET | `/api/social/diaries?page=1` | — | 每页 10 条，返回 `totalPages` |
| GET | `/api/social/diary/{id}` | — | 单篇 |
| GET | `/api/social/leaderboard` | — | 排行榜，按「打卡种数 → 收藏种数 → 答题最高分」降序，最多 100 名 |
| GET | `/api/social/achievements` | — | 徽章；未登录返回空数组而不是 401 |

> 注意 `DELETE` 请求也带 JSON body（打卡/收藏取消）。这是原设计，前端 `QIMO_API.del(path, body)`
> 已经配合好了；用 `curl` 手测时记得加 `-X DELETE -H "Content-Type: application/json" -d '{...}'`。

### 对外 JSON 的字段名约定

这个项目对外的字段是**下划线**风格：`created_at`、`bird_name`、`earned_at`、`checkin_count`…… 前端
就是按下划线读的。Java 侧是驼峰，所以任何新加的 DTO 都要显式对齐，否则前端拿到的字段是
`undefined`，页面上表现成"有数据但显示空白"。当前用 `@JsonProperty` 对齐的字段：

| DTO | Java 字段 | 对外 JSON | 前端读取处 |
|---|---|---|---|
| `LeaderboardDTO` | `checkinCount` | `checkin_count` | `html/user/leaderboard.html` |
| `LeaderboardDTO` | `favCount` | `fav_count` | 同上 |

`quizHighScore` 保持驼峰（前端目前不使用它）。

---

## 4.5 本次一并修掉的两个原有 bug

这两个都**不是前后端分离引入的**，是原项目里就存在的，恋恋跑端到端校验时撞出来的：

### bug 1：排行榜是个空实现

```java
// 原代码
public List<LeaderboardDTO> getLeaderboard() {
    // 简单起见，这里返回空，实际实现可用原生 SQL
    return new ArrayList<>();      // ← 永远是空
}
```

有 10 条打卡记录在库里，接口照样返回 `[]`，排行榜页面永远显示"还没有数据"。
现已实现（内存归并，理由写在 `SocialService` 的注释里）。

### bug 2：排行榜字段名与前端对不上

`LeaderboardDTO` 的 `checkinCount` / `favCount` 序列化成驼峰，而前端读的是
`u.checkin_count` / `u.fav_count`。**即使 bug 1 修好了，页面上那一列仍是空白。**
已用 `@JsonProperty` 对齐。

另外顺带发现：`comments` 表**没有** `ON DELETE CASCADE`（其它关联表都有）。所以删除一个
"评论过的用户"会因外键约束失败——`users` 的删除必须先把该用户的评论删掉。这是个设计不一致，
想改的话执行：

```sql
ALTER TABLE comments
  DROP FOREIGN KEY comments_ibfk_1,
  ADD CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

（外键名以 `SHOW CREATE TABLE comments` 的实际输出为准。）

---

## 5. 跨源配置（分离后新增的部分）

`config/CorsConfig.java` 从配置里读允许的来源：

```properties
app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173
```

为什么**必须写精确来源、不能用 `*`**：本项目登录态靠 Cookie，需要
`Access-Control-Allow-Credentials: true`，而规范禁止它和通配符来源同时出现，浏览器会直接拒绝。
所以来源列表要跟着前端实际地址走。

`allowedMethod` 覆盖了 GET/POST/PUT/DELETE/OPTIONS；预检结果缓存 1 小时（`app.cors.max-age`），
避免每个请求都先飞一次 OPTIONS。

### 跨源 Cookie 的两条硬性要求

如果前端和后端真的不同域（不是走反向代理），光配 CORS 还不够，Cookie 也要能跨站：

```properties
server.servlet.session.cookie.same-site=none
server.servlet.session.cookie.secure=true
```

**`SameSite=None` 必须配 HTTPS**，HTTP 下浏览器会直接丢掉这个 Cookie，表现就是
"登录接口返回成功，但下一个请求又说未登录"。所以真跨源部署请准备 HTTPS。

前端 `5173` + 后端 `8080` 这种**本机**组合，浏览器把 `localhost:5173` 和 `localhost:8080`
当作不同来源，所以上面这套一样要配齐；或者干脆用前端自带的 `server.mjs` 走代理，同源就没这些问题。

---

## 6. 部署

### 单机部署（推荐）

后端只管跑 `java -jar`，Nginx 同时提供前端静态文件并把 `/api` 转给后端：

```nginx
server {
    listen 80;
    server_name bird.example.com;
    root /var/www/qimo-frontend;
    index index.html;

    location / { try_files $uri $uri/ =404; }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_path / /;
    }
}
```

这种部署前后端同源，`config/api-base.js` 留空即可，Cookie 也不需要 `SameSite=None`。

### 前后端分开部署

前端丢静态服务器/CDN，后端开放 8080，然后照第 5 节把 CORS 和 Cookie 配齐。

### 打包

```powershell
mvn -DskipTests package
# target\bird-watcher-1.0-SNAPSHOT.jar
```

`pom.xml` 里的 `spring-boot-maven-plugin` 会把依赖一起打进可执行 jar，没有改动。

---

## 7. 数据库

`init.sql` 建 8 张表：`users`、`sessions`、`checkins`、`favorites`、`comments`、
`diary`、`achievements`（以及一个应用账号 `bird_app`）。

`application.properties` 里：

```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:init.sql
spring.sql.init.continue-on-error=true
```

脚本里全是 `CREATE TABLE IF NOT EXISTS`，重复执行是安全的。加了 `continue-on-error=true`
是因为脚本末尾的 `CREATE USER IF NOT EXISTS` / `GRANT` 需要额外权限，普通账号执行会报错——
原先那样会把整个后端起不来，现在只是打一条日志。

生产环境如果不想每次启动都跑建表脚本，把 `mode` 改成 `never` 即可。

---

## 8. 登录态到底存在哪（实测结论）

| 问题 | 实测答案 |
|---|---|
| Cookie 名是什么？ | **`JSESSIONID`**（不是 `connect.sid`） |
| 谁在管会话？ | Servlet 容器（Tomcat），**不是** Spring Session |
| 重启后端会掉登录吗？ | **会掉**。会话在内存里 |
| 库里那张 `sessions` 表有用吗？ | **没有用**，是历史遗留 |
| `HttpOnly` / `Path` / `SameSite` | `HttpOnly=true`、`Path=/`、`SameSite` 未设置（浏览器默认 Lax） |

**为什么 `connect.sid` 没生效**：`pom.xml` 里只有 `spring-session-core`，那是接口层，
不会替换容器的会话实现；要生效必须加 `spring-session-jdbc` 或 redis 之类的实现。
原 `SessionConfig` 里那个 `CookieSerializer` Bean 因此是个死配置，现已清空并注明缘由。

只想改 Cookie 名（不需要 Spring Session）的话，在 `application.properties` 里一行就够：

```properties
server.servlet.session.cookie.name=connect.sid
```

**如果需要"重启后仍保持登录"**，才要引入 `spring-session-jdbc`：

1. 加依赖 `org.springframework.session:spring-session-jdbc`
2. 用 Spring Session 官方的建表脚本建 `SPRING_SESSION` / `SPRING_SESSION_ATTRIBUTES`
   （⚠️ 注意：**不是** init.sql 里那张 `sessions` 表，字段结构完全不同）
3. 配置 `spring.session.store-type=jdbc`（Boot 3 里通常自动识别）
4. 想用现有的 `sessions` 表名，要额外写 `JdbcIndexedSessionRepository` 的
   `setTableName("sessions")`，且表结构仍需按官方格式重建

恋恋没有替你做这一步——它超出"前后端分离"的范围，而且会改动数据库结构，应该由你决定。

