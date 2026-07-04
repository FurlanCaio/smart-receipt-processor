<template>
  <AppLayout>
    <div class="upload-page">
      <div class="page-header">
        <h1 class="page-title">Upload Receipt</h1>
        <p class="page-subtitle">Upload a new receipt image to extract data</p>
      </div>

      <div
        class="drop-zone"
        :class="{ dragging: isDragging, 'has-file': selectedFile }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
      >
        <template v-if="!selectedFile">
          <div class="upload-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="#7A8BAA"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <p class="drop-label">Drag and drop your receipt image here</p>
          <p class="drop-or">or</p>
          <label class="choose-btn">
            Choose file
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              @change="onFileChange"
              hidden
            />
          </label>
          <p class="drop-hint">Supports JPG, PNG, WEBP, PDF • Max size 10MB</p>
          <p class="error-message" v-if="error">{{ error }}</p>
        </template>

        <template v-else>
          <div class="file-preview">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                stroke="#34D399"
                stroke-width="1.5"
              />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="#34D399" stroke-width="1.5" />
            </svg>
            <div class="file-meta">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            <button class="remove-file" :disabled="uploading" @click="clearSelectedFile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <button class="upload-btn" :disabled="uploading" @click="handleUpload">
            <span v-if="uploading" class="spinner" />
            <span v-else>Process Receipt</span>
          </button>

          <div v-if="uploading" class="progress-wrap">
            <div class="progress-bar" :style="{ width: progress + '%' }" />
          </div>
        </template>
      </div>

      <div class="section-title">Recent Uploads</div>
      <div class="recent-list">
        <div v-for="item in recentUploads" :key="item.id || item._id" class="recent-item">
          <div class="recent-thumb">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                stroke="#7A8BAA"
                stroke-width="1.5"
              />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="#7A8BAA" stroke-width="1.5" />
            </svg>
          </div>
          <div class="recent-info">
            <span class="recent-name">{{ formatS3Key(item.s3Key) }}</span>
            <span class="recent-date">{{ formatDate(item.createdAt) }} - {{ formatTime(item.createdAt) }}</span>
          </div>
          <StatusBadge :status="item.status" />
          <button class="chevron-btn" @click="$router.push('/receipts/' + (item._id || item.id))">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
        <div v-if="recentUploads.length === 0" class="empty-recent">
          No recent uploads found.
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import AppLayout from './AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import api from '@/services/api'
import { formatDate, formatTime, formatS3Key, formatFileSize } from '@/utils/formatters'

const isDragging = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const recentUploads = ref([])
const fileInput = ref(null)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

function showError(message) {
  error.value = message
  setTimeout(() => { error.value = '' }, 5000)
}

function clearSelectedFile() {
  selectedFile.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function getRecentUploads() {
  try {
    const response = await api.get('receipts/recent')
    recentUploads.value = response.data || []
  } catch (err) {
    console.error('Failed to fetch recent uploads:', err)
  }
}

function validateAndSetFile(file) {
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    showError('🖼️ Unsupported file type. Please use JPG, PNG, WEBP, or PDF.')
    return
  }

  if (file.size > MAX_SIZE) {
    showError('📦 File too large. Maximum size is 10MB.')
    return
  }

  selectedFile.value = file
  error.value = ''
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  validateAndSetFile(file)
}

function onFileChange(e) {
  const file = e.target.files[0]
  validateAndSetFile(file)
}

async function handleUpload() {
  if (!selectedFile.value || uploading.value) return

  try {
    uploading.value = true
    progress.value = 0
    error.value = ''

    const { data: presignedData } = await api.get('receipts/presigned-url', {
      params: {
        fileName: selectedFile.value.name,
        contentType: selectedFile.value.type,
      },
    })

    const { presignedUrl, key } = presignedData

    await axios.put(presignedUrl, selectedFile.value, {
      headers: { 'Content-Type': selectedFile.value.type },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    await api.post('receipts/upload', { s3Key: key })
    await getRecentUploads()
  } catch (err) {
    const errorCode = err.response?.data?.code
    const errorMessage = err.response?.data?.message

    const messages = {
      FILE_TOO_LARGE: 'File too large. Maximum size is 10MB.',
      INVALID_FILE_TYPE: 'Unsupported file type. Please use JPG, PNG, WEBP, or PDF.',
      MISSING_FILE: 'No file was uploaded.',
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      MISSING_API_KEY: 'User does not have an API key.',
      VALIDATION_ERROR: `Validation error: ${errorMessage || 'Invalid data'}`,
      INVALID_TOKEN: 'Invalid token. Please log in again.',
    }

    showError(messages[errorCode] ?? errorMessage ?? 'Upload failed. Please try again.')
  } finally {
    uploading.value = false
    clearSelectedFile()
  }
}

onMounted(() => { getRecentUploads() })
</script>

<style scoped>
.upload-page {
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
  max-width: 700px;
}

.page-header {
  margin-bottom: 24px;
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

.drop-zone {
  background: #0d1628;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition:
    border-color 0.2s,
    background 0.2s;
  margin-bottom: 32px;
  min-height: 240px;
  justify-content: center;
}

.drop-zone.dragging {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: rgba(52, 211, 153, 0.3);
}

.upload-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.drop-label {
  font-size: 14px;
  color: #c8d5e8;
  font-weight: 500;
}

.drop-or {
  font-size: 13px;
  color: #4a5a70;
}

.choose-btn {
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
}

.choose-btn:hover {
  background: #1d4ed8;
}

.drop-hint {
  font-size: 12px;
  color: #4a5a70;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  width: 100%;
  max-width: 420px;
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #d1dcf0;
}

.file-size {
  font-size: 11.5px;
  color: #7a8baa;
}

.remove-file {
  background: transparent;
  border: none;
  color: #7a8baa;
  cursor: pointer;
  padding: 4px;
  display: flex;
  transition: color 0.15s;
}

.remove-file:hover {
  color: #f87171;
}

.upload-btn {
  padding: 10px 28px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
.upload-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.progress-wrap {
  width: 100%;
  max-width: 420px;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #d1dcf0;
  margin-bottom: 12px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-thumb {
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-name {
  font-size: 13px;
  font-weight: 500;
  color: #d1dcf0;
}

.recent-date {
  font-size: 11.5px;
  color: #4a5a70;
}

.chevron-btn {
  background: transparent;
  border: none;
  color: #4a5a70;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.chevron-btn:hover {
  color: #c8d5e8;
}

.empty-recent {
  padding: 20px;
  text-align: center;
  color: #4a5a70;
  font-size: 13.5px;
}

.error-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
}
</style>
