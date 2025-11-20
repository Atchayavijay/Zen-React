

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'
import { getPageColors } from '@shared/utils/pageColors'
import { FiX } from 'react-icons/fi'

export default function MetaCampaignsMain() {
  const location = useLocation()
  const colors = getPageColors(location.pathname)
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  // For status dropdown
  const [statusOptions] = useState([
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ]);

  // Fetch all meta campaigns
  const fetchMetaCampaigns = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(endpoints.metaCampaigns.apiRoot)
      const normalized = Array.isArray(res.data)
        ? res.data.map((c) => ({
            ...c,
            status: (c.status || "").toLowerCase() === "active" ? "active" : "inactive",
          }))
        : []
      setCampaigns(normalized)
    } catch (err) {
      Swal.fire('Error', 'Failed to fetch meta campaigns', 'error')
    } finally {
      setLoading(false)
    }
  }

  // If you want to fetch status options from backend, do it here (example):
  // useEffect(() => {
  //   api.get("/api/meta-campaigns/status-options").then(res => setStatusOptions(res.data));
  // }, []);

  useEffect(() => {
    fetchMetaCampaigns();
  }, []);

  // Add new meta campaign
  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      description: form.description.value,
      start_date: form.start_date.value,
      end_date: form.end_date.value,
      total_budget: form.total_budget.value,
      status: form.status.value,
    };
    try {
      await apiClient.post(endpoints.metaCampaigns.apiRoot, data)
      await fetchMetaCampaigns()
      setAddModalOpen(false)
      Swal.fire('Success', 'Meta campaign added!', 'success')
      form.reset()
    } catch {
      Swal.fire('Error', 'Failed to add meta campaign', 'error')
    }
  };

  // Edit meta campaign (open modal)
  const openEditModal = async (id) => {
    try {
      const res = await apiClient.get(endpoints.metaCampaigns.detail(id))
      const payload = {
        ...res.data,
        status:
          (res.data?.status || "").toLowerCase() === "active" ? "active" : "inactive",
      }
      setEditCampaign(payload)
      setEditModalOpen(true)
    } catch {
      Swal.fire('Error', 'Failed to load campaign', 'error')
    }
  };

  // Update meta campaign
  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.id.value;
    const data = {
      name: form.name.value,
      description: form.description.value,
      start_date: form.start_date.value,
      end_date: form.end_date.value,
      total_budget: form.total_budget.value,
      status: form.status.value,
    };
    try {
      await apiClient.put(endpoints.metaCampaigns.detail(id), data)
      await fetchMetaCampaigns()
      setEditModalOpen(false)
      Swal.fire('Success', 'Meta campaign updated!', 'success')
    } catch {
      Swal.fire('Error', 'Failed to update meta campaign', 'error')
    }
  };

  // Delete meta campaign
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Delete this meta campaign?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.delete(endpoints.metaCampaigns.detail(id))
          await fetchMetaCampaigns()
          Swal.fire('Deleted!', 'Meta campaign deleted.', 'success')
        } catch {
          Swal.fire("Error", "Failed to delete meta campaign", "error");
        }
      }
    });
  };

  const fieldStyle = {
    borderColor: `${colors.primary}50`,
  }

  const inputClass =
    "w-full rounded-lg border px-4 py-3 text-[15px] focus:outline-none transition";

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = colors.primary
      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`
    },
    onBlur: (e) => {
      e.target.style.borderColor = `${colors.primary}50`
      e.target.style.boxShadow = ''
    },
  }

  const pillStyle = {
    backgroundColor: `${colors.primary}12`,
    color: colors.primaryDark,
    borderRadius: '0.65rem',
    padding: '0.35rem 0.75rem',
    fontWeight: 600,
    display: 'inline-block',
    minWidth: '90px',
    textAlign: 'center',
  }

  const subtlePillStyle = {
    backgroundColor: `${colors.primary}08`,
    color: '#1f2937',
    borderRadius: '0.65rem',
    padding: '0.35rem 0.75rem',
    display: 'inline-block',
    minWidth: '120px',
    textAlign: 'center',
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <button
          className="flex items-center gap-3 rounded-2xl border bg-white shadow-md hover:shadow-lg px-8 py-6 transition"
          style={{ borderColor: `${colors.primary}40` }}
          onClick={() => setAddModalOpen(true)}
        >
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition"
            style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
          >
            +
          </span>
          <span className="text-lg font-semibold" style={{ color: colors.primary }}>
            Add Meta Campaign
          </span>
        </button>
      </div>

      <h2 className="text-3xl font-bold text-center mb-6" style={{ color: colors.primary }}>
        Meta Campaigns
      </h2>

      <div className="overflow-x-auto rounded-md border bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <table className="min-w-[1100px] w-full text-center">
          <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors.primary }}>
            <tr>
              <th className="px-4 py-3 font-semibold text-center">ID</th>
              <th className="px-4 py-3 font-semibold text-center">NAME</th>
              <th className="px-4 py-3 font-semibold text-center">DESCRIPTION</th>
              <th className="px-4 py-3 font-semibold text-center">START DATE</th>
              <th className="px-4 py-3 font-semibold text-center">END DATE</th>
              <th className="px-4 py-3 font-semibold text-center">TOTAL BUDGET</th>
              <th className="px-4 py-3 font-semibold text-center">STATUS</th>
              <th className="px-4 py-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  Loading...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6" style={{ color: `${colors.primary}80` }}>
                  No campaigns found.
                </td>
              </tr>
            ) : (
              campaigns.map((c, idx) => {
                const isActive = (c.status || "").toLowerCase() === "active"
                return (
                <tr
                  key={c.id}
                  style={{
                    backgroundColor: idx % 2 ? `${colors.primary}04` : 'white',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-medium" style={subtlePillStyle}>
                      {c.description || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.start_date ? c.start_date.split('T')[0] : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.end_date ? c.end_date.split('T')[0] : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="w-full rounded-md px-4 py-2 font-semibold" style={pillStyle}>
                      {c.total_budget !== undefined && c.total_budget !== null
                        ? Number(c.total_budget).toFixed(2)
                        : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button title="Edit" onClick={() => openEditModal(c.id)}>
                        <i
                          className="bi bi-pencil-square"
                          style={{ fontSize: '1.2rem', color: colors.primary }}
                        ></i>
                      </button>
                      <button title="Delete" onClick={() => handleDelete(c.id)}>
                        <i className="bi bi-trash-fill" style={{ fontSize: '1.2rem', color: '#dc3545' }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleAdd}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Add Meta Campaign</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  className={inputClass}
                  placeholder=""
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  className={inputClass}
                  placeholder=""
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  name="end_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Budget</label>
                <input
                  name="total_budget"
                  type="number"
                  className={inputClass}
                  placeholder=""
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  className={inputClass}
                  defaultValue="active"
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-6 border-t mt-4">
                <button
                  type="button"
                  className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editCampaign && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border overflow-hidden"
            style={{ borderColor: `${colors.primary}30` }}
            onSubmit={handleEdit}
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h3 className="text-xl font-semibold">Edit Meta Campaign</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                <FiX />
              </button>
            </div>
            <input type="hidden" name="id" value={editCampaign.id} />
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.name}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.description}
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  defaultValue={editCampaign.start_date ? editCampaign.start_date.split('T')[0] : ''}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  name="end_date"
                  type="date"
                  className={inputClass}
                  placeholder="dd-mm-yyyy"
                  defaultValue={editCampaign.end_date ? editCampaign.end_date.split('T')[0] : ''}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Budget</label>
                <input
                  name="total_budget"
                  type="number"
                  className={inputClass}
                  placeholder=""
                  defaultValue={editCampaign.total_budget}
                  style={fieldStyle}
                  {...focusHandlers}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  className={inputClass}
                  defaultValue={editCampaign.status || "inactive"}
                  required
                  style={fieldStyle}
                  {...focusHandlers}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-6 border-t mt-4">
                <button
                  type="button"
                  className="px-6 py-2 rounded font-semibold border text-gray-700 hover:bg-gray-50"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
