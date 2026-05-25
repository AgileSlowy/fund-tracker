package com.example.fundtracker.dto.record;

public record ImportResultResponse(int successCount, int skippedCount, int failedCount) {
}
