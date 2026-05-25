package com.example.fundtracker.repository;

import com.example.fundtracker.entity.Portfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
  @Query("select p from Portfolio p join PortfolioMember m on m.portfolio = p where m.user.id = :userId order by p.updatedAt desc")
  List<Portfolio> findAccessibleByUserId(@Param("userId") Long userId);
}
