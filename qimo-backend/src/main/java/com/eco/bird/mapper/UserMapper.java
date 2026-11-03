package com.eco.bird.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.eco.bird.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}