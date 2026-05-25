package com.example.fundtracker.dto.member;

import com.example.fundtracker.enums.MemberRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteMemberRequest {
  @NotBlank(message = "用户名不能为空")
  private String username;

  @NotNull(message = "成员角色不能为空")
  private MemberRole role;
}
