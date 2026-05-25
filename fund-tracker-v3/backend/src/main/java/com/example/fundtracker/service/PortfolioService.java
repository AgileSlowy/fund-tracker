package com.example.fundtracker.service;

import com.example.fundtracker.common.BusinessException;
import com.example.fundtracker.dto.portfolio.PortfolioRequest;
import com.example.fundtracker.dto.portfolio.PortfolioResponse;
import com.example.fundtracker.entity.Portfolio;
import com.example.fundtracker.entity.PortfolioMember;
import com.example.fundtracker.entity.User;
import com.example.fundtracker.enums.MemberRole;
import com.example.fundtracker.repository.FundRecordRepository;
import com.example.fundtracker.repository.PortfolioMemberRepository;
import com.example.fundtracker.repository.PortfolioRepository;
import com.example.fundtracker.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PortfolioService {
  private final PortfolioRepository portfolioRepository;
  private final PortfolioMemberRepository memberRepository;
  private final FundRecordRepository recordRepository;
  private final UserRepository userRepository;
  private final PermissionService permissionService;

  public List<PortfolioResponse> list(Long userId) {
    return portfolioRepository.findAccessibleByUserId(userId).stream()
        .map(portfolio -> {
          MemberRole role = permissionService.checkMember(portfolio.getId(), userId).getRole();
          return PortfolioResponse.from(portfolio, role);
        })
        .toList();
  }

  @Transactional
  public PortfolioResponse create(PortfolioRequest request, Long userId) {
    User owner = userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
    Portfolio portfolio = new Portfolio();
    portfolio.setName(request.getName());
    portfolio.setDescription(request.getDescription());
    portfolio.setOwner(owner);
    Portfolio saved = portfolioRepository.save(portfolio);

    PortfolioMember member = new PortfolioMember();
    member.setPortfolio(saved);
    member.setUser(owner);
    member.setRole(MemberRole.OWNER);
    memberRepository.save(member);
    return PortfolioResponse.from(saved, MemberRole.OWNER);
  }

  public PortfolioResponse detail(Long portfolioId, Long userId) {
    PortfolioMember member = permissionService.checkMember(portfolioId, userId);
    return PortfolioResponse.from(member.getPortfolio(), member.getRole());
  }

  @Transactional
  public PortfolioResponse update(Long portfolioId, PortfolioRequest request, Long userId) {
    permissionService.checkOwner(portfolioId, userId);
    Portfolio portfolio = getPortfolio(portfolioId);
    portfolio.setName(request.getName());
    portfolio.setDescription(request.getDescription());
    return PortfolioResponse.from(portfolioRepository.save(portfolio), MemberRole.OWNER);
  }

  @Transactional
  public void delete(Long portfolioId, Long userId) {
    permissionService.checkOwner(portfolioId, userId);
    recordRepository.deleteByPortfolioId(portfolioId);
    memberRepository.deleteByPortfolioId(portfolioId);
    portfolioRepository.deleteById(portfolioId);
  }

  public Portfolio getPortfolio(Long portfolioId) {
    return portfolioRepository.findById(portfolioId)
        .orElseThrow(() -> new BusinessException("组合不存在"));
  }
}
