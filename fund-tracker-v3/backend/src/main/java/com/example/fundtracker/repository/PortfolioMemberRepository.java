package com.example.fundtracker.repository;

import com.example.fundtracker.entity.PortfolioMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioMemberRepository extends JpaRepository<PortfolioMember, Long> {
  Optional<PortfolioMember> findByPortfolioIdAndUserId(Long portfolioId, Long userId);

  boolean existsByPortfolioIdAndUserId(Long portfolioId, Long userId);

  List<PortfolioMember> findByPortfolioIdOrderByCreatedAtAsc(Long portfolioId);

  void deleteByPortfolioId(Long portfolioId);
}
