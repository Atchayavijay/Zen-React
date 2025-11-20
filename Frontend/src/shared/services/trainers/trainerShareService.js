import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const trainerShareService = {
  async fetchPayouts() {
    const response = await apiClient.get(endpoints.trainers.payouts)
    return response.data
  },

  async updateStatus(payoutId, status) {
    return apiClient.put(endpoints.trainers.payoutStatus(payoutId), { status })
  },

  async sendSummary(period, customDateFrom, customDateTo) {
    return apiClient.post(endpoints.trainers.sendPayoutEmails, {
      period: period || 'all',
      customDateFrom: customDateFrom || null,
      customDateTo: customDateTo || null,
    })
  },
}

export default trainerShareService

