package com.example.fundtracker.dto.record;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FundRecordRequest {
  @NotNull(message = "日期不能为空")
  private LocalDate date;

  @NotNull(message = "当日涨跌幅不能为空")
  private BigDecimal dailyRate;

  private BigDecimal deposit = BigDecimal.ZERO;
  private BigDecimal withdraw = BigDecimal.ZERO;
  private String note;
}
