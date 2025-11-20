import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const { courses } = endpoints

export const courseService = {
  async getCourses(params = {}) {
    try {
      try {
        const response = await apiClient.get(courses.root, { params })
        const data = response.data
        
        // Handle different response structures
        let coursesData = data
        if (data && data.courses && Array.isArray(data.courses)) {
          coursesData = data.courses
        } else if (data && data.data && Array.isArray(data.data)) {
          coursesData = data.data
        }
        
        console.log('Courses fetched:', coursesData)
        return {
          success: true,
          data: coursesData,
        }
      } catch (authError) {
        if (authError.response?.status === 401) {
          console.log('Authentication failed, trying filter endpoint as fallback')
          const fallbackResponse = await apiClient.get(courses.filter, {
            params,
          })
          console.log('Fallback courses response:', fallbackResponse.data)
          const fallbackData = fallbackResponse.data
          const coursesData = fallbackData.courses || fallbackData.data || fallbackData
          return {
            success: true,
            data: Array.isArray(coursesData) ? coursesData : [],
          }
        }
        throw authError
      }
    } catch (error) {
      console.error('Error fetching courses:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
      }
    }
  },

  async getFilteredCourses(filters = {}) {
    try {
      const response = await apiClient.get(courses.filter, {
        params: filters,
      })
      return {
        success: true,
        data: response.data.courses || response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async addCourse(courseData) {
    try {
      const response = await apiClient.post(courses.root, courseData)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async updateCourse(courseId, courseData) {
    try {
      const response = await apiClient.put(`${courses.root}/${courseId}`, courseData)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async deleteCourse(courseId) {
    try {
      const response = await apiClient.delete(`${courses.root}/${courseId}`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async getCourseTypes() {
    try {
      const coursesResponse = await this.getCourses()
      if (coursesResponse.success) {
        const coursesData = Array.isArray(coursesResponse.data) 
          ? coursesResponse.data 
          : []
        const courseTypes = [
          ...new Set(
            coursesData
              .map((course) => course.course_type || course.courseType || course.type)
              .filter(Boolean)
          ),
        ]
        console.log('Course types extracted:', courseTypes)
        return {
          success: true,
          data: courseTypes,
        }
      }
      console.error('Failed to get courses for course types:', coursesResponse.error)
      return {
        success: false,
        error: coursesResponse.error || 'Failed to fetch course types',
        data: [],
      }
    } catch (error) {
      console.error('Error in getCourseTypes:', error)
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }
  },

  async getSubCourses(courseId) {
    try {
      const response = await apiClient.get(courses.subCourses, {
        params: courseId ? { course_id: courseId } : undefined,
      })

      const data = Array.isArray(response.data) ? response.data : response.data?.data
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      }
    } catch (error) {
      console.error('Error fetching sub-courses:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
      }
    }
  },

  async addSubCourse(payload) {
    try {
      const response = await apiClient.post(courses.subCourses, payload)
      return {
        success: true,
        data: response.data?.sub_course || response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async updateSubCourse(subCourseId, payload) {
    try {
      const response = await apiClient.put(
        `${courses.subCourses}/${subCourseId}`,
        payload
      )
      return {
        success: true,
        data: response.data?.sub_course || response.data,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async deleteSubCourse(subCourseId) {
    try {
      const response = await apiClient.delete(
        `${courses.subCourses}/${subCourseId}`
      )
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message,
      }
    }
  },
}

export default courseService
