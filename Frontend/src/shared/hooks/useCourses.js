import { useEffect, useState } from 'react'
import { courseService } from '@shared/services/courses/courseService'
import { useNotification } from '@shared/hooks/useNotification'

export const useCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showSuccess, showError } = useNotification()

  const fetchCourses = async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const result = await courseService.getCourses(params)
      if (result.success) {
        setCourses(result.data || [])
      } else {
        setError(result.error)
        if (!result.error.includes('token') && !result.error.includes('401')) {
          showError(`Failed to fetch courses: ${result.error}`)
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch courses'
      setError(errorMessage)
      if (!errorMessage.includes('token') && !errorMessage.includes('401')) {
        showError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const addCourse = async (courseData) => {
    try {
      const result = await courseService.addCourse(courseData)
      if (result.success) {
        showSuccess('Course added successfully!')
        await fetchCourses()
        return { success: true }
      }
      showError(`Failed to add course: ${result.error}`)
      return { success: false, error: result.error }
    } catch (err) {
      const errorMessage = err.message || 'Failed to add course'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateCourse = async (courseId, courseData) => {
    try {
      const result = await courseService.updateCourse(courseId, courseData)
      if (result.success) {
        showSuccess('Course updated successfully!')
        await fetchCourses()
        return { success: true }
      }
      showError(`Failed to update course: ${result.error}`)
      return { success: false, error: result.error }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update course'
      showError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const deleteCourse = async (courseId) => {
    try {
      const result = await courseService.deleteCourse(courseId)
      if (result.success) {
        showSuccess('Course deleted successfully!')
        await fetchCourses()
        return { success: true }
      }
      showError(`Failed to delete course: ${result.error}`)
      return { success: false, error: result.error }
    } catch (error) {
      const message = error.message || 'Failed to delete course'
      showError(message)
      return { success: false, error: message }
    }
  }

  const getCourseTypes = async (showErrorToast = true) => {
    try {
      const result = await courseService.getCourseTypes()
      if (result.success) {
        return result.data || []
      }
      if (showErrorToast) {
        showError(`Failed to fetch course types: ${result.error}`)
      }
      return []
    } catch (err) {
      if (showErrorToast) {
        showError('Failed to fetch course types')
      }
      return []
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  return {
    courses,
    loading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseTypes,
  }
}
