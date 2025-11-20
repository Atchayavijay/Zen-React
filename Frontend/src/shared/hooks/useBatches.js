import { useEffect, useState } from 'react'
import { batchService } from '@shared/services/leads/batchService'
import { useNotification } from '@shared/hooks/useNotification'

export const useBatches = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showError } = useNotification()

  const fetchBatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await batchService.getBatches()
      if (result.success) {
        setBatches(result.data || [])
      } else {
        setError(result.error)
        showError(`Failed to fetch batches: ${result.error}`)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch batches'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  return {
    batches,
    loading,
    error,
    fetchBatches,
  }
}
