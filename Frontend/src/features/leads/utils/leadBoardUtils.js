import leadService from '@shared/services/leads/leadService'

export async function handleCardDrop(leadId, newStatus) {
  const res = await leadService.updateLeadStatus(leadId, newStatus)
  if (res && !res.error) {
    return true
  }

  if (res && res.error) {
    alert(res.error || 'Failed to update status')
  }
  return false
}
