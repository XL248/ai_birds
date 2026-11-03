package com.eco.bird.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.eco.bird.entity.User;
import com.eco.bird.dto.UserProfileDTO;

public interface UserService extends IService<User> {
    boolean register(String username, String password);
    User login(String username, String password);
    UserProfileDTO getProfile(Integer userId);
    boolean updateProfile(Integer userId, String nickname, String bio);
    boolean changePassword(Integer userId, String oldPassword, String newPassword);
}