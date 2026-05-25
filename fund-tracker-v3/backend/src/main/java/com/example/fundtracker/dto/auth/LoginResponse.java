package com.example.fundtracker.dto.auth;

public record LoginResponse(String token, UserResponse user) {
}
