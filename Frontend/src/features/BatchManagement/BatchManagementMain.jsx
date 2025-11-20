import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'
import { useBatches } from '@shared/hooks/useBatches'
import { batchService } from '@shared/services/leads/batchService'
import { getPageColors } from '@shared/utils/pageColors'
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BatchManagementPage() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const { batches, loading, error, fetchBatches } = useBatches();
  const [trainers, setTrainers] = useState([]);
  // removed duplicate loading state, use from useBatches

  // add modal
  const [showAdd, setShowAdd] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchTrainerId, setBatchTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [days, setDays] = useState(() =>
    DAYS.reduce((acc, d) => ({ ...acc, [d]: false }), {})
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savingAdd, setSavingAdd] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eName, setEName] = useState("");
  const [eTrainerId, setETrainerId] = useState("");
  const [eStart, setEStart] = useState("");
  const [eEnd, setEEnd] = useState("");
  const [eDays, setEDays] = useState(() =>
    DAYS.reduce((acc, d) => ({ ...acc, [d]: false }), {})
  )
  const [eStartDate, setEStartDate] = useState("")
  const [eEndDate, setEEndDate] = useState("")
  const [batchTrainerAssignments, setBatchTrainerAssignments] = useState({})

  // maps
  const trainerMap = useMemo(() => {
    const m = new Map()
    trainers.forEach((t) => m.set(String(t.trainer_id), t.trainer_name))
    return m
  }, [trainers])

  const toDateInputString = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const extractDateString = (value) => {
    if (!value) return ""
    if (typeof value === "string") {
      if (value.includes("T")) {
        const parsed = new Date(value)
        const normalized = toDateInputString(parsed)
        if (normalized) return normalized
      }
      if (value.length >= 10) return value.slice(0, 10)
      return value
    }
    if (value instanceof Date) {
      return toDateInputString(value)
    }
    try {
      return toDateInputString(new Date(value))
    } catch {
      return ""
    }
  }

  const formatDateDisplay = (value) => {
    const str = extractDateString(value)
    return str || "-"
  }

  const normalizeDateForInput = (value) => extractDateString(value)

  // Fetch trainers on mount
  useEffect(() => {
    (async () => {
      const data = await fetchTrainers();
      setTrainers(data);
    })();
  }, []);

  useEffect(() => {
    if (!batches.length) {
      setBatchTrainerAssignments({})
      return
    }
    let cancelled = false
    const loadAssignments = async () => {
      const entries = await Promise.all(
        batches.map(async (batch) => {
          try {
            const res = await apiClient.get(
              endpoints.leads.batchTrainers(batch.batch_id)
            )
            const trainer = res.data?.[0]
            return [
              batch.batch_id,
              trainer
                ? {
                    trainer_id: String(trainer.trainer_id),
                    trainer_name: trainer.trainer_name,
                  }
                : { trainer_id: "", trainer_name: "Not Assigned" },
            ]
          } catch (error) {
            console.error("Failed to load batch trainer:", error)
            return [
              batch.batch_id,
              { trainer_id: "", trainer_name: "Not Assigned" },
            ]
          }
        })
      )
      if (!cancelled) {
        setBatchTrainerAssignments(Object.fromEntries(entries))
      }
    }
    loadAssignments()
    return () => {
      cancelled = true
    }
  }, [batches])

  async function fetchTrainers() {
    try {
      const res = await apiClient.get(endpoints.trainers.root)
      const data = res.data
      if (Array.isArray(data?.trainers)) {
        return data.trainers
      }
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Failed to load trainers:', e)
      return []
    }
  }

  // -------- Add Batch ----------
  function toggleAddDay(d) {
    setDays((prev) => ({ ...prev, [d]: !prev[d] }));
  }

  function resetAddForm() {
    setBatchName("");
    setBatchTrainerId("");
    setStartTime("");
    setEndTime("");
    setStartDate("");
    setEndDate("");
    setDays(DAYS.reduce((acc, d) => ({ ...acc, [d]: false }), {}));
  }

  async function handleAdd(e) {
    e.preventDefault();
    const daysSelected = Object.entries(days)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (
      !batchName.trim() ||
      !batchTrainerId ||
      !startTime ||
      !endTime ||
      !startDate
    )
      return;
    setSavingAdd(true);
    try {
      const class_timing =
        startTime && endTime ? `${startTime}-${endTime}` : ""
      const result = await batchService.createBatch({
        batch_name: batchName.trim(),
        trainer_id: batchTrainerId,
        class_timing,
        days_of_week: daysSelected,
        start_date: startDate,
        end_date: endDate || null,
      })
      if (result.success) {
        const created = result.data?.batch || result.data || null
        const newBatchId = created?.batch_id
        await fetchBatches()
        if (newBatchId) {
          if (batchTrainerId) {
            await assignTrainerToBatch(newBatchId, batchTrainerId)
          } else {
            setBatchTrainerAssignments((prev) => ({
              ...prev,
              [newBatchId]: { trainer_id: "", trainer_name: "Not Assigned" },
            }))
          }
        }
        setShowAdd(false)
        resetAddForm()
      } else {
        console.error("Create batch failed:", result.error)
      }
    } catch (e) {
      console.error("Create batch failed:", e)
    } finally {
      setSavingAdd(false)
    }
  }

  // -------- Edit / Delete ----------
  function startEdit(row) {
    setEditingId(row.batch_id)
    setEName(row.batch_name || "")
    const assigned =
      batchTrainerAssignments[row.batch_id]?.trainer_id || ""
    setETrainerId(
      row.trainer_id ? String(row.trainer_id) : assigned
    )
    let start = row.class_timing_start || ""
    let end = row.class_timing_end || ""
    if ((!start || !end) && row.class_timing && row.class_timing.includes("-")) {
      const [parsedStart, parsedEnd] = row.class_timing.split("-")
      start = start || parsedStart?.trim() || ""
      end = end || parsedEnd?.trim() || ""
    }
    setEStart(start)
    setEEnd(end)
    const initDays = DAYS.reduce((acc, d) => ({ ...acc, [d]: false }), {})
    ;(row.days_of_week || []).forEach((d) => (initDays[d] = true))
    setEDays(initDays)
    setEStartDate(normalizeDateForInput(row.start_date))
    setEEndDate(normalizeDateForInput(row.end_date))
    setShowEditModal(true)
  }

  function cancelEdit() {
    setEditingId(null);
    setEName("");
    setETrainerId("");
    setEStart("");
    setEEnd("");
    setEDays(DAYS.reduce((acc, d) => ({ ...acc, [d]: false }), {}));
    setEStartDate("");
    setEEndDate("");
    setShowEditModal(false);
  }

  function toggleEditDay(d) {
    setEDays((prev) => ({ ...prev, [d]: !prev[d] }));
  }

  const assignTrainerToBatch = async (batchId, trainerId) => {
    if (!batchId) return
    try {
      if (!trainerId) {
        const current = batchTrainerAssignments[batchId]
        if (current?.trainer_id) {
          await apiClient.delete(
            `${endpoints.leads.batchTrainers(batchId)}/${current.trainer_id}`
          )
        }
        setBatchTrainerAssignments((prev) => ({
          ...prev,
          [batchId]: { trainer_id: '', trainer_name: 'Not Assigned' },
        }))
        return
      }
      await apiClient.put(endpoints.leads.batchTrainers(batchId), {
        trainers: [
          {
            trainer_id: Number(trainerId),
            share_percentage: 100,
          },
        ],
      })
      setBatchTrainerAssignments((prev) => ({
        ...prev,
        [batchId]: {
          trainer_id: String(trainerId),
          trainer_name: trainerMap.get(String(trainerId)) || 'Not Assigned',
        },
      }))
    } catch (error) {
      console.error('Failed to assign trainer to batch:', error)
    }
  }

  async function saveEdit(id) {
    const daysSelected = Object.entries(eDays)
      .filter(([, v]) => v)
      .map(([k]) => k);
    try {
      const class_timing = eStart && eEnd ? `${eStart}-${eEnd}` : "";
      const result = await batchService.updateBatch(id, {
        batch_id: id,
        batch_name: eName.trim(),
        trainer_id: eTrainerId,
        class_timing,
        days_of_week: daysSelected,
        start_date: eStartDate,
        end_date: eEndDate || null,
      });
      if (result.success) {
        await assignTrainerToBatch(id, eTrainerId)
        await fetchBatches()
        cancelEdit()
      } else {
        console.error("Update batch failed:", result.error);
      }
    } catch (e) {
      console.error("Update batch failed:", e);
    }
  }

  async function deleteBatch(id) {
    if (!window.confirm("Delete this batch?")) return;
    try {
      const result = await batchService.deleteBatch(id);
      if (result.success) {
        await fetchBatches();
        alert('Batch deleted successfully');
      } else {
        // Check for foreign key constraint error
        if (
          result.error &&
          result.error.toLowerCase().includes("foreign key constraint")
        ) {
          alert(
            "Cannot delete this batch because it has leads assigned. Please remove or reassign all leads from this batch before deleting."
          );
        } else {
          console.error("Delete batch failed:", result.error);
          alert("Delete batch failed: " + result.error);
        }
      }
    } catch (e) {
      console.error("Delete batch failed:", e);
      alert("Delete batch failed: " + e.message);
    }
  }

  // -------- Render ----------
  return (
    <div className="p-4 md:p-6">
      {/* Add New Batch tile */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 rounded-2xl border bg-white shadow-md hover:shadow-lg px-8 py-6 transition"
          style={{ borderColor: `${colors.primary}40` }}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition"
                style={{ backgroundColor: `${colors.primary}15` }}>
            <FiPlus className="text-xl" style={{ color: colors.primary }} />
          </span>
          <span className="text-lg font-semibold" style={{ color: colors.primary }}>
            Create New Batch
          </span>
        </button>
      </div>

      {/* Title */}
      <h4 className="text-center text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
        Batch List
      </h4>

      {/* Table */}
      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <div className="max-h-[800px] overflow-y-auto">
          <table className="min-w-[1100px] w-full text-center">
            <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors.primary }}>
              <tr>
                <th className="px-4 py-3 font-semibold text-center">BATCH ID</th>
                <th className="px-4 py-3 font-semibold text-center">
                  BATCH NAME
                </th>
                <th className="px-4 py-3 font-semibold text-center">TRAINER</th>
                <th className="px-4 py-3 font-semibold text-center">
                  TIME (START–END)
                </th>
                <th className="px-4 py-3 font-semibold text-center">DAYS</th>
                <th className="px-4 py-3 font-semibold text-center">
                  START DATE
                </th>
                <th className="px-4 py-3 font-semibold text-center">END DATE</th>
                <th className="px-4 py-3 font-semibold text-center">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center"
                    style={{ color: `${colors.primary}80` }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center"
                    style={{ color: `${colors.primary}80` }}
                  >
                    No batches found
                  </td>
                </tr>
              ) : (
                batches.map((row, idx) => {
                  const daysText = (row.days_of_week || []).join(', ')
                  return (
                    <tr
                      key={row.batch_id || idx}
                      style={{
                        backgroundColor: idx % 2 ? `${colors.primary}08` : 'white',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-center" style={{ color: colors.primaryDark }}>
                        {row.batch_id}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                            {row.batch_name}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                          {(batchTrainerAssignments[row.batch_id]?.trainer_name) ||
                            row.trainer_name ||
                            trainerMap.get(String(row.trainer_id)) ||
                            'Not Assigned'}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                          {row.class_timing_start && row.class_timing_end
                            ? `${row.class_timing_start} – ${row.class_timing_end}`
                            : row.class_timing || '-'}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                          {daysText || '-'}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                          {formatDateDisplay(row.start_date)}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="w-full rounded-md px-4 py-2.5 text-center font-semibold"
                          style={{ backgroundColor: `${colors.primary}12`, color: colors.primaryDark }}
                        >
                          {formatDateDisplay(row.end_date)}
                          </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => startEdit(row)}
                              title="Edit"
                            style={{ color: colors.primary }}
                            onMouseEnter={(e) => {
                              e.target.style.color = colors.primaryDark
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = colors.primary
                            }}
                            >
                              <FiEdit />
                            </button>
                          <button
                            onClick={() => deleteBatch(row.batch_id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div className="px-6 py-4 text-white flex items-center justify-between"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
              <h5 className="text-lg font-semibold">Create New Batch</h5>
              <button
                onClick={() => {
                  setShowAdd(false);
                }}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdd} className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Batch Name
                  </label>
                  <input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                    placeholder="Enter Batch Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Trainer
                  </label>
                  <select
                    value={batchTrainerId}
                    onChange={(e) => setBatchTrainerId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  >
                    <option value="">Select Trainer</option>
                    {trainers.map((t) => (
                      <option key={t.trainer_id} value={t.trainer_id}>
                        {t.trainer_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Class Timing (Start)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Class Timing (End)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS.map((d) => (
                      <label key={d} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!days[d]}
                          onChange={() => toggleAddDay(d)}
                          className="rounded border-gray-300 transition"
                          style={{ accentColor: colors.primary }}
                        />
                        <span className="text-sm">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none transition"
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2.5 rounded-lg text-white disabled:opacity-60"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  {savingAdd ? "Saving…" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Edit Batch</h5>
              <button
                onClick={cancelEdit}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingId) saveEdit(editingId)
              }}
              className="px-6 py-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    Batch Name
                  </label>
                  <input
                    value={eName}
                    onChange={(e) => setEName(e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    Trainer
                  </label>
                  <select
                    value={eTrainerId}
                    onChange={(e) => setETrainerId(e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                  >
                    <option value="">Select Trainer</option>
                    {trainers.map((t) => (
                      <option key={t.trainer_id} value={t.trainer_id}>
                        {t.trainer_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    Class Timing (Start)
                  </label>
                  <input
                    type="time"
                    value={eStart}
                    onChange={(e) => setEStart(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    Class Timing (End)
                  </label>
                  <input
                    type="time"
                    value={eEnd}
                    onChange={(e) => setEEnd(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                    Select Days
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS.map((d) => (
                      <label key={d} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!eDays[d]}
                          onChange={() => toggleEditDay(d)}
                          className="rounded border-gray-300 transition"
                          style={{ accentColor: colors.primary }}
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={eStartDate}
                    onChange={(e) => setEStartDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={eEndDate}
                    onChange={(e) => setEEndDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`
                      e.target.style.boxShadow = ''
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-white font-medium hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                  disabled={!editingId}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
