package com.eco.bird.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 排行榜一行的对外结构。
 *
 * <p>注意字段名：前端 {@code html/user/leaderboard.html} 读的是
 * {@code u.checkin_count} / {@code u.fav_count}（下划线），而 Java 侧是驼峰，
 * 直接序列化会得到 {@code checkinCount}，页面上那一列就永远是空的。
 * 项目其他接口对外的字段也都是下划线风格（{@code created_at}、{@code bird_name}、
 * {@code earned_at}），所以这里用 {@link JsonProperty} 显式对齐，而不是去改前端。
 */
@Data
public class LeaderboardDTO {

    private String username;

    private String nickname;

    /** 答题最高分，对外保持驼峰（前端目前没有使用这个字段）。 */
    private Integer quizHighScore;

    /** 打卡种数。前端按 {@code u.checkin_count} 读取。 */
    @JsonProperty("checkin_count")
    private Integer checkinCount;

    /** 收藏种数。前端按 {@code u.fav_count} 读取。 */
    @JsonProperty("fav_count")
    private Integer favCount;
}
