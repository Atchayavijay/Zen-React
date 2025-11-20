import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

const { leads } = endpoints

const leadService = {
  async createLead(payload) {
    const requiredFields = [
      { key: 'name', label: 'Name' },
      { key: 'mobile_number', label: 'Mobile Number' },
      { key: 'course_id', label: 'Course' },
      { key: 'status', label: 'Status' },
      { key: 'unit_id', label: 'Business Unit' },
      { key: 'card_type_id', label: 'Card Type' },
    ]

    for (const field of requiredFields) {
      let value = payload[field.key];
      
      // Handle null, undefined, and empty strings
      if (value === null || value === undefined || value === '') {
        console.error(`Validation failed for ${field.key}: value is null, undefined, or empty`, value);
        return {
          success: false,
          error: `${field.label} is required.`,
        }
      }
      
      // For ID fields (course_id, unit_id, card_type_id), ensure they are valid
      if (field.key.includes('_id')) {
        // Special handling for course_id which can be a string (e.g., "CRS-DEV-001") or a number
        if (field.key === 'course_id') {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
              console.error(`Validation failed for ${field.key}: empty or invalid string`, value);
              return {
                success: false,
                error: `${field.label} is required.`,
              }
            }
            // Allow string IDs (like "CRS-DEV-001") - validate it's not empty and is a valid format
            if (/^[A-Za-z0-9_-]+$/.test(trimmed) && trimmed.length > 0) {
              // Valid string ID, keep it as is
              payload[field.key] = trimmed;
            } else {
              // Try to parse as number
              const numValue = parseInt(trimmed, 10);
              if (isNaN(numValue) || numValue <= 0) {
                console.error(`Validation failed for ${field.key}: invalid course ID format`, value);
                return {
                  success: false,
                  error: `${field.label} is required.`,
                }
              }
              payload[field.key] = numValue;
            }
          } else if (typeof value === 'number') {
            if (isNaN(value) || value <= 0) {
              console.error(`Validation failed for ${field.key}: invalid number`, value);
              return {
                success: false,
                error: `${field.label} is required.`,
              }
            }
            payload[field.key] = value;
          } else {
            console.error(`Validation failed for ${field.key}: unexpected type`, typeof value, value);
            return {
              success: false,
              error: `${field.label} is required.`,
            }
          }
        } else {
          // For UUID ID fields (unit_id, card_type_id), they must be valid UUIDs
          let uuidValue;
          
          // Convert to string if needed
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
              console.error(`Validation failed for ${field.key}: empty or invalid string`, value);
              return {
                success: false,
                error: `${field.label} is required.`,
              }
            }
            // Validate UUID format (8-4-4-4-12 hexadecimal characters)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(trimmed)) {
              console.error(`Validation failed for ${field.key}: invalid UUID format`, value);
              return {
                success: false,
                error: `${field.label} is required.`,
              }
            }
            uuidValue = trimmed;
          } else if (typeof value === 'number') {
            // UUIDs should be strings, not numbers
            console.error(`Validation failed for ${field.key}: UUID must be a string, got number`, value);
            return {
              success: false,
              error: `${field.label} is required.`,
            }
          } else {
            // For other types (object, etc.), try to extract or convert
            console.error(`Validation failed for ${field.key}: unexpected type`, typeof value, value);
            return {
              success: false,
              error: `${field.label} is required.`,
            }
          }
          
          // Update payload with the validated UUID value
          payload[field.key] = uuidValue;
        }
      } else {
        // For non-ID fields (name, mobile_number, status)
        // For string values, check if empty
        if (typeof value === 'string' && (value.trim() === '' || value.trim() === 'null' || value.trim() === 'undefined')) {
          console.error(`Validation failed for ${field.key}: empty or invalid string`, value);
          return {
            success: false,
            error: `${field.label} is required.`,
          }
        }
        
        // For number values, check if NaN
        if (typeof value === 'number' && isNaN(value)) {
          console.error(`Validation failed for ${field.key}: NaN`, value);
          return {
            success: false,
            error: `${field.label} is required.`,
          }
        }
      }
    }

    try {
      const res = await apiClient.post(leads.root, payload)
      return res.data
    } catch (error) {
      console.error("Lead service error:", error);
      console.error("Error response:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to create lead",
      }
    }
  },

  async updateLead(id, payload) {
    try {
      const res = await apiClient.put(`${leads.root}/${id}`, payload)
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async updateLeadStatus(id, status) {
    try {
      const res = await apiClient.patch(endpoints.leads.status(id), { status })
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async getLeads(filters) {
    try {
      const res = await apiClient.get(leads.root, { params: filters })
      return res.data
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  },

  async deleteLead(id, reason) {
    if (!id) {
      return {
        success: false,
        error: 'Lead ID is required to delete a lead.',
      }
    }

    if (!reason || String(reason).trim() === '') {
      return {
        success: false,
        error: 'A deletion reason is required.',
      }
    }

    try {
      const res = await apiClient.delete(`${leads.root}/${id}`, {
        data: { reason },
      })
      return {
        success: true,
        data: res.data,
      }
    } catch (error) {
      console.error('Delete lead error:', error)
      console.error('Delete lead response:', error.response?.data)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete lead.',
      }
    }
  },
}

export default leadService
