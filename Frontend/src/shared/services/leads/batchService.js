import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

export const batchService = {
  async getBatches() {
    try {
      const response = await apiClient.get(endpoints.leads.batches)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async createBatch(batchData) {
    try {
      const response = await apiClient.post(endpoints.leads.batches, batchData)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async updateBatch(batchId, batchData) {
    try {
      const response = await apiClient.put(`${endpoints.leads.batches}/${encodeURIComponent(batchId)}`, batchData)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async deleteBatch(batchId) {
    try {
      const response = await apiClient.delete(`${endpoints.leads.batches}/${encodeURIComponent(batchId)}`)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
}

export default batchService
