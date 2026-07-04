<template>
  <AppLayout>
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div class="tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-btn', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="tab-icon" />
          {{ tab.label }}
        </button>
      </div>

      <template v-if="activeTab === 'profile'">
        <div class="settings-card">
          <h3 class="card-title">Profile Picture</h3>
          <div class="avatar-row">
            <div class="avatar-circle">
              <img
                v-if="avatarPreview || profileData.profilePictureUrl"
                class="avatar-image"
                :src="avatarPreview || profileData.profilePictureUrl"
                alt="Avatar"
              />

              <span v-else class="avatar-initials">
                {{ initials }}
              </span>

              <div v-if="uploading" class="avatar-overlay">
                <span class="spinner" />
              </div>
            </div>

            <div class="avatar-actions">
              <label class="btn-outline">
                Upload Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  @change="onFileChange"
                  hidden
                />
              </label>

              <button class="btn-ghost" @click="deleteAvatar">Remove</button>
            </div>
            <p class="avatar-hint">JPG, PNG or GIF — max 2MB</p>
          </div>

          <p class="error-message" v-if="avatarError">{{ avatarError }}</p>

          <div v-if="uploading" class="progress-wrap">
            <div class="progress-bar" :style="{ width: progress + '%' }" />
          </div>
        </div>

        <div class="settings-card">
          <h3 class="card-title">Personal Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Full name</label>
              <input
                v-model="profileData.name"
                type="text"
                placeholder="John Doe"
                maxlength="255"
              />
            </div>
            <div class="form-group">
              <label>Email address</label>
              <input
                v-model="profileData.email"
                type="email"
                placeholder="you@example.com"
                disabled
              />
            </div>
            <div class="form-group">
              <label>Phone number</label>
              <input
                v-model="profileData.phoneNumber"
                type="tel"
                placeholder="11987654321"
                maxlength="15"
                inputmode="numeric"
                @input="profileData.phoneNumber = profileData.phoneNumber.replace(/\D/g, '')"
              />
            </div>
            <div class="form-group">
              <label>Company</label>
              <input
                v-model="profileData.company"
                type="text"
                placeholder="Acme Inc."
                maxlength="100"
              />
            </div>
          </div>

          <div class="messages-container">
            <p class="error-message" v-if="profileFeedback.error">{{ profileFeedback.error }}</p>
            <p class="success-message" v-if="profileFeedback.success">{{ profileFeedback.success }}</p>
          </div>

          <div class="card-footer">
            <button class="btn-primary" :disabled="saving" @click="saveChanges">
              <span v-if="saving" class="spinner" />
              <span v-else>Save changes</span>
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3 class="card-title">Change Password</h3>
          <div class="form-grid single">
            <div class="form-group">
              <label>Current password</label>
              <input type="password" placeholder="••••••••" v-model="currentPassword" />
            </div>
            <div class="form-group">
              <label>New password</label>
              <input type="password" placeholder="••••••••" v-model="newPassword" />
            </div>
            <div class="form-group">
              <label>Confirm new password</label>
              <input type="password" placeholder="••••••••" v-model="confirmNewPassword" />
            </div>
          </div>

          <div class="messages-container">
            <p class="error-message" v-if="passwordFeedback.error">{{ passwordFeedback.error }}</p>
            <p class="success-message" v-if="passwordFeedback.success">{{ passwordFeedback.success }}</p>
          </div>

          <div class="card-footer">
            <button class="btn-primary" :disabled="passwordSaving" @click="updatePassword">
              <span v-if="passwordSaving" class="spinner" />
              <span v-else>Update password</span>
            </button>
          </div>
        </div>
      </template>

      <div class="settings-card danger-card" v-if="activeTab === 'profile'">
        <h3 class="card-title danger-title">Danger Zone</h3>
        <div class="danger-rows">
          <div class="danger-row">
            <div>
              <span class="danger-row-title">Delete account</span>
              <span class="danger-row-desc">Permanently delete your account and all associated data</span>
            </div>
            <button class="btn-danger" @click="openDeleteAccountModal">Delete account</button>
          </div>

          <p class="error-message" v-if="dangerFeedback.error" style="margin-top: 16px;">
            {{ dangerFeedback.error }}
          </p>

          <Transition name="modal">
            <div v-if="showAccountDeleteModal" class="modal-overlay" @click="closeDeleteAccountModal">
              <div class="delete-modal" @click.stop>
                <div class="modal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <h3 class="modal-title">Delete account?</h3>
                <p class="modal-description">
                  This action cannot be undone. Your account <strong>{{ profileData.email }}</strong> will be permanently removed.
                </p>
                <div class="modal-actions">
                  <button class="modal-btn secondary" @click="closeDeleteAccountModal">Cancel</button>
                  <button class="modal-btn danger" @click="deleteAccount">Delete Account</button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from './AppLayout.vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.js'

const activeTab = ref('profile')
const saving = ref(false)
const passwordSaving = ref(false)
const selectedFile = ref(null)
const avatarPreview = ref('')
const uploading = ref(false)
const progress = ref(0)

const avatarError = ref('')
const profileFeedback = reactive({ success: '', error: '' })
const passwordFeedback = reactive({ success: '', error: '' })
const dangerFeedback = reactive({ error: '' })

const profileData = reactive({
  name: '',
  email: '',
  phoneNumber: '',
  company: '',
  profilePictureUrl: '',
})

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showAccountDeleteModal = ref(false)
const router = useRouter()
const authStore = useAuthStore()

function openDeleteAccountModal() { showAccountDeleteModal.value = true }
function closeDeleteAccountModal() { showAccountDeleteModal.value = false }

function clearFeedbacks(target) {
  setTimeout(() => {
    if (target.success !== undefined) target.success = ''
    if (target.error !== undefined) target.error = ''
  }, 5000)
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'File is too large. Max 2MB.'
    return
  }

  selectedFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  await handleUpload()
}

async function getProfile() {
  try {
    const res = await api.get('users/profile')
    Object.assign(profileData, res.data)
  } catch (err) {
    console.error('Error fetching profile:', err)
  }
}

async function saveChanges() {
  if (saving.value) return
  profileFeedback.success = ''
  profileFeedback.error = ''
  
  try {
    saving.value = true
    const res = await api.put('users/profile', {
      name: profileData.name,
      phoneNumber: profileData.phoneNumber,
      company: profileData.company,
    })
    Object.assign(profileData, res.data)
    profileFeedback.success = 'Profile updated successfully!'
    clearFeedbacks(profileFeedback)
  } catch (err) {
    profileFeedback.error = err.response?.data?.message || 'Failed to update profile.'
  } finally {
    saving.value = false
  }
}

async function updatePassword() {
  passwordFeedback.success = ''
  passwordFeedback.error = ''

  if (newPassword.value !== confirmNewPassword.value) {
    passwordFeedback.error = "Passwords don't match!"
    return
  }
  
  try {
    passwordSaving.value = true
    await api.put('users/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value,
    })
    passwordFeedback.success = 'Password updated successfully!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    clearFeedbacks(passwordFeedback)
  } catch (err) {
    passwordFeedback.error = err.response?.data?.message || 'Failed to update password.'
  } finally {
    passwordSaving.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) return
  try {
    uploading.value = true
    progress.value = 0
    avatarError.value = ''

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await api.post('users/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    if (response?.data?.profilePictureUrl) {
      profileData.profilePictureUrl = response.data.profilePictureUrl
    }
  } catch (err) {
    avatarError.value = 'Failed to upload your profile picture.'
  } finally {
    uploading.value = false
    if (avatarPreview.value.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview.value)
    }
    avatarPreview.value = ''
    selectedFile.value = null
  }
}

async function deleteAvatar() {
  avatarError.value = ''
  try {
    await api.delete('users/avatar')
    profileData.profilePictureUrl = ''
  } catch (err) {
    avatarError.value = 'Failed to remove avatar.'
  }
}

async function deleteAccount() {
  dangerFeedback.error = ''
  try {
    await api.delete('users/delete-account')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    authStore.logout()
    router.push('/login')
  } catch (err) {
    closeDeleteAccountModal()
    dangerFeedback.error = err.response?.data?.message || 'Could not delete account. Try again later.'
  }
}

onMounted(() => {
  getProfile()
})

const UserIcon = () =>
  h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none' }, [
    h('circle', { cx: '12', cy: '7', r: '4', stroke: 'currentColor', 'stroke-width': '1.5' }),
    h('path', { d: 'M5 21a7 7 0 0114 0', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
  ])

const tabs = [
  { label: 'Profile', value: 'profile', icon: UserIcon },
]

const initials = computed(() => {
  const parts = profileData?.name?.trim().split(' ')
  return parts?.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts?.[0][0] || 'U'
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.progress-wrap {
  width: 100%;
  max-width: 420px;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.settings-page {
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 820px;
}

.page-header {
  margin-bottom: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #f0f6ff;
  letter-spacing: -0.4px;
}

.page-subtitle {
  font-size: 13px;
  color: #7a8baa;
  margin-top: 2px;
}

.tabs-bar {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 4px;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #c8d5e8;
}
.tab-btn.active {
  background: #1e3a6e;
  color: #4a9eff;
}

.settings-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 24px 28px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #d1dcf0;
  margin-bottom: 16px;
}

.card-desc {
  font-size: 12.5px;
  color: #7a8baa;
  margin-top: -10px;
  margin-bottom: 18px;
  line-height: 1.5;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #4a9eff);

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  position: relative;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.avatar-initials {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.avatar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.avatar-hint {
  font-size: 12px;
  color: #4a5a70;
  width: 100%;
  padding-left: 80px;
  margin-top: -8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-grid.single {
  grid-template-columns: 1fr;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12.5px;
  font-weight: 500;
  color: #7a8baa;
}

input {
  padding: 9px 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
}

input::placeholder {
  color: #4a5a70;
}
input:focus {
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.04);
}

.card-footer {
  padding-top: 4px;
}

.btn-primary {
  padding: 9px 22px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  padding: 8px 18px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #d1dcf0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  transition: color 0.15s;
}

.btn-ghost:hover {
  color: #f87171;
}

.btn-danger {
  padding: 8px 18px;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: rgba(248, 113, 113, 0.2);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 20px;
}

.toggle-row:last-child {
  border-bottom: none;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-title {
  font-size: 13.5px;
  font-weight: 500;
  color: #d1dcf0;
}

.toggle-desc {
  font-size: 12px;
  color: #7a8baa;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.toggle-switch.on {
  background: #2563eb;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-switch.on .toggle-thumb {
  transform: translateX(18px);
}

.danger-card {
  border-color: rgba(248, 113, 113, 0.15);
}

.danger-title {
  color: #f87171;
}

.danger-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
}

.danger-row-title {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  color: #d1dcf0;
  margin-bottom: 2px;
}

.danger-row-desc {
  display: block;
  font-size: 12px;
  color: #7a8baa;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 9999;
}

.delete-modal {
  width: 420px;
  max-width: calc(100vw - 32px);

  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;

  padding: 28px;

  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.03);
}

.modal-icon {
  width: 52px;
  height: 52px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 12px;

  background: rgba(248, 113, 113, 0.12);
  color: #f87171;

  margin-bottom: 18px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;

  margin-bottom: 10px;
}

.modal-description {
  font-size: 13.5px;
  line-height: 1.6;
  color: #7a8baa;

  margin-bottom: 24px;
}

.modal-description strong {
  color: #d1dcf0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  border: none;
  cursor: pointer;

  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;

  padding: 10px 16px;
  border-radius: 8px;

  transition: all 0.15s ease;
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c8d5e8;
}

.modal-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.modal-btn.danger {
  background: #dc2626;
  color: white;
}

.modal-btn.danger:hover {
  background: #b91c1c;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .delete-modal,
.modal-leave-to .delete-modal {
  transform: translateY(12px) scale(0.98);
}

.error-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
}

.success-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
  border-radius: 8px;
  font-size: 14px;
}

.messages-container {
  padding: 0 24px;
  margin-top: 16px;
}
.progress-bar {
  height: 100%;
  background: #2563eb;
  transition: width 0.1s ease;
}

.tab-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

</style>
