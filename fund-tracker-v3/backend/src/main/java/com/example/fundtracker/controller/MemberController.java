package com.example.fundtracker.controller;

import com.example.fundtracker.common.ApiResponse;
import com.example.fundtracker.dto.member.InviteMemberRequest;
import com.example.fundtracker.dto.member.MemberResponse;
import com.example.fundtracker.dto.member.UpdateMemberRoleRequest;
import com.example.fundtracker.security.CustomUserDetails;
import com.example.fundtracker.service.MemberService;
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
@RequestMapping("/api/portfolios/{portfolioId}/members")
@RequiredArgsConstructor
public class MemberController {
  private final MemberService memberService;

  @GetMapping
  public ApiResponse<List<MemberResponse>> list(@PathVariable Long portfolioId,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(memberService.list(portfolioId, user.getUserId()));
  }

  @PostMapping
  public ApiResponse<MemberResponse> invite(@PathVariable Long portfolioId,
      @Valid @RequestBody InviteMemberRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(memberService.invite(portfolioId, request, user.getUserId()));
  }

  @PutMapping("/{memberId}")
  public ApiResponse<MemberResponse> updateRole(@PathVariable Long portfolioId,
      @PathVariable Long memberId,
      @Valid @RequestBody UpdateMemberRoleRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    return ApiResponse.success(memberService.updateRole(portfolioId, memberId, request, user.getUserId()));
  }

  @DeleteMapping("/{memberId}")
  public ApiResponse<Void> remove(@PathVariable Long portfolioId,
      @PathVariable Long memberId,
      @AuthenticationPrincipal CustomUserDetails user) {
    memberService.remove(portfolioId, memberId, user.getUserId());
    return ApiResponse.success(null);
  }
}
