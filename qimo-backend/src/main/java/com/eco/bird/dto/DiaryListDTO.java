package com.eco.bird.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DiaryListDTO {
    private Integer id;
    private String title;
    private String content;
    private String location;
    private String birdName;
    private LocalDateTime createdAt;
    private String username;
    private String nickname;
}