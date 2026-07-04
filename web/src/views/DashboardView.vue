<template>
  <AppLayout>
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Overview of your receipt processing</p>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Receipts</span>
            <div class="stat-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  stroke="#4A9EFF"
                  stroke-width="1.5"
                />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="#4A9EFF" stroke-width="1.5" />
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ receipts.stats.total }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Pending Approval</span>
            <div class="stat-icon orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#F59E0B" stroke-width="1.5" />
                <path d="M12 7v5l3 3" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ receipts.stats.pending }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Processing</span>
            <div class="stat-icon purple">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"
                  stroke="#A78BFA"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ receipts.stats.processing }}</div>
          <div class="stat-change neutral">In queue</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Completed</span>
            <div class="stat-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#34D399" stroke-width="1.5" />
                <path
                  d="M8 12l3 3 5-5"
                  stroke="#34D399"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ receipts.stats.completed }}</div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Processing Over Time</span>
          </div>

          <div class="chart-area">
            <svg viewBox="0 0 520 160" preserveAspectRatio="none" class="line-chart">
              <line
                x1="0"
                y1="32"
                x2="520"
                y2="32"
                stroke="rgba(255,255,255,0.05)"
                stroke-width="1"
              />
              <line
                x1="0"
                y1="64"
                x2="520"
                y2="64"
                stroke="rgba(255,255,255,0.05)"
                stroke-width="1"
              />
              <line
                x1="0"
                y1="96"
                x2="520"
                y2="96"
                stroke="rgba(255,255,255,0.05)"
                stroke-width="1"
              />
              <line
                x1="0"
                y1="128"
                x2="520"
                y2="128"
                stroke="rgba(255,255,255,0.05)"
                stroke-width="1"
              />

              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563EB" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,140 L52,100 L104,120 L156,80 L208,60 L260,90 L312,40 L364,70 L416,50 L468,30 L520,50 L520,160 L0,160 Z"
                fill="url(#areaGrad)"
              />
              <path
                :d="linePath"
                fill="none"
                stroke="#3B82F6"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>

            <div class="x-labels">
              <span v-for="item in receipts.graphData" :key="item._id">
                {{ formatGraphDate(item._id) }}
              </span>
            </div>
          </div>
        </div>

        <div class="donut-card">
          <div class="chart-title" style="margin-bottom: 20px">Status Breakdown</div>

          <div class="donut-wrapper">
            <svg viewBox="0 0 120 120" class="donut-chart">
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="#34D399"
                stroke-width="18"
                :stroke-dasharray="completedDash"
                stroke-dashoffset="0"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="#F59E0B"
                stroke-width="18"
                :stroke-dasharray="pendingDash"
                :stroke-dashoffset="-(completedPercentage / 100) * circumference"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="#3B82F6"
                stroke-width="18"
                :stroke-dasharray="processingDash"
                :stroke-dashoffset="
                  -((completedPercentage + pendingPercentage) / 100) * circumference
                "
                transform="rotate(-90 60 60)"
              />
            </svg>
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="dot green"></span>
              <span class="legend-label">Completed</span>
              <span class="legend-value">
                {{ receipts.stats.completed }}
                ({{ completedPercentage.toFixed(1) }}%)
              </span>
            </div>
            <div class="legend-item">
              <span class="dot orange"></span>
              <span class="legend-label">Pending Approval</span>
              <span class="legend-value">
                {{ receipts.stats.pending }}
                ({{ pendingPercentage.toFixed(1) }}%)
              </span>
            </div>
            <div class="legend-item">
              <span class="dot blue"></span>
              <span class="legend-label">Processing</span>
              <span class="legend-value">
                {{ receipts.stats.processing }}
                ({{ processingPercentage.toFixed(1) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <span class="chart-title">Recent Receipts</span>
        </div>

        <table class="receipts-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="receipt in receipts.recentReceipts" :key="receipt.id">
              <td>
                <div class="receipt-info">
                  <div class="receipt-thumb">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke="#7A8BAA"
                        stroke-width="1.5"
                      />
                      <rect
                        x="9"
                        y="3"
                        width="6"
                        height="4"
                        rx="1"
                        stroke="#7A8BAA"
                        stroke-width="1.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="receipt-name">{{ receipt.name || 'Unnamed Receipt' }}</div>
                    <div class="receipt-time">{{ formatTime(receipt.createdAt) }}</div>
                  </div>
                </div>
              </td>
              <td>
                <StatusBadge :status="receipt.status ?? 'pending'" />
              </td>
              <td class="amount">{{ receipt.totalAmount || 0 }}</td>
              <td class="date-col">{{ formatDate(receipt.createdAt) }}</td>
              <td>
                <button
                  class="action-btn"
                  title="View"
                  @click="$router.push('/receipts/' + receipt._id)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="table-footer">
          <router-link to="/receipts" class="view-all">View all receipts →</router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from './AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import api from '@/services/api'
import { formatDate, formatTime, formatGraphDate } from '@/utils/formatters'
import { ref, onMounted, computed } from 'vue'

const receipts = ref({
  stats: { total: 0, pending: 0, processing: 0, completed: 0 },
  graphData: [],
  recentReceipts: [],
})

const radius = 44
const circumference = 2 * Math.PI * radius

const completedPercentage = computed(() => {
  const total = receipts.value.stats.total || 1
  return (receipts.value.stats.completed / total) * 100
})

const pendingPercentage = computed(() => {
  const total = receipts.value.stats.total || 1
  return (receipts.value.stats.pending / total) * 100
})

const processingPercentage = computed(() => {
  const total = receipts.value.stats.total || 1
  return (receipts.value.stats.processing / total) * 100
})

const completedDash = computed(
  () => `${(completedPercentage.value / 100) * circumference} ${circumference}`,
)
const pendingDash = computed(
  () => `${(pendingPercentage.value / 100) * circumference} ${circumference}`,
)
const processingDash = computed(
  () => `${(processingPercentage.value / 100) * circumference} ${circumference}`,
)

const linePath = computed(() => {
  const data = receipts.value.graphData
  if (!data || data.length === 0) return ''
  const width = 520
  const height = 140
  const maxUploads = Math.max(...data.map((item) => item.uploads))
  return data
    .map((item, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
      const y = height - (item.uploads / maxUploads) * (height - 20)
      return `${index === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
})

const loading = ref(false)
const error = ref(null)

async function loadDashboard() {
  loading.value = true
  error.value = null

  try {
    const { data } = await api.get('receipts/dashboard')
    receipts.value = data
  } catch (err) {
    error.value =
      err.response?.data?.message ??
      'Unable to load dashboard. Please refresh the page and try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard {
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
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

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #7a8baa;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 18px 20px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 12px;
  color: #7a8baa;
  font-weight: 500;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: rgba(74, 158, 255, 0.12);
}
.stat-icon.orange {
  background: rgba(245, 158, 11, 0.12);
}
.stat-icon.purple {
  background: rgba(167, 139, 250, 0.12);
}
.stat-icon.green {
  background: rgba(52, 211, 153, 0.12);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #f0f6ff;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 11.5px;
}

.stat-change.positive {
  color: #34d399;
}
.stat-change.neutral {
  color: #7a8baa;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card,
.donut-card,
.table-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 20px 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #d1dcf0;
}

.chart-period {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #7a8baa;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.chart-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.line-chart {
  width: 100%;
  height: 140px;
}

.x-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #4a5a70;
  padding: 0 2px;
}

.donut-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.donut-chart {
  width: 120px;
  height: 120px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dot.green {
  background: #34d399;
}
.dot.orange {
  background: #f59e0b;
}
.dot.blue {
  background: #3b82f6;
}

.legend-label {
  color: #7a8baa;
  flex: 1;
}
.legend-value {
  color: #c8d5e8;
  font-weight: 500;
}

.table-header {
  margin-bottom: 16px;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
}

.receipts-table th {
  font-size: 11.5px;
  font-weight: 500;
  color: #7a8baa;
  text-align: left;
  padding: 0 12px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.receipts-table td {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
}

.receipts-table tr:last-child td {
  border-bottom: none;
}

.receipt-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.receipt-thumb {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.receipt-name {
  font-size: 13px;
  font-weight: 500;
  color: #d1dcf0;
}

.receipt-time {
  font-size: 11.5px;
  color: #4a5a70;
  margin-top: 1px;
}

.amount {
  color: #d1dcf0;
  font-weight: 500;
}

.date-col {
  color: #7a8baa;
}

.action-btn {
  background: transparent;
  border: none;
  color: #7a8baa;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.action-btn:hover {
  color: #4a9eff;
}

.table-footer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.view-all {
  font-size: 13px;
  color: #4a9eff;
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
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
