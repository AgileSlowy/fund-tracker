package com.example.fundtracker.exception;

import com.example.fundtracker.common.ApiResponse;
import com.example.fundtracker.common.BusinessException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException exception) {
    HttpStatus status = exception.getCode() == 403 ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
    return ResponseEntity.status(status).body(ApiResponse.error(exception.getCode(), exception.getMessage()));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException exception) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(403, "无权限访问"));
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
  public ResponseEntity<ApiResponse<Void>> handleValidation(Exception exception) {
    String message = "请求参数不合法";
    if (exception instanceof MethodArgumentNotValidException validException
        && validException.getBindingResult().getFieldError() != null) {
      message = validException.getBindingResult().getFieldError().getDefaultMessage();
    }
    return ResponseEntity.badRequest().body(ApiResponse.error(400, message));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleException(Exception exception) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, exception.getMessage()));
  }
}
