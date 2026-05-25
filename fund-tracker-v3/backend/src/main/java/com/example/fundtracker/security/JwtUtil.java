package com.example.fundtracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
  private final SecretKey key;
  private final long expiration;

  public JwtUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration}") long expiration) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
  }

  public String generateToken(Long userId, String username) {
    Date now = new Date();
    return Jwts.builder()
        .subject(username)
        .claim("userId", userId)
        .claim("username", username)
        .issuedAt(now)
        .expiration(new Date(now.getTime() + expiration))
        .signWith(key)
        .compact();
  }

  public String getUsername(String token) {
    return parseClaims(token).getSubject();
  }

  public boolean validateToken(String token) {
    parseClaims(token);
    return true;
  }

  private Claims parseClaims(String token) {
    return Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }
}
