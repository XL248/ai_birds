package com.eco.bird.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentDTO {
    private Integer id;
    private String content;
    private LocalDateTime createdAt;
    private String username;
    private String nickname;
}