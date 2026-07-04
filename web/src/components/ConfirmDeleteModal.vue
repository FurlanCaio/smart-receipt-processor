  <template>
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="delete-modal">
          <div class="modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-description" v-html="description" />
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="$emit('update:modelValue', false)">
              Cancel
            </button>
            <button class="modal-btn danger" :disabled="loading" @click="$emit('confirm')">
              <span v-if="loading" class="spinner" />
              <span v-else>{{ confirmLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </template>

  <script setup>
  defineProps({
    modelValue: { type: Boolean, required: true },
    title: { type: String, default: 'Delete?' },
    description: { type: String, default: 'This action cannot be undone.' },
    confirmLabel: { type: String, default: 'Delete' },
    loading: { type: Boolean, default: false },
  })

  defineEmits(['update:modelValue', 'confirm'])
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

.delete-modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.03);
  
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;
  margin-bottom: 10px;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.modal-description {
  font-size: 13.5px;
  line-height: 1.6;
  color: #7a8baa;
  margin-bottom: 24px;
  font-family: 'DM Sans', sans-serif;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.modal-description :deep(*) {
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c8d5e8;
}

.modal-btn.secondary:hover { background: rgba(255, 255, 255, 0.08); }

.modal-btn.danger { background: #dc2626; color: white; }
.modal-btn.danger:hover:not(:disabled) { background: #b91c1c; }
.modal-btn.danger:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .delete-modal, .modal-leave-to .delete-modal {
  transform: translateY(12px) scale(0.98);
}
</style>