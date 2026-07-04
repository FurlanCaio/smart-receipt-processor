<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal-box">
        <h3 class="modal-title">New Expense Report</h3>
        <div class="form-fields">
          <div class="field-group">
            <label class="field-label">Name <span class="required">*</span></label>
            <input
              type="text"
              class="field-input"
              v-model="form.name"
              placeholder="e.g. July 2026 Expenses"
              maxlength="200"
            />
          </div>
          <div class="field-group">
            <label class="field-label">Description</label>
            <input
              type="text"
              class="field-input"
              v-model="form.description"
              placeholder="Optional"
              maxlength="1000"
            />
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Month</label>
              <input type="month" class="field-input" v-model="form.month" />
            </div>
            <div class="field-group">
              <label class="field-label">Project</label>
              <input
                type="text"
                class="field-input"
                v-model="form.project"
                placeholder="Optional"
                maxlength="200"
              />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Client</label>
            <input
              type="text"
              class="field-input"
              v-model="form.client"
              placeholder="Optional"
              maxlength="200"
            />
          </div>
        </div>
        <p v-if="error" class="feedback-error">{{ error }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="$emit('update:modelValue', false)">
            Cancel
          </button>
          <button class="modal-btn primary" :disabled="loading" @click="submit">
            <span v-if="loading" class="spinner" />
            <span v-else>Create Report</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = reactive({ name: '', description: '', month: '', project: '', client: '' })

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.name = ''
      form.description = ''
      form.month = ''
      form.project = ''
      form.client = ''
    }
  },
)

function submit() {
  emit('submit', {
    name: form.name,
    description: form.description || undefined,
    month: form.month || undefined,
    project: form.project || undefined,
    client: form.client || undefined,
  })
}
</script>

<style scoped>
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

.modal-box {
  width: 480px;
  max-width: calc(100vw - 32px);
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;
  margin-bottom: 20px;
  font-family: 'DM Sans', sans-serif;
}

.form-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label { font-size: 12.5px; font-weight: 500; color: #7a8baa; font-family: 'DM Sans', sans-serif; }
.required { color: #f87171; }

.field-input {
  width: 100%;
  padding: 9px 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}

.field-input:focus { border-color: #4a9eff; }
.field-input::placeholder { color: #4a5a70; }

.feedback-error { font-size: 12.5px; color: #f87171; margin-bottom: 8px; font-family: 'DM Sans', sans-serif; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

.modal-btn {
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 8px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 7px;
}

.modal-btn.secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #c8d5e8; }
.modal-btn.secondary:hover { background: rgba(255,255,255,0.08); }
.modal-btn.primary { background: #2563eb; color: #fff; }
.modal-btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.modal-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
