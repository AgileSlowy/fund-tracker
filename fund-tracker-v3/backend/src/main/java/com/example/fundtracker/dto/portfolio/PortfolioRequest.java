package com.example.fundtracker.dto.portfolio;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PortfolioRequest {
  @NotBlank(message = "组合名称不能为空")
  private String name;

  private String description;
}
