package com.example.fundtracker.dto.member;

import com.example.fundtracker.enums.MemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMemberRoleRequest {
  @NotNull(message = "成员角色不能为空")
  private MemberRole role;
}
