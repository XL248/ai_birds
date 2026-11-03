package com.eco.bird.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨源访问配置（前后端分离的关键一环）。
 *
 * <p>分离前页面由同一个 Spring Boot 发出，所有请求都是同源，浏览器不会拦。
 * 分离后前端跑在另一个地址上（例如静态服务器 5173、Nginx 80、或者前端同学自己的
 * 机器），浏览器的同源策略会要求后端在预检请求里明确说"我允许这个来源"。
 *
 * <p>这里用的是<b>精确来源</b>而不是通配符 {@code *}，原因有两个：
 * <ol>
 *   <li>{@code Access-Control-Allow-Origin: *} 与 {@code allowCredentials(true)}
 *       在规范里是互斥的，浏览器会直接拒绝带 Cookie 的请求；</li>
 *   <li>本项目登录态走 HttpSession + Cookie，必须 allow-credentials 才拿得到。</li>
 * </ol>
 *
 * <p>来源列表在 {@code application.properties} 里改：
 * <pre>
 *   app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173
 * </pre>
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /** 允许跨源访问的前端来源，逗号分隔，不要写结尾斜杠。 */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500}")
    private String[] allowedOrigins;

    /** 预检结果缓存秒数，避免每个请求都先飞一次 OPTIONS。 */
    @Value("${app.cors.max-age:3600}")
    private long maxAge;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                // 项目里用了 GET / POST / PUT / DELETE 四种方法
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // 让浏览器把 JSESSIONID（或 connect.sid）带上来
                .allowCredentials(true)
                .maxAge(maxAge);
    }
}
