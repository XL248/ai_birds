package com.eco.bird.config;

import org.springframework.context.annotation.Configuration;

/**
 * 会话配置说明（保留占位，提醒后来者这里发生过什么）。
 *
 * <p><b>原先这里有一个未生效的 {@code CookieSerializer} Bean</b>，把 Cookie 名设成
 * {@code connect.sid}，注释写着"与 Node.js 保持一致"。但它从来没有生效过：
 * Spring Session 需要配套实现（{@code spring-session-jdbc} 或 redis）才会接管会话，
 * 而 {@code pom.xml} 里只有 {@code spring-session-core}——那是一组接口，不会替代
 * Servlet 容器的会话。实测登录响应的 {@code Set-Cookie} 下发的是 {@code JSESSIONID}。
 *
 * <p>所以这个类现在什么都不配，原因有二：
 * <ol>
 *   <li>留着那个 Bean 会让人以为会话是 Spring Session 在管、Cookie 名叫 {@code connect.sid}，
 *       排查问题时被误导；</li>
 *   <li>真要改名，在 Spring Boot 里一行属性就够了，不需要写 Bean：
 *       <pre>server.servlet.session.cookie.name=connect.sid</pre>
 *       仍然不需要引入 Spring Session。</li>
 * </ol>
 *
 * <p>登录态本身是好的：会话存在 Servlet 容器里（重启即失效），Cookie 名 {@code JSESSIONID}，
 * {@code config/SessionConfig} 不再参与。如果需要"重启后仍保持登录"，才需要引入
 * {@code spring-session-jdbc} 并建 Spring Session 自己的表结构
 * （注意：不是 init.sql 里那张 {@code sessions} 表，字段格式不兼容）。
 */
@Configuration
public class SessionConfig {
}
