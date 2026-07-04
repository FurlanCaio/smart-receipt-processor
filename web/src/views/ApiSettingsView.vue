<template>
  <AppLayout>
    <div class="settings-page">
      <header class="page-header">
        <h1 class="page-title">API Settings</h1>
        <p class="page-subtitle">Manage your OpenAI API key and model preferences</p>
      </header>

      <section class="settings-card">
        <h2 class="card-title">OpenAI API Key</h2>
        <p class="card-desc">
          Your API key is encrypted and stored securely. We never store your key in plain text.
        </p>

        <div class="api-key-row">
          <div class="api-input-wrap">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="apiKey"
              class="api-input"
              placeholder="sk-..."
              :disabled="loading.key"
            />
            <button
              type="button"
              class="toggle-visible-btn"
              @click="showKey = !showKey"
              v-if="apiKey"
            >
              {{ showKey ? 'Hide' : 'Show' }}
            </button>
          </div>
          <button class="change-btn" :disabled="loading.key || !apiKey" @click="handleUpdateKey">
            <span v-if="loading.key" class="spinner" />
            <span v-else>Update key</span>
          </button>
        </div>

        <p v-if="feedbackMessage" class="feedback-message">
          {{ feedbackMessage }}
        </p>
      </section>

      <section class="settings-card">
        <h2 class="card-title">Processing Settings</h2>
        <div class="setting-group">
          <label class="setting-label" for="model-select">Model</label>
          <div class="select-wrap">
            <select
              id="model-select"
              v-model="settings.model"
              class="setting-select"
              :disabled="loading.preferences"
            >
              <option
                v-for="model in AVAILABLE_MODELS"
                :key="model.text"
                :value="model.value"
                :disabled="model.disabled"
              >
                {{ model.text }}
              </option>
            </select>

            <svg class="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <p class="setting-hint">Select the OpenAI model used by the application.</p>
        </div>

        <div class="setting-group">
          <label class="setting-label" for="temp-input">Temperature</label>
          <div class="temp-row">
            <input
              id="temp-input"
              type="number"
              v-model.number="settings.temperature"
              min="0"
              max="2"
              step="0.1"
              class="temp-input"
              :disabled="!supportsTemperature || loading.preferences"
            />
          </div>
          <p class="setting-hint">
            {{
              supportsTemperature
                ? 'Lower values give more consistent results.'
                : 'Temperature is not supported by this model.'
            }}
          </p>
        </div>

        <button class="save-btn" :disabled="loading.preferences" @click="handleSavePreferences">
          <span v-if="loading.preferences" class="spinner" />
          <span v-else>Save settings</span>
        </button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import AppLayout from './AppLayout.vue'

const AVAILABLE_MODELS = [
  { value: '', text: '──── GPT-5 ────', disabled: true },
  { value: 'gpt-5', text: 'GPT-5', supportsTemperature: false },
  { value: 'gpt-5-mini', text: 'GPT-5 Mini (Recommended)', supportsTemperature: false },
  { value: 'gpt-5-nano', text: 'GPT-5 Nano', supportsTemperature: false },

  { value: '', text: '──── Reasoning ────', disabled: true },
  { value: 'o3', text: 'o3', supportsTemperature: false },
  { value: 'o4-mini', text: 'o4-mini', supportsTemperature: false },

  { value: '', text: '──── GPT-4 Family ────', disabled: true },
  { value: 'gpt-4.1', text: 'GPT-4.1', supportsTemperature: true },
  { value: 'gpt-4.1-mini', text: 'GPT-4.1 Mini', supportsTemperature: true },
  { value: 'gpt-4o', text: 'GPT-4o', supportsTemperature: true },
  { value: 'gpt-4o-mini', text: 'GPT-4o Mini', supportsTemperature: true },
]

const apiKey = ref('')
const showKey = ref(false)
const feedbackMessage = ref('')

const settings = reactive({
  model: 'gpt-4o-mini',
  temperature: 0.2,
})

const loading = reactive({
  preferences: false,
  key: false,
})

const selectedModel = computed(() => AVAILABLE_MODELS.find((m) => m.value === settings.model))
const supportsTemperature = computed(() => selectedModel.value?.supportsTemperature === true)

onMounted(() => {
  fetchUserPreferences()
})

async function fetchUserPreferences() {
  loading.preferences = true
  try {
    const { data } = await api.get('users/preferences')

    settings.model = data.openAiPreferenceModel || 'gpt-4o-mini'
    settings.temperature = data.openAiPreferenceTemperature ?? 0.7
  } catch (error) {
    showFeedback('Error fetching preferences. Please refresh the page.')
  } finally {
    loading.preferences = false
  }
}

async function handleUpdateKey() {
  if (!apiKey.value.trim()) return

  loading.key = true
  try {
    await api.put('users/apiKey', { apiKey: apiKey.value })
    showFeedback('Your API key has been successfully updated.')
    apiKey.value = ''
    showKey.value = false
  } catch (error) {
    showFeedback('Error saving API key. Please try again.')
  } finally {
    loading.key = false
  }
}

async function handleSavePreferences() {
  loading.preferences = true

  const payload = {
    openAiPreferenceModel: settings.model,
    ...(supportsTemperature.value && { openAiPreferenceTemperature: settings.temperature }),
  }

  try {
    await api.put('users/preferences', payload)
    showFeedback('Settings saved successfully!')
  } catch (error) {
    showFeedback('Error saving settings. Please try again.')
  } finally {
    loading.preferences = false
  }
}

function showFeedback(msg) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.settings-page {
  --bg-main: #0d1628;
  --border-color: rgba(255, 255, 255, 0.07);
  --input-bg: rgba(255, 255, 255, 0.05);
  --text-main: #e2e8f0;
  --text-muted: #7a8baa;
  --text-highlight: #f0f6ff;
  --accent-blue: #2563eb;
  --accent-blue-hover: #1d4ed8;
  --focus-ring: #4a9eff;

  max-width: 660px;
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: var(--text-main);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-highlight);
  letter-spacing: -0.4px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.settings-card {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-highlight);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 20px;
  line-height: 1.5;
}

.api-key-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.api-input-wrap {
  position: relative;
  flex: 1;
}

.api-input {
  width: 100%;
  padding: 10px 60px 10px 14px;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 13.5px;
  font-family: 'DM Mono', 'Courier New', monospace;
  outline: none;
  transition: border-color 0.15s;
}

.api-input:focus:not(:disabled) {
  border-color: var(--focus-ring);
}

.api-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-visible-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
}

.toggle-visible-btn:hover {
  color: var(--text-highlight);
}

.change-btn,
.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
  white-space: nowrap;
}

.change-btn {
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1dcf0;
  font-size: 13.5px;
  font-weight: 500;
}

.change-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.save-btn {
  padding: 10px 28px;
  background: var(--accent-blue);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

.save-btn:hover:not(:disabled) {
  background: var(--accent-blue-hover);
}

.change-btn:disabled,
.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.setting-group {
  margin-bottom: 22px;
}

.setting-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #c8d5e8;
  margin-bottom: 8px;
}

.select-wrap {
  position: relative;
}

.setting-select {
  width: 100%;
  padding: 10px 36px 10px 14px;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.setting-select:focus:not(:disabled) {
  border-color: var(--focus-ring);
}

.setting-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.setting-select option {
  background: var(--bg-main);
  color: var(--text-main);
}

.temp-input {
  width: 100px;
  padding: 10px 14px;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
}

.temp-input:focus:not(:disabled) {
  border-color: var(--focus-ring);
}

.temp-input:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: transparent;
}

.setting-hint {
  font-size: 12px;
  color: #4a5a70;
  margin-top: 6px;
}

.feedback-message {
  font-size: 13px;
  color: #34d399;
  margin-top: 10px;
  font-weight: 500;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
