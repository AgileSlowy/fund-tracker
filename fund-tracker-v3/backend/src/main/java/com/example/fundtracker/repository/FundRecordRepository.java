package com.example.fundtracker.repository;

import com.example.fundtracker.entity.FundRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FundRecordRepository extends JpaRepository<FundRecord, Long> {
  List<FundRecord> findByPortfolioIdOrderByDateAsc(Long portfolioId);

  Optional<FundRecord> findByPortfolioIdAndId(Long portfolioId, Long id);

  Optional<FundRecord> findByPortfolioIdAndDate(Long portfolioId, LocalDate date);

  boolean existsByPortfolioIdAndDate(Long portfolioId, LocalDate date);

  void deleteByPortfolioId(Long portfolioId);
}
