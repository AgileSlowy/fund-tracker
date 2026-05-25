<template>
  <section class="panel">
    <div class="panel-head">
      <div>
        <h2><span class="section-icon"><i class="ri-team-line"></i></span>成员管理</h2>
        <p class="panel-subtitle">OWNER 可邀请成员并调整 EDITOR / VIEWER 权限</p>
      </div>
    </div>

    <form v-if="canManage" class="member-form" @submit.prevent="invite">
      <input v-model.trim="form.username" type="text" placeholder="已注册用户名" required>
      <select v-model="form.role">
        <option value="EDITOR">EDITOR</option>
        <option value="VIEWER">VIEWER</option>
      </select>
      <button class="primary-button" type="submit">邀请成员</button>
    </form>

    <div class="table-wrap member-table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>昵称</th>
            <th>邮箱</th>
            <th>角色</th>
            <th v-if="canManage">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td>{{ member.username }}</td>
            <td>{{ member.nickname || "-" }}</td>
            <td>{{ member.email || "-" }}</td>
            <td>
              <select v-if="canManage && member.role !== 'OWNER'" :value="member.role" @change="updateRole(member, $event.target.value)">
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <span v-else>{{ member.role }}</span>
            </td>
            <td v-if="canManage">
              <button
                v-if="member.role !== 'OWNER'"
                class="danger-button small-button"
                type="button"
                @click="$emit('remove', member)"
              >
                移除
              </button>
              <span v-else class="text-muted">创建者</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { reactive } from "vue";

defineProps({
  members: {
    type: Array,
    required: true
  },
  canManage: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["invite", "update-role", "remove"]);

const form = reactive({
  username: "",
  role: "EDITOR"
});

function invite() {
  emit("invite", { username: form.username, role: form.role });
  form.username = "";
  form.role = "EDITOR";
}

function updateRole(member, role) {
  emit("update-role", { member, role });
}
</script>
