package com.example.fundtracker.service;

import com.example.fundtracker.common.BusinessException;
import com.example.fundtracker.dto.member.InviteMemberRequest;
import com.example.fundtracker.dto.member.MemberResponse;
import com.example.fundtracker.dto.member.UpdateMemberRoleRequest;
import com.example.fundtracker.entity.Portfolio;
import com.example.fundtracker.entity.PortfolioMember;
import com.example.fundtracker.entity.User;
import com.example.fundtracker.enums.MemberRole;
import com.example.fundtracker.repository.PortfolioMemberRepository;
import com.example.fundtracker.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {
  private final PortfolioMemberRepository memberRepository;
  private final UserRepository userRepository;
  private final PermissionService permissionService;
  private final PortfolioService portfolioService;

  public List<MemberResponse> list(Long portfolioId, Long userId) {
    permissionService.checkMember(portfolioId, userId);
    return memberRepository.findByPortfolioIdOrderByCreatedAtAsc(portfolioId).stream()
        .map(MemberResponse::from)
        .toList();
  }

  @Transactional
  public MemberResponse invite(Long portfolioId, InviteMemberRequest request, Long userId) {
    permissionService.checkOwner(portfolioId, userId);
    if (request.getRole() == MemberRole.OWNER) {
      throw new BusinessException("不能直接邀请 OWNER");
    }
    User targetUser = userRepository.findByUsername(request.getUsername())
        .orElseThrow(() -> new BusinessException("被邀请用户不存在"));
    if (memberRepository.existsByPortfolioIdAndUserId(portfolioId, targetUser.getId())) {
      throw new BusinessException("该用户已在组合中");
    }
    Portfolio portfolio = portfolioService.getPortfolio(portfolioId);
    PortfolioMember member = new PortfolioMember();
    member.setPortfolio(portfolio);
    member.setUser(targetUser);
    member.setRole(request.getRole());
    return MemberResponse.from(memberRepository.save(member));
  }

  @Transactional
  public MemberResponse updateRole(Long portfolioId, Long memberId, UpdateMemberRoleRequest request, Long userId) {
    permissionService.checkOwner(portfolioId, userId);
    if (request.getRole() == MemberRole.OWNER) {
      throw new BusinessException("不能设置为 OWNER");
    }
    PortfolioMember member = getPortfolioMember(portfolioId, memberId);
    if (member.getRole() == MemberRole.OWNER) {
      throw new BusinessException("不能修改 OWNER 自己的角色");
    }
    member.setRole(request.getRole());
    return MemberResponse.from(memberRepository.save(member));
  }

  @Transactional
  public void remove(Long portfolioId, Long memberId, Long userId) {
    permissionService.checkOwner(portfolioId, userId);
    PortfolioMember member = getPortfolioMember(portfolioId, memberId);
    if (member.getRole() == MemberRole.OWNER) {
      throw new BusinessException("不能移除 OWNER 自己");
    }
    memberRepository.delete(member);
  }

  private PortfolioMember getPortfolioMember(Long portfolioId, Long memberId) {
    return memberRepository.findById(memberId)
        .filter(member -> member.getPortfolio().getId().equals(portfolioId))
        .orElseThrow(() -> new BusinessException("成员不存在"));
  }
}
