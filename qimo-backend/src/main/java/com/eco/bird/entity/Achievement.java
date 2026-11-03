package com.eco.bird.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("achievements")
public class Achievement {
    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("user_id")
    private Integer userId;
    @TableField("badge_name")
    private String badgeName;
    @TableField(value = "earned_at", fill = FieldFill.INSERT)
    private LocalDateTime earnedAt;
}