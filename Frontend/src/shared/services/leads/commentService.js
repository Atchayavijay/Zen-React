import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const commentService = {
  async getComments(leadId) {
    try {
      const res = await apiClient.get(endpoints.leads.comments(leadId))
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async addComment(leadId, comment_text) {
    try {
      const res = await apiClient.post(endpoints.leads.comments(leadId), { comment_text })
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async deleteComment(commentId) {
    try {
      const res = await apiClient.delete(endpoints.comments.root(commentId))
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async editComment(commentId, comment_text) {
    try {
      const res = await apiClient.put(endpoints.comments.root(commentId), { comment_text })
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
}

export default commentService
