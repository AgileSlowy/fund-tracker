package com.example.fundtracker.controller;

import com.example.fundtracker.common.ApiResponse;
import com.example.fundtracker.dto.record.FundRecordRequest;
import com.example.fundtracker.dto.record.FundRecordResponse;
import com.example.fundtracker.dto.record.ImportRecordsRequest;
import com.example.fundtracker.dto.record.ImportResultResponse;
import com.example.fundtracker.security.CustomUserDetails;
import com.example.fundtracker.service.FundRecordService;
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
@RequestMapping("/api/portfolios/{portfolioId}/records")
@RequiredArgsConstructor
public class FundRecordController {
  private final FundRecordService recordService;

  @GetMapping
  public ApiResponse<List<FundRecordResponse>> list(@PathVariable Long portfolioId,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(recordService.list(portfolioId, user.getUserId()));
  }

  @PostMapping
  public ApiResponse<FundRecordResponse> create(@PathVariable Long portfolioId,
      @Valid @RequestBody FundRecordRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(recordService.create(portfolioId, request, user.getUserId()));
  }

  @PutMapping("/{recordId}")
  public ApiResponse<FundRecordResponse> update(@PathVariable Long portfolioId,
      @PathVariable Long recordId,
      @Valid @RequestBody FundRecordRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(recordService.update(portfolioId, recordId, request, user.getUserId()));
  }

  @DeleteMapping("/{recordId}")
  public ApiResponse<Void> delete(@PathVariable Long portfolioId,
      @PathVariable Long recordId,
      @AuthenticationPrincipal CustomUserDetails user) {
    recordService.delete(portfolioId, recordId, user.getUserId());
    return ApiResponse.success(null);
  }

  @PostMapping("/import")
  public ApiResponse<ImportResultResponse> importRecords(@PathVariable Long portfolioId,
      @Valid @RequestBody ImportRecordsRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(recordService.importRecords(portfolioId, request, user.getUserId()));
  }
}
