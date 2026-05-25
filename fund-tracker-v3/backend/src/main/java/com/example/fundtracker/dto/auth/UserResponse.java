package com.example.fundtracker.dto.auth;

import com.example.fundtracker.entity.User;

public record UserResponse(Long id, String username, String nickname, String email) {
  public static UserResponse from(User user) {
    return new UserResponse(user.getId(), user.getUsername(), user.getNickname(), user.getEmail());
  }
}
