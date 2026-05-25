package com.example.fundtracker.dto.record;

import com.example.fundtracker.enums.DuplicateStrategy;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ImportRecordsRequest {
  @NotNull(message = "重复日期处理策略不能为空")
  private DuplicateStrategy duplicateStrategy;

  @Valid
  private List<FundRecordRequest> records = new ArrayList<>();
}
