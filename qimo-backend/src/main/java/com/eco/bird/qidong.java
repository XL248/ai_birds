package com.eco.bird;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 羽翼守望者 · 后端启动类。
 *
 * <p>前后端分离后，本进程只负责提供 /api/** 的 JSON 接口，不再渲染也不提供任何
 * 页面、样式、脚本与图片。原先那种"启动完自动打开浏览器跳到 main.html"的行为
 * 已经移除——页面现在由前端工程自己提供，后端不该替它决定地址。
 *
 * <p>启动：
 * <pre>
 *   mvn spring-boot:run
 *   # 或
 *   java -jar target/bird-watcher-1.0-SNAPSHOT.jar
 * </pre>
 *
 * <p>默认监听 {@code http://localhost:8080}，接口前缀 {@code /api}。
 */
@SpringBootApplication
@MapperScan("com.eco.bird.mapper")
public class qidong {

    public static void main(String[] args) {
        SpringApplication.run(qidong.class, args);
        System.out.println("""
                ============================================================
                  羽翼守望者 后端已启动（仅提供 API，不再伺服任何页面）
                  接口基址 : http://localhost:8080/api
                  健康检查 : http://localhost:8080/api/health
                  前端工程 : D:\\modify\\qimo-frontend（用任意静态服务器打开）
                ============================================================
                """);
    }
}
