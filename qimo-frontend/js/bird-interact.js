/**
 * 羽翼守望者 · 鸟种互动模块
 * 在鸟类详情页注入：打卡按钮 + 收藏按钮 + 评论区
 */
(function () {
  'use strict';

  // 只对鸟类详情页生效（URL 包含 -details/）
  if (!window.location.pathname.includes('-details/')) return;

  $(function () {
    loadBirdInteract();
  });

  function loadBirdInteract() {
    // 从页面 h2 提取鸟名: "icon 啄木鸟属 · 森林医生" → "啄木鸟属"
    let birdName = '';
    const $h2 = $('h2').first();
    if ($h2.length) {
      // 去掉 FontAwesome 图标残留，按分隔符取第一部分
      birdName = $h2.text()
        .replace(/^\s*/, '')       // 去开头空格
        .split(/[·‧：:\-–—]/)[0]  // 按 · 或 冒号 等切分
        .trim();
    }
    const $speciesTitle = $('.species-title').first();
    let speciesName = '';
    if ($speciesTitle.length) {
      // 格式: "大杜鹃（Cuculus canorus）" → 取 "大杜鹃"
      speciesName = $speciesTitle.text().split('（')[0].trim();
    }

    // 注入互动栏
    const html = `
    <div id="bird-interact-bar" style="margin-top:40px;">
      <div class="section-header"><h2>互动</h2></div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:30px;">
        <button id="btn-checkin" class="interact-btn">
          <i class="fas fa-check-circle"></i> <span id="checkin-text">打卡见过</span>
        </button>
        <button id="btn-favorite" class="interact-btn">
          <i class="fas fa-heart"></i> <span id="fav-text">收藏</span>
        </button>
        <span id="bird-count" style="display:none;color:#8ab870;font-size:0.85rem;align-self:center;"></span>
      </div>
      <div class="section-header"><h2>评论</h2></div>
      <div id="comments-list" style="margin-bottom:20px;"></div>
      <div id="comment-form-wrap" style="display:none;">
        <textarea id="comment-input" placeholder="说点什么吧……" maxlength="500" style="width:100%;background:#141c14;border:1px solid #4a6a3a;border-radius:16px;color:#d4d0c5;padding:12px 16px;font-family:'Inter',sans-serif;resize:vertical;min-height:60px;"></textarea>
        <button id="btn-comment-submit" class="interact-btn" style="margin-top:8px;">发布评论</button>
      </div>
      <div id="comment-login-hint" style="color:#8aa87a;font-size:0.9rem;text-align:center;">
        <a href="#" class="nav-login-btn" style="color:#b8d8a0;">登录</a> 后参与评论
      </div>
    </div>`;

    const $container = $('.game-section .container, section .container').first();
    if (!$container.length) return;
    $container.append(html);

    // 样式注入
    if (!$('#interact-styles').length) {
      $('<style id="interact-styles">')
        .text(`
          .interact-btn { font-family:'Cinzel',serif; background:rgba(70,110,60,0.25); border:1px solid #6f9a5f; border-radius:40px; color:#c8e0b0; padding:8px 20px; cursor:pointer; transition:0.2s; font-size:0.9rem; letter-spacing:1px; }
          .interact-btn:hover { background:#3f6a30; border-color:#8fc078; }
          .interact-btn.active { background:#3f6a30; border-color:#8fc078; color:#f0f8e8; }
          .comment-item { background:rgba(20,28,20,0.7); border:1px solid #3a5a2a; border-radius:16px; padding:14px 18px; margin-bottom:12px; }
          .comment-item .c-author { color:#9fc88a; font-size:0.85rem; font-family:'Cinzel',serif; margin-bottom:4px; }
          .comment-item .c-content { color:#d4d0c5; font-size:0.9rem; line-height:1.5; }
          .comment-item .c-time { color:#6a8a5a; font-size:0.75rem; margin-top:6px; }
        `).appendTo('head');
    }

    // 绑定事件
    let isCheckedIn = false, isFavorited = false;

    QIMO_API.get(`/api/social/bird-status?birdName=${encodeURIComponent(birdName)}`)
      .then(s => {
        if (s.checkedIn) { $('#btn-checkin').addClass('active'); $('#checkin-text').text('已打卡'); isCheckedIn = true; }
        if (s.favorited) { $('#btn-favorite').addClass('active'); $('#fav-text').text('已收藏'); isFavorited = true; }
      });

    $('#btn-checkin').on('click', function () {
      const send = isCheckedIn
        ? QIMO_API.del('/api/social/checkin', { birdName })
        : QIMO_API.post('/api/social/checkin', { birdName });
      send.then(d => {
        if (d.message) qimoToast(d.message);
        if (d.success && d.total !== undefined) {
          isCheckedIn = !isCheckedIn;
          if (isCheckedIn) { $('#btn-checkin').addClass('active'); $('#checkin-text').text('已打卡'); }
          else { $('#btn-checkin').removeClass('active'); $('#checkin-text').text('打卡见过'); }
          $('#bird-count').show().text(`已打卡 ${d.total} 种鸟`);
        }
      });
    });

    $('#btn-favorite').on('click', function () {
      const send = isFavorited
        ? QIMO_API.del('/api/social/favorite', { birdName })
        : QIMO_API.post('/api/social/favorite', { birdName });
      send.then(d => {
        if (d.message) qimoToast(d.message);
        isFavorited = !isFavorited;
        if (isFavorited) { $('#btn-favorite').addClass('active'); $('#fav-text').text('已收藏'); }
        else { $('#btn-favorite').removeClass('active'); $('#fav-text').text('收藏'); }
      });
    });

    // 加载评论
    loadComments(birdName);

    $('#btn-comment-submit').on('click', function () {
      const content = $('#comment-input').val().trim();
      if (!content) return;
      QIMO_API.post('/api/social/comment', { birdName, content }).then(d => {
        qimoToast(d.message);
        if (d.success) { $('#comment-input').val(''); loadComments(birdName); }
      });
    });

    // 检查登录态决定是否显示评论框
    QIMO_API.get('/api/auth/me').then(d => {
      if (d.loggedIn) { $('#comment-form-wrap').show(); $('#comment-login-hint').hide(); }
    }).catch(() => { /* 未登录或后端不可用时保持提示 */ });

    // 获取个人打卡总数
    QIMO_API.get('/api/social/checkins').then(d => {
      if (d.success && d.total > 0) $('#bird-count').show().text(`已打卡 ${d.total} 种鸟`);
    }).catch(() => { /* 未登录时静默 */ });
  }

  function loadComments(birdName) {
    QIMO_API.get(`/api/social/comments?birdName=${encodeURIComponent(birdName)}`)
      .then(d => {
        if (!d.success || !d.comments.length) {
          $('#comments-list').html('<p style="color:#6a8a5a;text-align:center;">暂无评论，来做第一个吧~</p>');
          return;
        }
        $('#comments-list').html(d.comments.map(c => `
          <div class="comment-item">
            <div class="c-author">${escapeHTML(c.nickname || c.username)}</div>
            <div class="c-content">${escapeHTML(c.content)}</div>
            <div class="c-time">${new Date(c.created_at).toLocaleString('zh-CN')}</div>
          </div>`).join(''));
      });
  }

  // 注意：main.js 也定义了一个全局 showToast，本文件原先在 $(function(){}) 内部再声明
  // 一个同名函数，属于"内层遮蔽外层"。改名避免以后有人把这段代码挪出去时踩坑。
  function qimoToast(msg) {
    const $t = $(`<div class="toast-msg" style="display:none;">${escapeHTML(msg)}</div>`);
    $('body').append($t);
    $t.fadeIn(200).delay(1500).fadeOut(400, function () { $t.remove(); });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
