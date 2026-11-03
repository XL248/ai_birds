/**
 * 羽翼守望者 · API 地址配置
 * =====================================================================
 * 前后端分离后，前端不再由 Spring Boot 一起发出来，所以每一次接口调用都必须
 * 明确知道后端在哪里。这个文件就是唯一的"后端在哪"入口。
 *
 * 三种改法，优先级从高到低：
 *
 *   1. 运行时覆盖（推荐给临时调试）：打开页面之前在浏览器控制台执行
 *        localStorage.setItem('QIMO_API_BASE', 'http://192.168.1.8:8080');
 *      然后刷新页面。清掉它用 localStorage.removeItem('QIMO_API_BASE')。
 *
 *   2. 部署时改这里：把 defaultBase 改成你的后端地址。
 *
 *   3. 不配任何东西（默认）：留空字符串，表示"和前端同源"。
 *      适用于用 Nginx / 反向代理把 /api 转发到后端的部署方式，或者前端
 *      和后端由同一个域名提供的情况。这是生产环境最常用的做法。
 *
 * 注意：后端登录态走 Session Cookie。跨源（前端 5173、后端 8080）时后端必须
 * 开启 CORS 且 allow-credentials=true，Cookie 也必须带 SameSite=None; Secure
 * （见后端 README 的"跨源部署"一节）。如果不想折腾 Cookie，就让前端通过
 * 反向代理同源访问后端。
 * =====================================================================
 */
(function (global) {
  'use strict';

  /** 留空 = 同源。改成 'http://localhost:8080' 即为跨源直连后端。 */
  var defaultBase = '';

  var override = null;
  try {
    override = global.localStorage ? global.localStorage.getItem('QIMO_API_BASE') : null;
  } catch (e) {
    // 隐私模式等场景下 localStorage 会抛错，忽略即可
    override = null;
  }

  /** 结尾不留斜杠，方便拼接。 */
  function normalize(value) {
    if (typeof value !== 'string') return '';
    var trimmed = value.trim();
    if (trimmed === '') return '';
    return trimmed.replace(/\/+$/, '');
  }

  global.QIMO_CONFIG = {
    /** 当前生效的后端根地址；空字符串代表同源。 */
    apiBase: normalize(override !== null && override !== undefined ? override : defaultBase),
    /** 默认是否携带 Cookie（后端 Session 登录态必须带）。 */
    credentials: 'include',
    /** 所有接口的前缀，后端三个 Controller 都在 /api 下。 */
    apiPrefix: '/api',
    /** 调试开关：为 true 时会在控制台打印每次接口调用。 */
    debug: false
  };
})(window);
