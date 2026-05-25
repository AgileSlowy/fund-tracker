package com.example.fundtracker.service;

import com.example.fundtracker.common.BusinessException;
import com.example.fundtracker.dto.record.FundRecordRequest;
import com.example.fundtracker.dto.record.FundRecordResponse;
import com.example.fundtracker.dto.record.ImportRecordsRequest;
import com.example.fundtracker.dto.record.ImportResultResponse;
import com.example.fundtracker.entity.FundRecord;
import com.example.fundtracker.entity.Portfolio;
import com.example.fundtracker.entity.User;
import com.example.fundtracker.enums.DuplicateStrategy;
import com.example.fundtracker.repository.FundRecordRepository;
import com.example.fundtracker.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FundRecordService {
  private final FundRecordRepository recordRepository;
  private final UserRepository userRepository;
  private final PortfolioService portfolioService;
  private final PermissionService permissionService;

  public List<FundRecordResponse> list(Long portfolioId, Long userId) {
    permissionService.checkMember(portfolioId, userId);
    return recordRepository.findByPortfolioIdOrderByDateAsc(portfolioId).stream()
        .map(FundRecordResponse::from)
        .toList();
  }

  @Transactional
  public FundRecordResponse create(Long portfolioId, FundRecordRequest request, Long userId) {
    permissionService.checkCanEditRecords(portfolioId, userId);
    validateRecord(request);
    if (recordRepository.existsByPortfolioIdAndDate(portfolioId, request.getDate())) {
      throw new BusinessException("同一组合下该日期记录已存在");
    }
    Portfolio portfolio = portfolioService.getPortfolio(portfolioId);
    User currentUser = getUser(userId);
    FundRecord record = new FundRecord();
    fillRecord(record, request);
    record.setPortfolio(portfolio);
    record.setCreatedBy(currentUser);
    record.setUpdatedBy(currentUser);
    return FundRecordResponse.from(recordRepository.save(record));
  }

  @Transactional
  public FundRecordResponse update(Long portfolioId, Long recordId, FundRecordRequest request, Long userId) {
    permissionService.checkCanEditRecords(portfolioId, userId);
    validateRecord(request);
    FundRecord record = getRecord(portfolioId, recordId);
    recordRepository.findByPortfolioIdAndDate(portfolioId, request.getDate())
        .filter(existing -> !existing.getId().equals(recordId))
        .ifPresent(existing -> {
          throw new BusinessException("同一组合下该日期记录已存在");
        });
    fillRecord(record, request);
    record.setUpdatedBy(getUser(userId));
    return FundRecordResponse.from(recordRepository.save(record));
  }

  @Transactional
  public void delete(Long portfolioId, Long recordId, Long userId) {
    permissionService.checkCanEditRecords(portfolioId, userId);
    FundRecord record = getRecord(portfolioId, recordId);
    recordRepository.delete(record);
  }

  @Transactional
  public ImportResultResponse importRecords(Long portfolioId, ImportRecordsRequest request, Long userId) {
    permissionService.checkCanEditRecords(portfolioId, userId);
    Portfolio portfolio = portfolioService.getPortfolio(portfolioId);
    User currentUser = getUser(userId);
    int success = 0;
    int skipped = 0;
    int failed = 0;

    for (FundRecordRequest recordRequest : request.getRecords()) {
      try {
        validateRecord(recordRequest);
        FundRecord record = recordRepository.findByPortfolioIdAndDate(portfolioId, recordRequest.getDate()).orElse(null);
        if (record != null && request.getDuplicateStrategy() == DuplicateStrategy.SKIP) {
          skipped++;
          continue;
        }
        if (record == null) {
          record = new FundRecord();
          record.setPortfolio(portfolio);
          record.setCreatedBy(currentUser);
        }
        fillRecord(record, recordRequest);
        record.setUpdatedBy(currentUser);
        recordRepository.save(record);
        success++;
      } catch (Exception exception) {
        failed++;
      }
    }
    return new ImportResultResponse(success, skipped, failed);
  }

  private FundRecord getRecord(Long portfolioId, Long recordId) {
    return recordRepository.findByPortfolioIdAndId(portfolioId, recordId)
        .orElseThrow(() -> new BusinessException("记录不存在"));
  }

  private User getUser(Long userId) {
    return userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
  }

  private void fillRecord(FundRecord record, FundRecordRequest request) {
    record.setDate(request.getDate());
    record.setDailyRate(request.getDailyRate());
    record.setDeposit(defaultZero(request.getDeposit()));
    record.setWithdraw(defaultZero(request.getWithdraw()));
    record.setNote(request.getNote());
  }

  private void validateRecord(FundRecordRequest request) {
    if (request.getDeposit() != null && request.getDeposit().compareTo(BigDecimal.ZERO) < 0) {
      throw new BusinessException("追加金额不能为负数");
    }
    if (request.getWithdraw() != null && request.getWithdraw().compareTo(BigDecimal.ZERO) < 0) {
      throw new BusinessException("赎回金额不能为负数");
    }
  }

  private BigDecimal defaultZero(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }
}
