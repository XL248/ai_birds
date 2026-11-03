/**
 * 羽翼守望者 · 登录/注册模态框
 * 通过绝对路径 /js/ 和 /css/ 引用，确保所有页面深度均可正常工作
 */
(function () {
  'use strict';

  // ========== 注入 CSS ==========
  // 分离前页面由后端发出，用 /css/ 绝对路径没问题；分离后前端可能被部署在
  // 子路径（例如 https://host/bird/），绝对路径会指向站点根，所以改成相对路径。
  var QIMO_AUTH_CSS = 'css/auth-modal.css';
  try {
    var qimoScriptSrc = document.currentScript && document.currentScript.getAttribute('src');
    if (qimoScriptSrc) {
      QIMO_AUTH_CSS = qimoScriptSrc.replace(/js\/auth-modal\.js.*$/, '') + 'css/auth-modal.css';
    }
  } catch (e) { /* 拿不到 script 就退回页面相对路径 */ }
  if (!document.querySelector('link[href="' + QIMO_AUTH_CSS + '"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = QIMO_AUTH_CSS;
    document.head.appendChild(link);
  }

  // ========== DOM Ready ==========
  $(function () {
    injectModalHTML();
    initNavbarAuth();
    checkSession();
    bindEvents();
  });

  // ========== 注入模态框 HTML ==========
  function injectModalHTML() {
    if (document.getElementById('auth-modal-overlay')) return;

    const html = `
    <div id="auth-modal-overlay" class="auth-modal-overlay">
      <div class="auth-modal">
        <button class="auth-modal-close" title="关闭">&times;</button>
        <div class="auth-modal-header">
          <i class="fas fa-feather-alt"></i>
          <div class="auth-logo">羽翼守望者</div>
        </div>
        <div class="auth-modal-tabs">
          <button class="auth-modal-tab active" data-tab="login">登 录</button>
          <button class="auth-modal-tab" data-tab="register">注 册</button>
        </div>
        <div class="auth-modal-body">
          <form id="login-form">
            <label for="login-username">用户名</label>
            <input id="login-username" type="text" placeholder="请输入用户名" autocomplete="username" maxlength="32" />
            <span class="field-error" data-for="login-username"></span>

            <label for="login-password">密 码</label>
            <input id="login-password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <span class="field-error" data-for="login-password"></span>

            <button type="submit" class="btn-submit">登 录</button>
          </form>
          <form id="register-form" class="hidden">
            <label for="register-username">用户名</label>
            <input id="register-username" type="text" placeholder="2-32个字符" autocomplete="username" maxlength="32" />
            <span class="field-error" data-for="register-username"></span>

            <label for="register-password">密 码</label>
            <input id="register-password" type="password" placeholder="至少6个字符" autocomplete="new-password" />
            <span class="field-error" data-for="register-password"></span>

            <label for="register-password-confirm">确认密码</label>
            <input id="register-password-confirm" type="password" placeholder="再次输入密码" autocomplete="new-password" />
            <span class="field-error" data-for="register-password-confirm"></span>

            <button type="submit" class="btn-submit">注 册</button>
          </form>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ========== 导航栏添加登录按钮 ==========
  function initNavbarAuth() {
    const $navLinks = $('.nav-links');
    if (!$navLinks.length) return;

    // 避免重复注入
    if ($navLinks.find('.nav-auth-area').length) return;

    const $authLi = $('<li class="nav-auth-area"></li>');
    $authLi.html('<a href="#" class="nav-login-btn"><i class="fas fa-user"></i> 登录</a>');
    $navLinks.append($authLi);
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    const $overlay = $('#auth-modal-overlay');

    // 打开模态框
    $(document).on('click', '.nav-login-btn', function (e) {
      e.preventDefault();
      openModal();
    });

    // 关闭模态框
    $(document).on('click', '.auth-modal-close', closeModal);
    $overlay.on('click', function (e) {
      if (e.target === this) closeModal();
    });

    // Tab 切换
    $(document).on('click', '.auth-modal-tab', function () {
      const tab = $(this).data('tab');
      $('.auth-modal-tab').removeClass('active');
      $(this).addClass('active');
      if (tab === 'login') {
        $('#register-form').addClass('hidden');
        $('#login-form').removeClass('hidden');
      } else {
        $('#login-form').addClass('hidden');
        $('#register-form').removeClass('hidden');
      }
    });

    // 登录提交
    $(document).on('submit', '#login-form', function (e) {
      e.preventDefault();
      clearErrors();
      const username = $('#login-username').val().trim();
      const password = $('#login-password').val();

      if (!username) return showError('login-username', '请输入用户名');
      if (!password) return showError('login-password', '请输入密码');

      QIMO_API.post('/api/auth/login', { username, password })
        .then(data => {
          if (data.success) {
            showToast(data.message);
            closeModal();
            updateNavbarLoggedIn(data.username);
          } else {
            showToast(data.message, true);
          }
        })
        .catch(() => showToast('网络错误，请重试', true));
    });

    // 注册提交
    $(document).on('submit', '#register-form', function (e) {
      e.preventDefault();
      clearErrors();
      const username = $('#register-username').val().trim();
      const password = $('#register-password').val();
      const confirm = $('#register-password-confirm').val();

      if (!username || username.length < 2) return showError('register-username', '用户名需2-32字符');
      if (/\s/.test(username)) return showError('register-username', '用户名不能含空格');
      if (!password || password.length < 6) return showError('register-password', '密码至少6个字符');
      if (password !== confirm) return showError('register-password-confirm', '两次密码不一致');

      QIMO_API.post('/api/auth/register', { username, password })
        .then(data => {
          showToast(data.message, !data.success);
          if (data.success) {
            // 注册成功，切换到登录 tab
            $('.auth-modal-tab[data-tab="login"]').click();
            $('#login-username').val(username);
            $('#login-password').val('');
          }
        })
        .catch(() => showToast('网络错误，请重试', true));
    });

    // 退出登录
    $(document).on('click', '.nav-logout-btn', function (e) {
      e.preventDefault();
      QIMO_API.post('/api/auth/logout', {})
        .then(data => {
          showToast(data.message);
          updateNavbarLoggedOut();
        })
        .catch(() => showToast('网络错误', true));
    });

    // 下拉菜单切换
    $(document).on('click', '.nav-dropdown-toggle', function (e) {
      e.preventDefault(); e.stopPropagation();
      $(this).siblings('.nav-user-dropdown').toggleClass('open');
    });
    $(document).on('click', function (e) {
      if (!$(e.target).closest('.nav-user-menu').length) {
        $('.nav-user-dropdown').removeClass('open');
      }
    });

    // ESC 关闭
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $overlay.hasClass('active')) {
        closeModal();
      }
    });
  }

  // ========== 检查会话状态 ==========
  function checkSession() {
    QIMO_API.get('/api/auth/me')
      .then(data => {
        if (data.loggedIn) {
          updateNavbarLoggedIn(data.username);
        }
      })
      .catch(() => {}); // 静默失败
  }

  // ========== 导航栏状态切换 ==========
  function updateNavbarLoggedIn(username) {
    const $area = $('.nav-auth-area');
    if (!$area.length) return;
    $area.html(`
      <div class="nav-user-menu">
        <a href="javascript:void(0)" class="nav-user-name nav-dropdown-toggle">
          <i class="fas fa-feather-alt"></i> ${escapeHTML(username)} <i class="fas fa-caret-down"></i>
        </a>
        <div class="nav-user-dropdown">
          <a href="profile.html"><i class="fas fa-user"></i> 个人中心</a>
          <a href="diary.html"><i class="fas fa-book-open"></i> 观鸟日记</a>
          <a href="leaderboard.html"><i class="fas fa-trophy"></i> 排行榜</a>
                    <a href="#" class="nav-logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
    `);
  }

  function updateNavbarLoggedOut() {
    const $area = $('.nav-auth-area');
    if (!$area.length) return;
    $area.html(`
      <a href="#" class="nav-login-btn"><i class="fas fa-user"></i> 登录</a>
      <div class="nav-user-menu" style="margin-left:4px;">
        <a href="javascript:void(0)" class="nav-login-btn nav-dropdown-toggle" style="font-size:0.8rem;"><i class="fas fa-ellipsis-h"></i></a>
        <div class="nav-user-dropdown">
          <a href="leaderboard.html"><i class="fas fa-trophy"></i> 排行榜</a>
                    <a href="diary.html"><i class="fas fa-book-open"></i> 观鸟日记</a>
        </div>
      </div>
    `);
  }

  // ========== 工具函数 ==========
  function openModal() {
    $('#auth-modal-overlay').addClass('active');
    $('.auth-modal-tab[data-tab="login"]').click();
    $('#login-username').val('');
    $('#login-password').val('');
    $('#register-username').val('');
    $('#register-password').val('');
    $('#register-password-confirm').val('');
    clearErrors();
  }

  function closeModal() {
    $('#auth-modal-overlay').removeClass('active');
  }

  function showError(fieldId, msg) {
    $(`.field-error[data-for="${fieldId}"]`).text(msg).addClass('show');
  }

  function clearErrors() {
    $('.field-error').text('').removeClass('show');
  }

  function showToast(msg, isError) {
    const $toast = $('.toast-msg');
    if (!$toast.length) {
      const $t = $(`<div class="toast-msg" style="display:none;${isError ? 'border-color:#e8a0a0;color:#e8c0c0;' : ''}">${escapeHTML(msg)}</div>`);
      $('body').append($t);
      $t.fadeIn(200).delay(1500).fadeOut(400, function () { $t.remove(); });
      return;
    }
    $toast.text(msg).stop(true, true).fadeIn(200).delay(1500).fadeOut(400);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
