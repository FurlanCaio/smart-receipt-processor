const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  needs_approval: 'Needs Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  failed: 'Failed',
}

export function formatStatus(status) {
  return STATUS_LABELS[status] ?? status
}

export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateShort(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatGraphDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatMonth(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(y, parseInt(mo) - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatS3Key(s3Key) {
  if (!s3Key) return ''
  const fileName = s3Key.split('/').pop()
  const firstDash = fileName.indexOf('-')
  return firstDash === -1 ? fileName : fileName.slice(firstDash + 1)
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
