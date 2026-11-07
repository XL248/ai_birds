/**
 * 羽翼守望者 · 统一 API 客户端
 * =====================================================================
 * 分离前，页面里的 fetch 写的都是 '/api/xxx'——因为页面是后端发出来的，同源。
 * 分离后这个假设不再成立，所有请求统一走这里，好处是：
 *
 *   - 地址只在一个地方拼（QIMO_CONFIG.apiBase），换后端不用翻全站；
 *   - 默认 credentials: 'include'，跨源时 Cookie 才会带上，否则一直"未登录"；
 *   - 统一处理"后端返回 401"和"网络不通"，页面只管拿数据；
 *   - 提供一个 fetch 兜底拦截器：万一还有漏网的 '/api/...' 相对路径调用，
 *     也会被自动改写到配置的后端地址，不会再出现"打到前端静态服务器上 404"。
 *
 * 对外用法：
 *   QIMO_API.url('/api/social/checkins')
 *   QIMO_API.get('/api/social/checkins')
 *   QIMO_API.post('/api/auth/login', { username, password })
 *   QIMO_API.del('/api/social/favorite', { birdName })
 *   QIMO_API.auth.me() / .login(u, p) / .register(u, p) / .logout()
 * =====================================================================
 */
(function (global) {
  'use strict';

  var config = global.QIMO_CONFIG || {
    apiBase: '',
    credentials: 'include',
    apiPrefix: '/api',
    debug: false
  };
  global.QIMO_CONFIG = config;

  /** 把一个以 / 开头的接口路径拼成完整地址（同源时原样返回）。 */
  function url(path) {
    if (typeof path !== 'string' || path === '') return config.apiBase + '/';
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(path)) return path; // 已经是绝对地址
    var base = config.apiBase || '';
    if (base === '') return path; // 同源，交给浏览器
    return base + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function log(method, target, extra) {
    if (config.debug && global.console) {
      global.console.log('[QIMO_API] ' + method + ' ' + target, extra === undefined ? '' : extra);
    }
  }

  /**
   * 发一次请求。
   * @param {string} path 以 /api 开头的路径。
   * @param {object} [options] method / body / headers / credentials。
   * @returns {Promise<any>} 解析后的 JSON（空响应返回 null）。
   */
  function request(path, options) {
    var opts = options || {};
    var target = url(path);
    var init = {
      method: opts.method || 'GET',
      // 跨源时必须带 Cookie，否则后端 HttpSession 拿不到登录态
      credentials: opts.credentials || config.credentials,
      headers: Object.assign({ Accept: 'application/json' }, opts.headers || {})
    };
    if (opts.body !== undefined && opts.body !== null) {
      init.headers['Content-Type'] = 'application/json';
      init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    }

    log(init.method, target, opts.body);

    return global.fetch(target, init).then(function (response) {
      var contentType = response.headers.get('content-type') || '';
      var parsed = contentType.indexOf('application/json') >= 0
        ? response.json().catch(function () { return null; })
        : response.text().then(function (text) { return text === '' ? null : text; });

      return parsed.then(function (payload) {
        if (response.ok) return payload;

        // 401 是"未登录"，业务上很常见，交给调用方判断，不要当成异常刷屏
        var message = payload && typeof payload === 'object' && payload.message
          ? payload.message
          : 'HTTP ' + response.status;
        var error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        error.unauthorized = response.status === 401;
        throw error;
      });
    }).catch(function (error) {
      if (error && error.status) throw error;
      // 网络层失败（后端没起来、CORS 被拦、地址写错）统一成一句人话
      var wrapped = new Error('无法连接后端（' + target + '）：请确认后端已启动，且 CORS 允许当前来源。');
      wrapped.network = true;
      wrapped.cause = error;
      throw wrapped;
    });
  }

  function get(path) { return request(path, { method: 'GET' }); }
  function post(path, body) { return request(path, { method: 'POST', body: body }); }
  function put(path, body) { return request(path, { method: 'PUT', body: body }); }
  function del(path, body) { return request(path, { method: 'DELETE', body: body }); }

  var auth = {
    me: function () { return get('/api/auth/me'); },
    login: function (username, password) { return post('/api/auth/login', { username: username, password: password }); },
    register: function (username, password) { return post('/api/auth/register', { username: username, password: password }); },
    logout: function () { return post('/api/auth/logout', {}); }
  };

  /**
   * 兜底拦截器：把仍然以 '/api/...' 相对路径发出的 fetch 改写到配置的后端。
   * 这样即使某个页面漏改，也不会静默打到前端静态服务器上变成 404。
   */
  var nativeFetch = global.fetch ? global.fetch.bind(global) : null;
  if (nativeFetch) {
    global.fetch = function (input, init) {
      if (typeof input === 'string' && input.charAt(0) === '/' && input.indexOf(config.apiPrefix + '/') === 0) {
        var rewritten = url(input);
        if (rewritten !== input) {
          var nextInit = Object.assign({}, init || {});
          if (nextInit.credentials === undefined || nextInit.credentials === 'same-origin') {
            nextInit.credentials = config.credentials;
          }
          log('rewrite', input + ' -> ' + rewritten);
          return nativeFetch(rewritten, nextInit);
        }
        // 同源时只补一个 credentials，跨源时保持调用方设置
        var sameOriginInit = Object.assign({}, init || {});
        if (sameOriginInit.credentials === undefined) sameOriginInit.credentials = config.credentials;
        return nativeFetch(input, sameOriginInit);
      }
      return nativeFetch(input, init);
    };
  }

  global.QIMO_API = {
    config: config,
    url: url,
    request: request,
    get: get,
    post: post,
    put: put,
    del: del,
    auth: auth
  };
})(window);
