package com.example.fundtracker.service;

import com.example.fundtracker.common.BusinessException;
import com.example.fundtracker.dto.auth.LoginRequest;
import com.example.fundtracker.dto.auth.LoginResponse;
import com.example.fundtracker.dto.auth.RegisterRequest;
import com.example.fundtracker.dto.auth.UserResponse;
import com.example.fundtracker.entity.User;
import com.example.fundtracker.repository.UserRepository;
import com.example.fundtracker.security.CustomUserDetails;
import com.example.fundtracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;

  @Transactional
  public UserResponse register(RegisterRequest request) {
    if (!request.getPassword().equals(request.getConfirmPassword())) {
      throw new BusinessException("两次输入的密码不一致");
    }
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new BusinessException("用户名已存在");
    }

    User user = new User();
    user.setUsername(request.getUsername());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setNickname(request.getNickname());
    user.setEmail(request.getEmail());
    return UserResponse.from(userRepository.save(user));
  }

  public LoginResponse login(LoginRequest request) {
    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
      CustomUserDetails details = (CustomUserDetails) authentication.getPrincipal();
      User user = details.getUser();
      String token = jwtUtil.generateToken(user.getId(), user.getUsername());
      return new LoginResponse(token, UserResponse.from(user));
    } catch (Exception exception) {
      throw new BusinessException("用户名或密码错误");
    }
  }

  public UserResponse me(CustomUserDetails currentUser) {
    return UserResponse.from(currentUser.getUser());
  }
}
