$(document).ready(function() {

    // 导航栏滚动效果
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 60) {
            $('.navbar').addClass('scrolled');
        } else {
            $('.navbar').removeClass('scrolled');
        }
    });

    // 移动端菜单切换
    $('.menu-toggle').on('click', function() {
        $('.nav-links').toggleClass('active');
    });

    // 平滑滚动至锚点（导航链接）
    $('.nav-links a').on('click', function(e) {
        const href = this.getAttribute('href');
        // 拆分路径和锚点：判断是否是跨页面链接（包含 .html 等）
        const isCrossPage = href.includes('.html') || href.includes('/') || href.includes('.htm');

        if (!isCrossPage && this.hash !== "") {
            // 仅对「同页面锚点」阻止默认行为，执行平滑滚动
            e.preventDefault();
            const hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top - 70
            }, 800);
            $('.nav-links').removeClass('active');
        }
        // 跨页面链接：不阻止默认行为，让浏览器原生跳转
    });

    // 点击"向下探索"滚动到第一个板块（鸟类图鉴）
    $('.scroll-hint').on('click', function() {
        $('html, body').animate({
            scrollTop: $('#bird-guide').offset().top - 70
        }, 800);
    });

    // 占位按钮点击提示（仅用于演示状态）
    // 只有真正的占位按钮才弹提示。'.compare-card' 与 '.gallery-item' 是 <a> 链接，
    // 它们自己会跳转；原先一并绑上提示，既打断跳转体验，又会把文本节点直接插进
    // <body>（不是 jQuery 元素，remove() 拿不到），属于原有的小 bug，这里顺手收掉。
    $('.btn-placeholder').on('click', function() {
        const msg = $('<div class="toast-msg">🌱 自然守护者 · 内容建设中 🌱</div>');
        $('body').append(msg);
        msg.fadeIn(200).delay(1200).fadeOut(400, function() { $(this).remove(); });
    });

    // ========== 羽毛飘絮效果（仿原灰烬粒子） ==========
    function createFeather() {
        const $container = $('.feather-particle-container');
        const $feather = $('<div class="feather-particle"></div>');

        const size = Math.floor(Math.random() * 8) + 3;
        const startX = Math.random() * window.innerWidth;
        const duration = Math.random() * 6 + 3;

        $feather.css({
            left: startX + 'px',
            top: '-20px',
            width: size + 'px',
            height: size + 'px',
            animationDuration: duration + 's'
        });

        $container.append($feather);

        setTimeout(() => {
            $feather.remove();
        }, duration * 1000);
    }

    let featherInterval;
    function startFeathers() {
        if (featherInterval) clearInterval(featherInterval);
        featherInterval = setInterval(() => {
            createFeather();
        }, 400);
    }

    startFeathers();

    $(window).on('beforeunload', function() {
        if (featherInterval) clearInterval(featherInterval);
    });

    // 页面加载时，如果 URL 带有 hash（锚点），自动滚动到对应元素（兼容从子页面跳转）
    // 原代码中页面加载的锚点逻辑无需修改，仅补充：
// 确保 hash 解析正确（兼容跨页面跳转）
    if (window.location.hash) {
        setTimeout(function() {
            var target = $(window.location.hash);
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 70
                }, 500);
            }
        }, 200); // 延迟确保页面元素加载完成
    }

    // ========== 栖息地无缝滚动初始化 ==========
    function initHabitatSlider() {
        const slider = document.querySelector('.habitat-slider');
        const track = document.querySelector('.habitat-track');
        if (!track || !slider) return;

        // 获取所有卡片（初始状态）
        const cards = Array.from(track.children);
        if (cards.length === 0) return;

        // 克隆所有卡片并追加到轨道末尾，实现无缝衔接
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });

        // 计算单组卡片的实际总宽度（含 gap）
        const gap = parseInt(getComputedStyle(track).gap) || 40;
        const cardWidth = cards[0].offsetWidth; // 获取第一张卡片的宽度
        const totalWidth = cards.length * (cardWidth + gap) - gap;

        // 设置轨道宽度为两倍总宽度（容纳克隆组）
        track.style.width = (totalWidth * 2) + 'px';

        // 动态生成关键帧，使动画从 0 移动到 -totalWidth（一组卡片的宽度）
        const styleId = 'habitat-scroll-keyframes';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
    @keyframes scroll-habitat {
        0% { transform: translateX(0); }
        100% { transform: translateX(-${totalWidth}px); }
    }
`;

        // 应用动画
        track.style.animation = 'scroll-habitat 40s linear infinite';

        // 修正：绑定鼠标事件到外层 slider 容器
        slider.addEventListener('mouseenter', () => {
            track.style.animationPlayState = 'paused'; // 直接修改样式，优先级更高
        });
        slider.addEventListener('mouseleave', () => {
            track.style.animationPlayState = 'running';
        });

        // 窗口大小变化时重新计算（防抖）
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // 简单重新加载：移除动画，重新计算并应用（此处略复杂，暂不实现）
                // 实际项目中可重建轨道，但为简化，可提示刷新。
            }, 300);
        });
    }

    // 观鸟日记轮播
    // 观鸟日记轮播
    function initGallerySlider() {
        const slider = document.querySelector('.gallery-slider');
        const track = document.querySelector('.gallery-track');
        if (!slider || !track) return;
        const items = Array.from(track.children);
        if (items.length === 0) return;
        // 克隆卡片实现无缝滚动
        items.forEach(item => {
            const clone = item.cloneNode(true);
            track.appendChild(clone);
        });
        const gap = parseInt(getComputedStyle(track).gap) || 30;
        const itemWidth = items[0].offsetWidth;
        const totalWidth = items.length * (itemWidth + gap) - gap;
        track.style.width = (totalWidth * 2) + 'px';

        // 新增：动态生成画廊滚动关键帧（从左往右滑）
        const styleId = 'gallery-scroll-keyframes';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        // 关键帧：起始 -totalWidth，终点0 → 内容从左向右滑动
        styleTag.textContent = `
    @keyframes scroll-gallery {
        0% { transform: translateX(-${totalWidth}px); }
        100% { transform: translateX(0); }
    }
`;
        // 给轨道绑定画廊动画
        track.style.animation = 'scroll-gallery 40s linear infinite';

    }

// 在文档加载完成后调用
    $(document).ready(function() {

        // ... 原有所有代码（导航、粒子、轮播等）...

        // 初始化栖息地滑动和画廊轮播（原有）
        initHabitatSlider();
        initGallerySlider();

    });

    // ============================================
    // 10. 🆕 点击炸开鸽子粒子特效（全局生效）
    // ============================================
    $(document).on('click', function(e) {
        // 调试：在控制台查看每次点击是否触发
        console.log('🕊️ 点击事件触发，坐标:', e.clientX, e.clientY);

        const clickX = e.clientX;
        const clickY = e.clientY;
        const particleCount = 12;

        for (let i = 0; i < particleCount; i++) {
            const angle = (360 / particleCount) * i + Math.random() * 30;
            const distance = 80 + Math.random() * 120;
            const duration = 600 + Math.random() * 400;
            const rad = angle * Math.PI / 180;
            const offsetX = Math.cos(rad) * distance;
            const offsetY = Math.sin(rad) * distance;

            const $dove = $('<i class="fas fa-dove"></i>');
            $dove.css({
                position: 'fixed',
                left: (clickX - 8) + 'px',   // 减去约一半宽度，实现居中
                top: (clickY - 8) + 'px',    // 减去约一半高度
                fontSize: '16px',
                color: '#b8d8a0',
                pointerEvents: 'none',
                zIndex: 99999,
                opacity: 1,
                transition: `all ${duration}ms ease-out`
            });
            $('body').append($dove);

            // 下一帧触发动画，让浏览器先渲染初始位置
            requestAnimationFrame(() => {
                $dove.css({
                    left: (clickX + offsetX - 8) + 'px',
                    top: (clickY + offsetY - 8) + 'px',
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0
                });
            });

            // 动画结束后移除元素
            setTimeout(() => {
                $dove.remove();
            }, duration + 50);
        }
    });

    // 鼠标移动生成飘落羽毛轨迹
    let moveThrottle = null;
    $(document).mousemove(function(e) {
        // 生成间隔30ms，羽毛更密集
        if (moveThrottle) return;
        moveThrottle = setTimeout(() => {
            moveThrottle = null;
            // 创建羽毛图标
            const feather = $('<i class="fas fa-feather"></i>');
            const size = 9 + Math.random() * 10;
            // 动画总时长缩短，小幅飘落
            const fallTime = 1200 + Math.random() * 600;
            // 左右随机偏移范围 -40 ~ 40px
            const swayX = (Math.random() - 0.5) * 80;
            // 向下只飘一小段，不再落到屏幕底部
            const fallY = 80 + Math.random() * 120;
            feather.css({
                position: 'fixed',
                left: e.clientX + 'px',
                top: e.clientY + 'px',
                fontSize: size + 'px',
                color: '#b8d8a0',
                textShadow: '0 0 6px #6f9a5f',
                pointerEvents: 'none',
                zIndex: 999999,
                opacity: 0.85,
                transform: 'translate(-50%, -50%)',
                transition: `all ${fallTime}ms ease-out`
            });
            $('body').append(feather);
            // 小幅向下漂移、轻微左右摆动、旋转、渐隐
            setTimeout(() => {
                feather.css({
                    transform: `translate(calc(-50% + ${swayX}px), calc(-50% + ${fallY}px)) rotate(${Math.random() * 360}deg)`,
                    opacity: 0
                });
            }, 10);
            // 动画结束销毁羽毛
            setTimeout(() => {
                feather.remove();
            }, fallTime);
        }, 30);
    });

});