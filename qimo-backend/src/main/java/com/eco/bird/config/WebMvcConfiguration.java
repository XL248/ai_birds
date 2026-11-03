package com.eco.bird.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 后端自身的 Web 行为。
 *
 * <p>分离后后端不再提供任何页面，所以这里只保留一件小事：把根路径 {@code /}
 * 重定向到 {@code /api/health}。以前访问 {@code http://localhost:8080/} 会看到
 * 静态首页，现在那必须变成一个明确的"这里只有 API，首页在别处"的提示，否则
 * 别人打开根路径只会拿到一个没有解释的 404。
 *
 * <p>注意：这里**没有**开启静态资源映射，也不要把前端产物拷进
 * {@code src/main/resources/static}——那等于把两边又粘回去，就白分离了。
 * 如果你确实需要单机部署，请按照 README 的"方式三：Nginx 同域部署"做反向代理。
 */
@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 根路径指向健康检查，让"后端是否活着"有一个一眼可看的入口
        registry.addRedirectViewController("/", "/api/health");
    }
}
