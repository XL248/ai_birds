package com.eco.bird.dto;

import lombok.Data;
import java.time.LocalDateTime;
@Data
public class UserProfileDTO {
    private Integer id;
    private String username;
    private String nickname;
    private String bio;
    private String avatar;
    private LocalDateTime createdAt;
}