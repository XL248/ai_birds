package com.eco.bird.controller;

import com.eco.bird.dto.UserProfileDTO;
import com.eco.bird.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private Integer getUserId(HttpSession session) {
        return (Integer) session.getAttribute("userId");
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        UserProfileDTO profile = userService.getProfile(userId);
        if (profile == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "用户不存在"));
        }
        return ResponseEntity.ok(Map.of("success", true, "profile", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String nickname = body.get("nickname");
        String bio = body.get("bio");
        if (nickname != null && nickname.length() > 32) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "昵称不超过32字符"));
        }
        if (bio != null && bio.length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "简介不超过500字符"));
        }
        boolean success = userService.updateProfile(userId, nickname, bio);
        if (!success) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "更新失败"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "资料已更新"));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "请填写旧密码和新密码"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "新密码至少6个字符"));
        }
        boolean success = userService.changePassword(userId, oldPassword, newPassword);
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "旧密码不正确"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "密码已更新"));
    }
}