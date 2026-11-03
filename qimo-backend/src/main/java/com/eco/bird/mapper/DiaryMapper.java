package com.eco.bird.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.eco.bird.entity.Diary;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DiaryMapper extends BaseMapper<Diary> {
}