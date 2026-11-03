package com.eco.bird.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eco.bird.dto.DiaryListDTO;
import com.eco.bird.entity.Diary;
import com.eco.bird.entity.Favorite;
import com.eco.bird.service.SocialService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    private Integer getUserId(HttpSession session) {
        return (Integer) session.getAttribute("userId");
    }

    // ========== 打卡 ==========
    @PostMapping("/checkin")
    public ResponseEntity<Map<String, Object>> checkin(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String birdName = body.get("birdName");
        if (birdName == null || birdName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "缺少鸟名"));
        }
        boolean success = socialService.checkin(userId, birdName.trim());
        int total = socialService.getCheckinCount(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "打卡成功！", "total", total));
    }

    @DeleteMapping("/checkin")
    public ResponseEntity<Map<String, Object>> cancelCheckin(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String birdName = body.get("birdName");
        socialService.cancelCheckin(userId, birdName);
        int total = socialService.getCheckinCount(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "已取消打卡", "total", total));
    }

    @GetMapping("/checkins")
    public ResponseEntity<Map<String, Object>> checkins(HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "birds", socialService.getCheckins(userId),
                "total", socialService.getCheckinCount(userId)
        ));
    }

    @GetMapping("/bird-status")
    public ResponseEntity<Map<String, Object>> birdStatus(@RequestParam String birdName, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.ok(Map.of("checkedIn", false, "favorited", false));
        }
        return ResponseEntity.ok(Map.of(
                "checkedIn", socialService.isCheckedIn(userId, birdName),
                "favorited", socialService.isFavorited(userId, birdName)
        ));
    }

    // ========== 收藏 ==========
    @PostMapping("/favorite")
    public ResponseEntity<Map<String, Object>> favorite(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String birdName = body.get("birdName");
        if (birdName == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false));
        }
        socialService.favorite(userId, birdName.trim());
        return ResponseEntity.ok(Map.of("success", true, "message", "已收藏"));
    }

    @DeleteMapping("/favorite")
    public ResponseEntity<Map<String, Object>> cancelFavorite(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String birdName = body.get("birdName");
        socialService.cancelFavorite(userId, birdName);
        return ResponseEntity.ok(Map.of("success", true, "message", "已取消收藏"));
    }

    @GetMapping("/favorites")
    public ResponseEntity<Map<String, Object>> favorites(HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        return ResponseEntity.ok(Map.of("success", true, "birds", socialService.getFavorites(userId)));
    }

    // ========== 评论 ==========
    @GetMapping("/comments")
    public ResponseEntity<Map<String, Object>> comments(@RequestParam String birdName) {
        if (birdName == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false));
        }
        return ResponseEntity.ok(Map.of("success", true, "comments", socialService.getComments(birdName)));
    }

    @PostMapping("/comment")
    public ResponseEntity<Map<String, Object>> comment(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String birdName = body.get("birdName");
        String content = body.get("content");
        if (birdName == null || content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "内容不能为空"));
        }
        if (content.length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "评论不超过500字"));
        }
        socialService.addComment(userId, birdName, content.trim());
        return ResponseEntity.ok(Map.of("success", true, "message", "评论已发布"));
    }

    // ========== 日记 ==========
    @PostMapping("/diary")
    public ResponseEntity<Map<String, Object>> addDiary(@RequestBody Map<String, String> body, HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "请先登录"));
        }
        String title = body.get("title");
        if (title == null || title.trim().isEmpty() || title.length() > 128) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "标题必填且128字以内"));
        }
        socialService.addDiary(userId, title.trim(), body.get("content"), body.get("location"), body.get("birdName"));
        return ResponseEntity.ok(Map.of("success", true, "message", "日记已发布"));
    }

    @GetMapping("/diaries")
    public ResponseEntity<Map<String, Object>> diaries(@RequestParam(defaultValue = "1") int page) {
        Page<DiaryListDTO> diaryPage = socialService.getDiaries(page, 10);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "diaries", diaryPage.getRecords(),
                "total", diaryPage.getTotal(),
                "page", page,
                "totalPages", diaryPage.getPages()
        ));
    }

    @GetMapping("/diary/{id}")
    public ResponseEntity<Map<String, Object>> diary(@PathVariable Integer id) {
        Diary d = socialService.getDiaryById(id);
        if (d == null) {
            return ResponseEntity.status(404).body(Map.of("success", false));
        }
        return ResponseEntity.ok(Map.of("success", true, "diary", d));
    }

    // ========== 排行榜 ==========
    @GetMapping("/leaderboard")
    public ResponseEntity<Map<String, Object>> leaderboard() {
        return ResponseEntity.ok(Map.of("success", true, "leaderboard", socialService.getLeaderboard()));
    }

    // ========== 成就 ==========
    @GetMapping("/achievements")
    public ResponseEntity<Map<String, Object>> achievements(HttpSession session) {
        Integer userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.ok(Map.of("success", true, "badges", new ArrayList<>()));
        }
        List<Map<String, Object>> badges = socialService.getAchievements(userId);
        return ResponseEntity.ok(Map.of("success", true, "badges", badges));
    }
}