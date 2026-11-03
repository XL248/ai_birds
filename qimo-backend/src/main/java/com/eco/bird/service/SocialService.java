package com.eco.bird.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eco.bird.dto.*;
import com.eco.bird.entity.*;
import com.eco.bird.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialService {

    private final CheckinMapper checkinMapper;
    private final FavoriteMapper favoriteMapper;
    private final CommentMapper commentMapper;
    private final DiaryMapper diaryMapper;
    private final AchievementMapper achievementMapper;
    private final UserMapper userMapper;

    // ========== 打卡 ==========
    @Transactional
    public boolean checkin(Integer userId, String birdName) {
        // 检查是否已打卡
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        if (checkinMapper.selectCount(wrapper) > 0) {
            return true; // 已打卡
        }
        Checkin checkin = new Checkin();
        checkin.setUserId(userId);
        checkin.setBirdName(birdName);
        boolean result = checkinMapper.insert(checkin) > 0;
        if (result) {
            checkAchievements(userId, birdName);
        }
        return result;
    }

    public int getCheckinCount(Integer userId) {
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        Long count = checkinMapper.selectCount(wrapper);
        return count.intValue();  // 👈 将 Long 转为 int
    }

    public List<Checkin> getCheckins(Integer userId) {
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("created_at");
        return checkinMapper.selectList(wrapper);
    }

    public boolean cancelCheckin(Integer userId, String birdName) {
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        return checkinMapper.delete(wrapper) > 0;
    }

    // ========== 收藏 ==========
    public boolean favorite(Integer userId, String birdName) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        if (favoriteMapper.selectCount(wrapper) > 0) {
            return true;
        }
        Favorite fav = new Favorite();
        fav.setUserId(userId);
        fav.setBirdName(birdName);
        return favoriteMapper.insert(fav) > 0;
    }

    public boolean cancelFavorite(Integer userId, String birdName) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        return favoriteMapper.delete(wrapper) > 0;
    }

    public List<Favorite> getFavorites(Integer userId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("created_at");
        return favoriteMapper.selectList(wrapper);
    }

    // ========== 鸟的状态 ==========
    public boolean isCheckedIn(Integer userId, String birdName) {
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        return checkinMapper.selectCount(wrapper) > 0;
    }

    public boolean isFavorited(Integer userId, String birdName) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("bird_name", birdName);
        return favoriteMapper.selectCount(wrapper) > 0;
    }

    // ========== 评论 ==========
    public List<CommentDTO> getComments(String birdName) {
        List<CommentDTO> result = new ArrayList<>();
        QueryWrapper<Comment> wrapper = new QueryWrapper<>();
        wrapper.eq("bird_name", birdName).orderByDesc("created_at").last("LIMIT 50");
        List<Comment> comments = commentMapper.selectList(wrapper);
        for (Comment c : comments) {
            CommentDTO dto = new CommentDTO();
            dto.setId(c.getId());
            dto.setContent(c.getContent());
            dto.setCreatedAt(c.getCreatedAt());
            User user = userMapper.selectById(c.getUserId());
            if (user != null) {
                dto.setUsername(user.getUsername());
                dto.setNickname(user.getNickname());
            }
            result.add(dto);
        }
        return result;
    }

    public boolean addComment(Integer userId, String birdName, String content) {
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setBirdName(birdName);
        comment.setContent(content);
        return commentMapper.insert(comment) > 0;
    }

    // ========== 日记 ==========
    public boolean addDiary(Integer userId, String title, String content, String location, String birdName) {
        Diary diary = new Diary();
        diary.setUserId(userId);
        diary.setTitle(title);
        diary.setContent(content);
        diary.setLocation(location);
        diary.setBirdName(birdName);
        return diaryMapper.insert(diary) > 0;
    }

    public Page<DiaryListDTO> getDiaries(int page, int limit) {
        Page<Diary> pageParam = new Page<>(page, limit);
        QueryWrapper<Diary> wrapper = new QueryWrapper<>();
        wrapper.orderByDesc("created_at");
        Page<Diary> diaryPage = diaryMapper.selectPage(pageParam, wrapper);
        Page<DiaryListDTO> result = new Page<>(page, limit);
        List<DiaryListDTO> list = new ArrayList<>();
        for (Diary d : diaryPage.getRecords()) {
            DiaryListDTO dto = new DiaryListDTO();
            dto.setId(d.getId());
            dto.setTitle(d.getTitle());
            dto.setContent(d.getContent());
            dto.setLocation(d.getLocation());
            dto.setBirdName(d.getBirdName());
            dto.setCreatedAt(d.getCreatedAt());
            User user = userMapper.selectById(d.getUserId());
            if (user != null) {
                dto.setUsername(user.getUsername());
                dto.setNickname(user.getNickname());
            }
            list.add(dto);
        }
        result.setRecords(list);
        result.setTotal(diaryPage.getTotal());
        return result;
    }

    public Diary getDiaryById(Integer id) {
        return diaryMapper.selectById(id);
    }

    // ========== 排行榜 ==========
    /**
     * 观鸟排行榜：按「打卡种数 → 收藏种数 → 答题最高分」排序，最多返回 100 名。
     *
     * <p>原先这里是个未实现的桩（直接 {@code return new ArrayList<>()}），注释里写着
     * "简单起见，这里返回空" —— 于是排行榜页面永远是"还没有数据"，而后端的
     * {@code /api/social/leaderboard} 一直返回 {@code {"leaderboard":[],"success":true}}。
     * 前端读的是 {@code checkin_count} / {@code fav_count} 两个下划线字段，这里补齐。
     *
     * <p>没有用 GROUP BY 聚合 SQL，而是把两张关联表整体取回后在内存里归并：本项目的
     * 数据量是"几个用户 × 几十条记录"级别，一次查询换来不写原生 SQL、不建 Mapper XML，
     * 可读性更划算。等数据量真长大了再换成聚合查询或引入缓存。
     *
     * @return 按名次排好的榜单；没有任何用户时返回空列表。
     */
    public List<LeaderboardDTO> getLeaderboard() {
        Map<Integer, Integer> checkinCounts = new HashMap<>();
        for (Checkin c : checkinMapper.selectList(null)) {
            checkinCounts.merge(c.getUserId(), 1, Integer::sum);
        }

        Map<Integer, Integer> favoriteCounts = new HashMap<>();
        for (Favorite f : favoriteMapper.selectList(null)) {
            favoriteCounts.merge(f.getUserId(), 1, Integer::sum);
        }

        List<LeaderboardDTO> board = new ArrayList<>();
        for (User user : userMapper.selectList(null)) {
            LeaderboardDTO dto = new LeaderboardDTO();
            dto.setUsername(user.getUsername());
            dto.setNickname(user.getNickname());
            dto.setQuizHighScore(user.getQuizHighScore());
            dto.setCheckinCount(checkinCounts.getOrDefault(user.getId(), 0));
            dto.setFavCount(favoriteCounts.getOrDefault(user.getId(), 0));
            board.add(dto);
        }

        board.sort(Comparator
                .comparing(LeaderboardDTO::getCheckinCount, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(LeaderboardDTO::getFavCount, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(LeaderboardDTO::getQuizHighScore, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(LeaderboardDTO::getUsername, Comparator.nullsLast(Comparator.naturalOrder())));

        return board.size() > 100 ? new ArrayList<>(board.subList(0, 100)) : board;
    }

    // ========== 成就系统 ==========
    private static final String[][] BADGE_CATEGORIES = {
            {"森林专家", "🌲", "啄木鸟|鸱鸮|猫头鹰|雕鸮|灰林鸮|长尾林鸮|乌林鸮|松鸡|西方松鸡|黑琴鸡|花尾榛鸡|山雀|大山雀|绿背山雀|沼泽山雀|鹰|苍鹰|雀鹰|松雀鹰|杜鹃|大杜鹃|四声杜鹃|小杜鹃|鸦|渡鸦|喜鹊|灰喜鹊|寒鸦|松鸦|红嘴蓝鹊|柳莺|黄眉柳莺|冠纹柳莺|褐柳莺"},
            {"湿地探索者", "💧", "鹭|苍鹭|小白鹭|池鹭|大白鹭|夜鹭|黄冠夜鹭|栗夜鹭|海南鳽|棕夜鹭|鸭|绿头鸭|赤膀鸭|斑嘴鸭|鸊鷉|小鸊鷉|凤头鸊鷉|角鸊鷉|鹮|白鹮|朱鹮|彩鹮|鹤|丹顶鹤|白鹤|灰鹤|秧鸡|澳洲紫水鸡|白骨顶|黑水鸡|董鸡|鸥|红嘴鸥|银鸥|黑尾鸥"},
            {"猛禽观察者", "🏔️", "高山|猛禽|雕|秃鹫|兀鹫|隼|猎隼|游隼|鵟|鸢|鹫|胡兀鹫|雪鸡|雪雀|岩鹨|山鹑|雉"},
            {"城市鸟友", "🏙️", "麻雀|喜鹊|灰喜鹊|乌鸦|鸽子|斑鸠|白头鹎|八哥|乌鸫|雨燕|家燕|椋鸟|画眉"}
    };

    public List<Map<String, Object>> getAchievements(Integer userId) {
        QueryWrapper<Achievement> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        List<Achievement> achievements = achievementMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Achievement ach : achievements) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", ach.getBadgeName());
            item.put("earned_at", ach.getEarnedAt());

            // 查找图标
            String icon = "📷"; // 默认
            for (String[] badge : BADGE_CATEGORIES) {
                if (badge[0].equals(ach.getBadgeName())) {
                    icon = badge[1];
                    break;
                }
            }
            // 特殊处理“百鸟之王”
            if ("百鸟之王".equals(ach.getBadgeName())) {
                icon = "👑";
            }
            item.put("icon", icon);
            result.add(item);
        }

        // 补充“百鸟之王”如果未获得但已达标（可选项，在查询时动态添加）
        // 这里只返回已获得的，所以不添加未获得的。

        return result;
    }

    @Transactional
    public void checkAchievements(Integer userId, String birdName) {
        // 检查各类徽章
        for (String[] badge : BADGE_CATEGORIES) {
            String badgeName = badge[0];
            String pattern = badge[2];
            if (birdName.matches(".*(" + pattern + ").*")) {
                try {
                    Achievement ach = new Achievement();
                    ach.setUserId(userId);
                    ach.setBadgeName(badgeName);
                    achievementMapper.insert(ach);
                } catch (Exception ignored) {}
            }
        }
        // 百鸟之王
        QueryWrapper<Checkin> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        Long count = checkinMapper.selectCount(wrapper);
        if (count >= 10) {
            try {
                Achievement ach = new Achievement();
                ach.setUserId(userId);
                ach.setBadgeName("百鸟之王");
                achievementMapper.insert(ach);
            } catch (Exception ignored) {}
        }
    }
}
