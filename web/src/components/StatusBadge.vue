<template>
  <span :class="['status-badge', status.toLowerCase()]">
    <span class="status-dot" />
    {{ formatStatus(status) }}
  </span>
</template>

<script setup>
import { formatStatus } from '@/utils/formatters'

defineProps({
  status: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge.pending { background: rgba(245,158,11,0.12); color: #f59e0b; }
.status-badge.pending .status-dot { background: #f59e0b; }

.status-badge.needs_approval { background: rgba(245,158,11,0.12); color: #f59e0b; }
.status-badge.needs_approval .status-dot { background: #f59e0b; }

.status-badge.processing { background: rgba(59,130,246,0.12); color: #60a5fa; }
.status-badge.processing .status-dot { background: #60a5fa; animation: pulse 1.2s infinite; }

.status-badge.approved { background: rgba(52,211,153,0.12); color: #34d399; }
.status-badge.approved .status-dot { background: #34d399; }

.status-badge.rejected { background: rgba(248,113,113,0.12); color: #f87171; }
.status-badge.rejected .status-dot { background: #f87171; }

.status-badge.failed { background: rgba(107,114,128,0.15); color: #9ca3af; }
.status-badge.failed .status-dot { background: #9ca3af; }

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.2); }
}
</style>
