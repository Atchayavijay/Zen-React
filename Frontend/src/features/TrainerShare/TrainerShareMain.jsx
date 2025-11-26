import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Select from 'react-select'
import { BiFilterAlt, BiWallet, BiEnvelope, BiPencil, BiCheck, BiX } from 'react-icons/bi'
import Swal from 'sweetalert2'
import { getPageColors } from '@shared/utils/pageColors'
import trainerShareService from '@shared/services/trainers/trainerShareService'

const defaultFilters = {
  batches: [],
  trainers: [],
  statuses: [],
  paymentPeriod: '',
  customDateFrom: '',
  customDateTo: '',
}

const paymentPeriodOptions = [
  { value: '', label: 'All Time' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last15days', label: 'Last 15 Days' },
  { value: 'custom', label: 'Custom Date' },
]

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Paid', label: 'Paid' },
  { value: 'On Hold', label: 'On Hold' },
]

const statusBadgeClasses = {
  Pending: 'bg-rose-50 text-rose-700 border border-rose-100',
  Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'On Hold': 'bg-amber-50 text-amber-700 border border-amber-100',
}

const selectMenuPortalTarget = typeof document !== 'undefined' ? document.body : null

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#fff',
    borderColor: state.isFocused ? '#2563eb' : '#d1d5da',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(37,99,235,0.2)' : 'none',
    minHeight: '24px',
    borderRadius: '6px',
    fontSize: '11px',
    minWidth: 0,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#003e9c',
    borderRadius: '999px',
    paddingInline: '6px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#fff',
    fontWeight: 500,
    fontSize: '10px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#fff',
    ':hover': {
      backgroundColor: 'transparent',
      color: '#d1d5db',
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999, fontSize: '11px' }),
  option: (base) => ({ ...base, fontSize: '11px', padding: '4px 8px' }),
  placeholder: (base) => ({ ...base, fontSize: '11px', color: '#94a3b8' }),
  singleValue: (base) => ({ ...base, fontSize: '11px' }),
  input: (base) => ({ ...base, fontSize: '11px' }),
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
})

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0))

const getComparableDate = (payout) => {
  const source = payout?.paid_on || payout?.payment_date
  if (!source) return null
  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDisplayDate = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function TrainerShareMain() {
  const location = useLocation()
  const colors = getPageColors(location.pathname)
  const [payouts, setPayouts] = useState([])
  const [filteredPayouts, setFilteredPayouts] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [updatingPayoutId, setUpdatingPayoutId] = useState(null)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [editingPayoutId, setEditingPayoutId] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [allTrainers, setAllTrainers] = useState([])
  const [allBatches, setAllBatches] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [payoutsResponse, trainersResponse, batchesResponse] = await Promise.all([
          trainerShareService.fetchPayouts(),
          trainerShareService.fetchTrainers(),
          trainerShareService.fetchBatches()
        ])
        
        const payoutRows = payoutsResponse?.payouts || []
        setPayouts(payoutRows)
        setFilteredPayouts(payoutRows)

        if (trainersResponse?.success) setAllTrainers(trainersResponse.trainers || [])
        
        if (Array.isArray(batchesResponse)) {
          setAllBatches(batchesResponse)
        } else if (batchesResponse?.success) {
          setAllBatches(batchesResponse.batches || [])
        }
      } catch (error) {
        console.error('Failed to load trainer payouts', error)
        Swal.fire({
          icon: 'error',
          title: 'Unable to load payouts',
          text: error?.response?.data?.error || error.message || 'Something went wrong while fetching trainer payouts.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const batchOptions = useMemo(() => {
    return allBatches
      .map((b) => ({ value: b.batch_name, label: b.batch_name }))
      .filter((opt) => opt.value) // Filter out empty names
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allBatches])

  const trainerOptions = useMemo(() => {
    return allTrainers
      .map((t) => ({
        value: String(t.trainer_id),
        label: t.trainer_name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allTrainers])

  const summary = useMemo(() => {
    return filteredPayouts.reduce(
      (acc, payout) => {
        const amount = Number(payout.amount || 0)
        if (payout.status === 'Paid') acc.paid += amount
        else if (payout.status === 'On Hold') acc.onHold += amount
        else acc.pending += amount
        return acc
      },
      { paid: 0, pending: 0, onHold: 0 }
    )
  }, [filteredPayouts])

  const handleMultiSelectChange = useCallback((key, selected) => {
    setFilters((prev) => ({
      ...prev,
      [key]: selected?.map((option) => option.value) || [],
    }))
  }, [])

  const handlePaymentPeriodChange = (event) => {
    const value = event.target.value
    setFilters((prev) => ({
      ...prev,
      paymentPeriod: value,
      customDateFrom: value === 'custom' ? prev.customDateFrom : '',
      customDateTo: value === 'custom' ? prev.customDateTo : '',
    }))
  }

  const applyFilters = useCallback(() => {
    if (!payouts.length) return

    const filtered = payouts.filter((payout) => {
      const batchLabel = payout.batch_name || 'Unassigned'
      if (filters.batches.length && !filters.batches.includes(batchLabel)) return false

      if (
        filters.trainers.length &&
        (!payout.trainer_id || !filters.trainers.includes(String(payout.trainer_id)))
      ) {
        return false
      }

      const currentStatus = payout.status || 'Pending'
      if (filters.statuses.length && !filters.statuses.includes(currentStatus)) return false

      if (filters.paymentPeriod) {
        const recordDate = getComparableDate(payout)
        if (!recordDate) return false

        if (filters.paymentPeriod === 'custom') {
          if (!filters.customDateFrom && !filters.customDateTo) return false
          
          if (filters.customDateFrom) {
            const fromDate = new Date(filters.customDateFrom)
            fromDate.setHours(0, 0, 0, 0)
            if (recordDate < fromDate) return false
          }
          
          if (filters.customDateTo) {
            const toDate = new Date(filters.customDateTo)
            toDate.setHours(23, 59, 59, 999)
            if (recordDate > toDate) return false
          }
        } else {
          const days = filters.paymentPeriod === 'last30days' ? 30 : 15
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - days)
          cutoff.setHours(0, 0, 0, 0)
          if (recordDate < cutoff) return false
        }
      }

      return true
    })

    setFilteredPayouts(filtered)
  }, [filters, payouts])

  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setFilteredPayouts(payouts)
  }

  const handleEditClick = (payout) => {
    setEditingPayoutId(payout.payout_id)
    setEditingStatus(payout.status || 'Pending')
  }

  const handleOkClick = async (payout) => {
    if (!payout?.payout_id) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid payout',
        text: 'Payout ID is missing.',
      })
      return
    }

    if (editingStatus === payout.status) {
      setEditingPayoutId(null)
      setEditingStatus(null)
      return
    }

    setUpdatingPayoutId(payout.payout_id)
    try {
      const response = await trainerShareService.updateStatus(payout.payout_id, editingStatus)
      const newPayoutId = response?.data?.payout_id || payout.payout_id
      
      // Update function to handle both temporary and real payout IDs
      const updatePayout = (item) => {
        // Match by payout_id or by installment_id + trainer_id for temporary IDs
        const matchesById = item.payout_id === payout.payout_id
        const matchesByTempId = String(payout.payout_id).includes('_') && 
          item.installment_id === payout.installment_id && 
          item.trainer_id === payout.trainer_id
        
        if (matchesById || matchesByTempId) {
          return {
            ...item,
            payout_id: newPayoutId, // Update to real payout_id if it was temporary
            status: editingStatus,
            paid_on: editingStatus === 'Paid' ? new Date().toISOString() : item.paid_on,
          }
        }
        return item
      }

      setPayouts((prev) => prev.map(updatePayout))
      setFilteredPayouts((prev) => prev.map(updatePayout))
      setEditingPayoutId(null)
      setEditingStatus(null)
      Swal.fire({
        icon: 'success',
        title: 'Status updated',
        text: `Payout marked as ${editingStatus}.`,
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('Failed to update payout status', error)
      Swal.fire({
        icon: 'error',
        title: 'Unable to update status',
        text: error?.response?.data?.error || error.message || 'Please try again.',
      })
    } finally {
      setUpdatingPayoutId(null)
    }
  }

  const handleCloseClick = () => {
    setEditingPayoutId(null)
    setEditingStatus(null)
  }

  const handleStatusChange = async (payout, nextStatus) => {
    if (!payout?.payout_id || String(payout.payout_id).includes('_')) {
      Swal.fire({
        icon: 'info',
        title: 'Record not synced',
        text: 'This payout has not been persisted yet. Please finalize the payout entry before updating its status.',
      })
      return
    }

    setUpdatingPayoutId(payout.payout_id)
    try {
      await trainerShareService.updateStatus(payout.payout_id, nextStatus)
      setPayouts((prev) =>
        prev.map((item) => {
          if (item.payout_id === payout.payout_id) {
            return {
              ...item,
              status: nextStatus,
              paid_on: nextStatus === 'Paid' ? new Date().toISOString() : item.paid_on,
            }
          }
          return item
        })
      )
      setFilteredPayouts((prev) =>
        prev.map((item) => {
          if (item.payout_id === payout.payout_id) {
            return {
              ...item,
              status: nextStatus,
              paid_on: nextStatus === 'Paid' ? new Date().toISOString() : item.paid_on,
            }
          }
          return item
        })
      )
      Swal.fire({
        icon: 'success',
        title: 'Status updated',
        text: `Payout marked as ${nextStatus}.`,
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('Failed to update payout status', error)
      Swal.fire({
        icon: 'error',
        title: 'Unable to update status',
        text: error?.response?.data?.error || error.message || 'Please try again.',
      })
    } finally {
      setUpdatingPayoutId(null)
    }
  }

  const handleSendEmails = async () => {
    setSendingEmails(true)
    try {
      await trainerShareService.sendSummary(filters.paymentPeriod, filters.customDateFrom, filters.customDateTo)
      Swal.fire({
        icon: 'success',
        title: 'Emails sent',
        text: 'Trainer payout summaries were delivered successfully.',
      })
    } catch (error) {
      console.error('Failed to send payout emails', error)
      Swal.fire({
        icon: 'error',
        title: 'Unable to send emails',
        text: error?.response?.data?.error || error.message || 'Please try again.',
      })
    } finally {
      setSendingEmails(false)
    }
  }

  const isApplyDisabled =
    filters.paymentPeriod === 'custom' && (!filters.customDateFrom || !filters.customDateTo)

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
      <div className="max-w-[1500px] mx-auto space-y-6">
      <div className="flex items-center gap-1.5">
        <div className="p-1.5 rounded bg-slate-100 text-slate-600">
          <BiWallet size={16} />
        </div>
    <div>
          
          <h1 className="text-lg font-semibold text-slate-900 leading-tight">Trainer Payouts</h1>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <header className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.2em]">
          <BiFilterAlt className="text-slate-500" size={16} />
          Filters
        </header>
        <div className="p-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Batch</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={batchOptions}
                placeholder="Select batches..."
                value={batchOptions.filter((option) => filters.batches.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('batches', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No batches found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Trainer</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={trainerOptions}
                placeholder="Select trainers..."
                value={trainerOptions.filter((option) => filters.trainers.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('trainers', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No trainers found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">Status</label>
              <Select
                isMulti
                isClearable
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                options={statusOptions}
                placeholder="Select statuses..."
                value={statusOptions.filter((option) => filters.statuses.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('statuses', selected)}
                menuPortalTarget={selectMenuPortalTarget}
                menuPlacement="auto"
                menuPosition="fixed"
                noOptionsMessage={() => 'No statuses found'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Payment Period
              </label>
              <select
                value={filters.paymentPeriod}
                onChange={handlePaymentPeriodChange}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none transition"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
              >
                {paymentPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filters.paymentPeriod === 'custom' && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Date From
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none transition"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                  value={filters.customDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customDateFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Date To
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none transition"
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                  value={filters.customDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customDateTo: e.target.value,
                    }))
                  }
                  min={filters.customDateFrom || undefined}
                />
              </div>
              <p className="text-[10px] text-slate-500 md:self-end">
                Pick a date range to show payouts recorded between these dates.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={isApplyDisabled}
              className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.primary;
              }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSendEmails}
              disabled={sendingEmails}
              className="inline-flex items-center gap-1 rounded bg-pink-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
            >
              <BiEnvelope />
              {sendingEmails ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
        <div className="table-responsive max-h-[70vh] overflow-auto">
          <table
            className="min-w-full text-sm text-slate-800"
            style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}
          >
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                {[
                  '#',
                  'Installment ID',
                  'Installments',
                  'Student Name',
                  'Batch',
                  'Trainer Name',
                  'OG Fee (₹)',
                  'Paid Fee (₹)',
                  'Share %',
                  'Trainer Share (₹)',
                  'Status',
                  'Paid On',
                  'Action',
                ].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-left font-medium border-r border-slate-200 last:border-r-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-3 py-5 text-center text-slate-500 border-b border-slate-200">
                    Loading trainer payouts…
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-5 text-center text-slate-500 border-b border-slate-200">
                    No trainer payouts match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout, index) => {
                  const currentStatus = payout.status || 'Pending'
                  return (
                    <tr
                      key={`${payout.payout_id}-${index}`}
                      className="bg-white shadow-sm border border-slate-200 rounded-xl hover:shadow transition-shadow"
                    >
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-800 border-r border-slate-100">{payout.installment_id}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{payout.installment_count}</td>
                      <td className="px-4 py-3 text-slate-900 border-r border-slate-100">{payout.student_name}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{payout.batch_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700 border-r border-slate-100">
                        <div>{payout.trainer_name || '-'}</div>
                        {Boolean(
                          payout.sub_course_name &&
                            payout.sub_course_name.trim() &&
                            (!payout.course_name ||
                              payout.sub_course_name.trim().toLowerCase() !== payout.course_name.trim().toLowerCase())
                        ) && (
                          <div className="text-[11px] text-slate-500">{payout.sub_course_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{formatCurrency(payout.discounted_fee)}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{formatCurrency(payout.paid_amount)}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                        {payout.sub_course_share != null ? `${Number(payout.sub_course_share).toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-900 border-r border-slate-100">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <select
                          value={editingPayoutId === payout.payout_id ? editingStatus : currentStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          disabled={editingPayoutId !== payout.payout_id || updatingPayoutId === payout.payout_id}
                          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 ${
                            (editingPayoutId === payout.payout_id ? editingStatus : currentStatus) === 'Paid'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                              : (editingPayoutId === payout.payout_id ? editingStatus : currentStatus) === 'On Hold'
                              ? 'border-amber-100 bg-amber-50 text-amber-700 focus:ring-amber-200'
                              : 'border-rose-100 bg-rose-50 text-rose-700 focus:ring-rose-200'
                          }`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                        {currentStatus === 'Paid' 
                          ? formatDisplayDate(payout.paid_on || payout.payment_date)
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {editingPayoutId === payout.payout_id ? (
                            <>
                              <button
                                type="button"
                                title="Save changes"
                                onClick={() => handleOkClick(payout)}
                                disabled={updatingPayoutId === payout.payout_id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                              >
                                <BiCheck size={16} />
                              </button>
                              <button
                                type="button"
                                title="Cancel editing"
                                onClick={handleCloseClick}
                                disabled={updatingPayoutId === payout.payout_id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-500 text-white hover:bg-slate-600 disabled:opacity-40 transition-colors"
                              >
                                <BiX size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              title="Edit status"
                              onClick={() => handleEditClick(payout)}
                              disabled={updatingPayoutId === payout.payout_id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                            >
                              <BiPencil size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.15em]">
          Trainer Payment Summary
        </h2>
        <div className="space-y-2">
          {[
            { label: 'Total Paid (₹)', value: summary?.paid || 0, accent: 'text-blue-600' },
            { label: 'Pending (₹)', value: summary?.pending || 0, accent: 'text-rose-600' },
            { label: 'On Hold (₹)', value: summary?.onHold || 0, accent: 'text-amber-600' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
            >
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className={`font-semibold ${item.accent}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
