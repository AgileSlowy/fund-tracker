package com.example.fundtracker.dto.member;

import com.example.fundtracker.entity.PortfolioMember;
import com.example.fundtracker.enums.MemberRole;

public record MemberResponse(Long id, Long userId, String username, String nickname, String email, MemberRole role) {
  public static MemberResponse from(PortfolioMember member) {
    return new MemberResponse(
        member.getId(),
        member.getUser().getId(),
        member.getUser().getUsername(),
        member.getUser().getNickname(),
        member.getUser().getEmail(),
        member.getRole());
  }
}
