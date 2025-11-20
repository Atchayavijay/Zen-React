import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const archivedLeadService = {
  async getArchivedLeads() {
    try {
      const res = await apiClient.get(endpoints.leads.archived)
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async unarchiveLead(id) {
    try {
      const res = await apiClient.put(endpoints.leads.restore(id), { status: 'enquiry' })
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
}

export default archivedLeadService
