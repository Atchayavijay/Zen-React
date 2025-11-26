import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@shared/api/client'
import { getPageColors } from "@shared/utils/pageColors";
import { FiUserPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function TrainerManagementPage() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // add trainer modal
  const [showAdd, setShowAdd] = useState(false);
  const [tName, setTName] = useState("");
  const [tMobile, setTMobile] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editForm, setEditForm] = useState({
    trainer_name: "",
    trainer_mobile: "",
    trainer_email: "",
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const trainersEndpoint = `${API_BASE_URL}api/trainers`

  async function fetchTrainers() {
    setLoading(true);
    try {
      const res = await fetch(trainersEndpoint, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch trainers: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      if (Array.isArray(data.trainers)) {
        setTrainers(data.trainers);
      } else {
        console.error("Unexpected response structure:", data);
        setTrainers([]);
      }
    } catch (e) {
      console.error("Failed to load trainers:", e);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(r) {
    setEditingTrainer(r);
    setEditForm({
      trainer_name: r.trainer_name || "",
      trainer_mobile: r.trainer_mobile || "",
      trainer_email: r.trainer_email || "",
    });
    setShowEditModal(true);
  }
  function cancelEdit() {
    setShowEditModal(false);
    setEditingTrainer(null);
    setEditForm({
      trainer_name: "",
      trainer_mobile: "",
      trainer_email: "",
    });
  }
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  async function saveEdit() {
    if (!editingTrainer) return;
    try {
      const res = await fetch(`${trainersEndpoint}/${encodeURIComponent(editingTrainer.trainer_id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          trainer_name: editForm.trainer_name.trim(),
          trainer_mobile: editForm.trainer_mobile.trim(),
          trainer_email: editForm.trainer_email.trim(),
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update trainer: ${res.status} ${errorText}`);
      }
      await fetchTrainers();
      cancelEdit();
    } catch (e) {
      console.error("Update failed:", e);
    }
  }
  async function deleteTrainer(id) {
    if (!window.confirm("Delete this trainer?")) return;
    try {
      const res = await fetch(`${trainersEndpoint}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete trainer: ${res.status} ${errorText}`);
      }
      await fetchTrainers();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }

  function resetAddForm() {
    setTName("");
    setTMobile("");
    setTEmail("");
  }
  async function submitAddTrainer(e) {
    e.preventDefault();
    if (!tName.trim() || !tMobile.trim() || !tEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(trainersEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          trainer_name: tName.trim(),
          trainer_mobile: tMobile.trim(),
          trainer_email: tEmail.trim(),
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create trainer: ${res.status} ${errorText}`);
      }
      await fetchTrainers();
      setShowAdd(false);
      resetAddForm();
    } catch (e) {
      console.error("Create failed:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Add New Trainer tile */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 rounded-2xl border bg-white shadow-md hover:shadow-lg px-8 py-6 transition"
          style={{ borderColor: `${colors.primary}40` }}
        >
           <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
           <FiUserPlus className="text-blue-600 text-xl" style={{ color: colors.primary }} />
           
          </span>
          <span className="text-lg font-semibold text-gray-800" style={{ color: colors.primary }}>        
            Add New Trainer
          </span>
        </button>
      </div>

      {/* Title */}
      <h4 className="text-center text-2xl font-semibold text-gray-800 mb-4">
        Trainer List
      </h4>

      {/* Table */}
      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: `${colors.primary}30` }}>
        <div className="max-h-[800px] overflow-y-auto">
          <table className="min-w-full text-center">
            <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors.primary }}>
              <tr>
                <th className="px-6 py-3 font-semibold text-center">
                  TRAINER ID
                </th>
                <th className="px-6 py-3 font-semibold text-center">
                  TRAINER NAME
                </th>
                <th className="px-6 py-3 font-semibold text-center">MOBILE</th>
                <th className="px-6 py-3 font-semibold text-center">EMAIL</th>
                <th className="px-6 py-3 font-semibold text-center">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : trainers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No trainers found
                  </td>
                </tr>
              ) : (
                trainers.map((row, idx) => {
                  return (
                    <tr
                      key={row.trainer_id || idx}
                      style={{ 
                        backgroundColor: idx % 2 ? `${colors.primary}08` : 'white',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center" style={{ color: colors.primaryDark }}>
                        {row.trainer_id}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold" 
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {row.trainer_name}
                          </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-6 py-4 text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {row.trainer_mobile}
                          </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-center">
                          <div
                            className="w-full rounded-md px-6 py-3 text-center font-semibold truncate"
                            style={{
                              backgroundColor: `${colors.primary}12`,
                              color: colors.primaryDark,
                            }}
                          >
                            {row.trainer_email}
                          </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => startEdit(row)}
                              title="Edit"
                              style={{ color: colors.primary }}
                              onMouseEnter={(e) => {
                                e.target.style.color = colors.primaryDark;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = colors.primary;
                              }}
                            >
                              <FiEdit />
                            </button>
                          <button
                            onClick={() => deleteTrainer(row.trainer_id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Trainer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Edit Trainer</h5>
              <button
                onClick={cancelEdit}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveEdit();
              }}
              className="px-6 py-5"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trainer Name</label>
                  <input
                    value={editForm.trainer_name}
                    onChange={(e) => handleEditChange("trainer_name", e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`;
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.trainer_email}
                    onChange={(e) => handleEditChange("trainer_email", e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`;
                      e.target.style.boxShadow = '';
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <input
                    value={editForm.trainer_mobile}
                    onChange={(e) => handleEditChange("trainer_mobile", e.target.value)}
                    required
                    className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                    style={{ borderColor: `${colors.primary}80` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${colors.primary}80`;
                      e.target.style.boxShadow = '';
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
                  className="px-5 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div className="px-6 py-4 text-white flex items-center justify-between"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
              <h5 className="text-lg font-semibold">Create New Trainer</h5>
              <button
                onClick={() => {
                  setShowAdd(false);
                }}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitAddTrainer} className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Trainer Name
                </label>
                <input
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.primary}80`;
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="Enter Trainer Name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Mobile Number
                </label>
                <input
                  value={tMobile}
                  onChange={(e) => setTMobile(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.primary}80`;
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="Enter Mobile Number"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>Email</label>
                <input
                  type="email"
                  value={tEmail}
                  onChange={(e) => setTEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 focus:outline-none transition"
                  style={{ borderColor: `${colors.primary}80` }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.primary}80`;
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="Enter Email"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-white disabled:opacity-60"
                  style={{ backgroundColor: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                  }}
                >
                  {saving ? "Saving…" : "Create Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
