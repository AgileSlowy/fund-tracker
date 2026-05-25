package com.example.fundtracker.dto.portfolio;

import com.example.fundtracker.entity.Portfolio;
import com.example.fundtracker.enums.MemberRole;

public record PortfolioResponse(Long id, String name, String description, Long ownerId, String ownerName, MemberRole role) {
  public static PortfolioResponse from(Portfolio portfolio, MemberRole role) {
    return new PortfolioResponse(
        portfolio.getId(),
        portfolio.getName(),
        portfolio.getDescription(),
        portfolio.getOwner().getId(),
        portfolio.getOwner().getUsername(),
        role);
  }
}
