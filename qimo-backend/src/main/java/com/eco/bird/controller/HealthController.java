package com.eco.bird.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查接口，给前端和运维用。
 *
 * <p>前后端分离之后，"接口通不通"是排查问题的第一件事，所以留一个不需要登录、
 * 不碰数据库的探针：
 * <pre>
 *   curl http://localhost:8080/api/health
 *   {"success":true,"service":"qimo-backend","time":"...","apiPrefix":"/api"}
 * </pre>
 *
 * <p>前端页面也可以在控制台执行 {@code QIMO_API.get('/api/health')} 来确认
 * {@code config/api-base.js} 里的地址配对了没有。
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("service", "qimo-backend");
        body.put("apiPrefix", "/api");
        body.put("time", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }
}
