package com.example.fundtracker.service;

import com.example.fundtracker.common.BusinessException;
import com.example.fundtracker.entity.PortfolioMember;
import com.example.fundtracker.enums.MemberRole;
import com.example.fundtracker.repository.PortfolioMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {
  private final PortfolioMemberRepository memberRepository;

  public PortfolioMember checkMember(Long portfolioId, Long userId) {
    return memberRepository.findByPortfolioIdAndUserId(portfolioId, userId)
        .orElseThrow(() -> new BusinessException(403, "无权限访问该组合"));
  }

  public PortfolioMember checkOwner(Long portfolioId, Long userId) {
    PortfolioMember member = checkMember(portfolioId, userId);
    if (member.getRole() != MemberRole.OWNER) {
      throw new BusinessException(403, "只有 OWNER 可以操作");
    }
    return member;
  }

  public PortfolioMember checkCanEditRecords(Long portfolioId, Long userId) {
    PortfolioMember member = checkMember(portfolioId, userId);
    if (member.getRole() == MemberRole.VIEWER) {
      throw new BusinessException(403, "VIEWER 只能查看记录");
    }
    return member;
  }
}
