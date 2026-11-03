package com.eco.bird.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.eco.bird.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}