import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const lookupService = {
  async getCourses() {
    try {
      const res = await apiClient.get(endpoints.courses.root)
      let raw = res.data
      if (raw && raw.courses && Array.isArray(raw.courses)) raw = raw.courses
      if (raw && raw.data && Array.isArray(raw.data)) raw = raw.data
      if (!Array.isArray(raw)) raw = Array.isArray(res.data) ? res.data : []

      const courses = raw.map((c, i) => {
        if (typeof c === 'string') {
          return { id: c, name: c }
        }
        const id = c.course_id || c.id || c._id || i
        const name = c.course_name || c.name || c.title || String(id)
        return { id, name }
      })
      return { success: true, data: courses }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getBatches() {
    try {
      const res = await apiClient.get(endpoints.leads.batches)
      return { success: true, data: res.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getTrainers() {
    try {
      const res = await apiClient.get(endpoints.trainers.api)
      const trainersArr = res.data && Array.isArray(res.data.trainers) ? res.data.trainers : []
      const trainers = trainersArr.map((t, i) => ({
        id: t.id || t.trainer_id || i,
        name: t.name || t.trainer_name || t.full_name || t.user_name || t.id || i,
      }))
      return { success: true, data: trainers }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getAssignees() {
    try {
      const res = await apiClient.get(endpoints.users.root)
      let raw = res.data
      if (raw && raw.users && Array.isArray(raw.users)) raw = raw.users
      if (raw && raw.data && Array.isArray(raw.data)) raw = raw.data
      if (!Array.isArray(raw)) raw = Array.isArray(res.data) ? res.data : []

      const assignees = raw.map((a, i) => {
        if (typeof a === 'string') {
          return { id: a, name: a }
        }
        const id = a.user_id || a.id || a.assignee_id || a.userId || a._id || i
        const name =
          a.username || a.user_name || a.assignee_name || a.name || a.full_name || a.email || String(id)
        return { id, name }
      })
      return { success: true, data: assignees }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getUsers() {
    try {
      const res = await apiClient.get(endpoints.users.root)
      const users = (res.data || []).map((u, i) => ({
        id: u.id || u.user_id || i,
        name: u.username || u.name || u.email || u.id || i,
      }))
      return { success: true, data: users }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getUnits() {
    try {
      const res = await apiClient.get(endpoints.leads.units)
      const units = (res.data || []).map((u, i) => ({
        id: u.unit_id || u.id || i,
        name: u.unit_name || u.name || u.id || i,
      }))
      return { success: true, data: units }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getCardTypes() {
    try {
      const res = await apiClient.get(endpoints.leads.cardTypes)
      const cardTypes = (res.data || []).map((c, i) => ({
        id: c.card_type_id || c.id || i,
        name: c.card_type_name || c.name || c.id || i,
      }))
      return { success: true, data: cardTypes }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },
  async getSources() {
    try {
      const res = await apiClient.get(endpoints.leads.sources)
      // Backend returns array directly, so res.data is the array
      const rawData = Array.isArray(res.data) ? res.data : []
      const sources = rawData.map((s, i) => ({
        id: s.id || i,
        name: s.name || s.source_name || s.full_name || String(s.id || i),
      }))
      console.log('Sources fetched:', sources) // Debug log
      return { success: true, data: sources }
    } catch (error) {
      console.error('Error fetching sources:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
      }
    }
  },
  async getRoles() {
    try {
      const res = await apiClient.get(endpoints.leads.roles)
      // Backend returns array directly, so res.data is the array
      const rawData = Array.isArray(res.data) ? res.data : []
      const roles = rawData.map((r, i) => ({
        id: r.id || i,
        name: r.name || String(r.id || i),
      }))
      console.log('Roles fetched:', roles) // Debug log
      return { success: true, data: roles }
    } catch (error) {
      console.error('Error fetching roles:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
      }
    }
  },
  async getCourseTypes() {
    try {
      const res = await apiClient.get(endpoints.courses.root)
      let raw = res.data
      if (raw && raw.courses && Array.isArray(raw.courses)) raw = raw.courses
      if (raw && raw.data && Array.isArray(raw.data)) raw = raw.data
      if (!Array.isArray(raw)) raw = Array.isArray(res.data) ? res.data : []

      const typesSet = new Set()
      raw.forEach((r) => {
        const t = r.course_type || r.courseType || r.course_type_name || r.courseTypeName
        if (t) typesSet.add(String(t))
      })
      const courseTypes = Array.from(typesSet).map((t) => ({ course_type: t, id: t, name: t }))
      return { success: true, data: courseTypes }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },
}

export default lookupService
