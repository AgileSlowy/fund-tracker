package com.example.fundtracker.controller;

import com.example.fundtracker.common.ApiResponse;
import com.example.fundtracker.dto.portfolio.PortfolioRequest;
import com.example.fundtracker.dto.portfolio.PortfolioResponse;
import com.example.fundtracker.security.CustomUserDetails;
import com.example.fundtracker.service.PortfolioService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {
  private final PortfolioService portfolioService;

  @GetMapping
  public ApiResponse<List<PortfolioResponse>> list(@AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(portfolioService.list(user.getUserId()));
  }

  @PostMapping
  public ApiResponse<PortfolioResponse> create(@Valid @RequestBody PortfolioRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(portfolioService.create(request, user.getUserId()));
  }

  @GetMapping("/{portfolioId}")
  public ApiResponse<PortfolioResponse> detail(@PathVariable Long portfolioId,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(portfolioService.detail(portfolioId, user.getUserId()));
  }

  @PutMapping("/{portfolioId}")
  public ApiResponse<PortfolioResponse> update(@PathVariable Long portfolioId,
      @Valid @RequestBody PortfolioRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(portfolioService.update(portfolioId, request, user.getUserId()));
  }

  @DeleteMapping("/{portfolioId}")
  public ApiResponse<Void> delete(@PathVariable Long portfolioId, @AuthenticationPrincipal CustomUserDetails user) {
    portfolioService.delete(portfolioId, user.getUserId());
    return ApiResponse.success(null);
  }
}
