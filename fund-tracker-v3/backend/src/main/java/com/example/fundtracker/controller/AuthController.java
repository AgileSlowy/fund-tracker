package com.example.fundtracker.controller;

import com.example.fundtracker.common.ApiResponse;
import com.example.fundtracker.dto.auth.LoginRequest;
import com.example.fundtracker.dto.auth.LoginResponse;
import com.example.fundtracker.dto.auth.RegisterRequest;
import com.example.fundtracker.dto.auth.UserResponse;
import com.example.fundtracker.security.CustomUserDetails;
import com.example.fundtracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @PostMapping("/register")
  public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ApiResponse.success("注册成功", authService.register(request));
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.success("登录成功", authService.login(request));
  }

  @GetMapping("/me")
  public ApiResponse<UserResponse> me(@AuthenticationPrincipal CustomUserDetails currentUser) {
    return ApiResponse.success(authService.me(currentUser));
  }
}
