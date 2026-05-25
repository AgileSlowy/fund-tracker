package com.example.fundtracker.dto.record;

import com.example.fundtracker.entity.FundRecord;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FundRecordResponse(
    Long id,
    LocalDate date,
    BigDecimal dailyRate,
    BigDecimal deposit,
    BigDecimal withdraw,
    String note,
    Long createdBy,
    Long updatedBy) {
  public static FundRecordResponse from(FundRecord record) {
    return new FundRecordResponse(
        record.getId(),
        record.getDate(),
        record.getDailyRate(),
        record.getDeposit(),
        record.getWithdraw(),
        record.getNote(),
        record.getCreatedBy() == null ? null : record.getCreatedBy().getId(),
        record.getUpdatedBy() == null ? null : record.getUpdatedBy().getId());
  }
}
