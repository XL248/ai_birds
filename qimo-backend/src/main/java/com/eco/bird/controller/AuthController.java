package com.eco.bird.controller;

import com.eco.bird.entity.User;
import com.eco.bird.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Map<String, Object> result = new HashMap<>();

        if (username == null || username.trim().length() < 2 || username.trim().length() > 32 || username.contains(" ")) {
            result.put("success", false);
            result.put("message", "用户名需2-32字符，不含空格");
            return ResponseEntity.badRequest().body(result);
        }
        if (password == null || password.length() < 6) {
            result.put("success", false);
            result.put("message", "密码至少6个字符");
            return ResponseEntity.badRequest().body(result);
        }

        boolean success = userService.register(username.trim(), password);
        if (!success) {
            result.put("success", false);
            result.put("message", "用户名已被注册");
            return ResponseEntity.status(409).body(result);
        }
        result.put("success", true);
        result.put("message", "注册成功，请登录");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body, HttpSession session) {
        String username = body.get("username");
        String password = body.get("password");
        Map<String, Object> result = new HashMap<>();

        if (username == null || password == null || username.trim().isEmpty() || password.isEmpty()) {
            result.put("success", false);
            result.put("message", "请输入用户名和密码");
            return ResponseEntity.badRequest().body(result);
        }

        User user = userService.login(username.trim(), password);
        if (user == null) {
            result.put("success", false);
            result.put("message", "用户名或密码错误");
            return ResponseEntity.status(401).body(result);
        }

        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());

        result.put("success", true);
        result.put("message", "登录成功");
        result.put("username", user.getUsername());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "已安全退出");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId != null) {
            result.put("loggedIn", true);
            result.put("username", session.getAttribute("username"));
        } else {
            result.put("loggedIn", false);
        }
        return ResponseEntity.ok(result);
    }
}