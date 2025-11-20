import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from '@shared/api/client'
import { getPageColors } from "@shared/utils/pageColors";
import { FiUserPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import Swal from "sweetalert2";



export default function UsersManagementMain() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const [users, setUsers] = useState([]);

  const [roles, setRoles] = useState([]);

  const [units, setUnits] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);

  const [loadingRoles, setLoadingRoles] = useState(true);

  const [loadingUnits, setLoadingUnits] = useState(true);



  // edit modal state
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "", mobile: "", role_id: "", unit_id: "", profile_image: null });



  // add modal state

  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({

    username: "",
    email: "",
    password: "",
    mobile: "",
    role_id: "",
    unit_id: "",
    profile_image: null, // File
  });



  useEffect(() => {

    fetchUsers();

    fetchRoles();

    fetchUnits();

  }, []);



  async function fetchUsers() {

    setLoadingUsers(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }
  async function fetchRoles() {

    setLoadingRoles(true);

    try {

      const res = await fetch(`${API_BASE_URL}/api/user_roles`, {

        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },

      });

      const data = await res.json();

      setRoles(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Failed to load roles:", err);

      setRoles([]);

    } finally {

      setLoadingRoles(false);

    }

  }



  async function fetchUnits() {

    setLoadingUnits(true);

    try {

      const res = await fetch(`${API_BASE_URL}/leads/units`, {

        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },

      });

      const data = await res.json();

      setUnits(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Failed to load units:", err);

      setUnits([]);

    } finally {

      setLoadingUnits(false);

    }

  }



  // ---- Editing ----

  function startEdit(user) {
    setEditingId(user.id);
    setEditData({
      username: user.username || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role_id: user.role_id || "",
      unit_id: user.unit_id || "",
      profile_image: null, // for new upload only
    });
    setShowEditModal(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({ username: "", email: "", mobile: "", role_id: "", unit_id: "", profile_image: null });
    setShowEditModal(false);
  }

  function handleEditChange(field, value) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEdit(id) {

    try {
      let body, headers;
      if (editData.profile_image) {
        // Use FormData if a new image is selected
        body = new FormData();
        body.append("username", editData.username.trim());
        body.append("email", editData.email.trim());
        body.append("mobile", editData.mobile.trim());
        body.append("role_id", editData.role_id);
        body.append("unit_id", editData.unit_id);
        body.append("profile_image", editData.profile_image);
        headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      } else {
        // Use JSON if no image
        body = JSON.stringify({
          username: editData.username.trim(),
          email: editData.email.trim(),
          mobile: editData.mobile.trim(),
          role_id: editData.role_id,
          unit_id: editData.unit_id,
        });
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        };
      }
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers,
        body,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: "success", title: "User updated!", timer: 1200, showConfirmButton: false });
        await fetchUsers();
        cancelEdit();
      } else {
        Swal.fire({ icon: "error", title: "Update failed", text: data?.message || "Unknown error" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Update failed", text: err.message });
    }

  }



  // ---- Delete ----

  async function deleteUser(id) {

    const result = await Swal.fire({

      title: "Delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33"

    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      let data = {};
      try {
        data = await res.json();
      } catch {}
      if (res.ok) {
        Swal.fire({ icon: "success", title: "User deleted!", timer: 1200, showConfirmButton: false });
        await fetchUsers();
      } else {
        // Show a more helpful error if it's a foreign key constraint
        let msg = data?.error || data?.message || "Unknown error";
        if (msg.includes("foreign key") || msg.includes("constraint")) {
          msg = "Cannot delete user: This user is referenced in other records (e.g., leads, assignments, etc). Remove those references first.";
        }
        Swal.fire({ icon: "error", title: "Delete failed", text: msg });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message });
    }

  } // ✅ fixed missing closing brace here



  // ---- Add ----

  function openAddModal() {

    setShowAddModal(true);

    setNewUser({

      username: "",

      email: "",

      password: "",

      mobile: "",

      role_id: "",

      unit_id: "",

      profile_image: null,

    });

  }

  function closeAddModal() {

    setShowAddModal(false);

  }



  async function saveNewUser() {

    try {

      const fd = new FormData();

      fd.append("username", newUser.username.trim());

      fd.append("email", newUser.email.trim());

      if (newUser.password) fd.append("password", newUser.password);

      if (newUser.mobile) fd.append("mobile", newUser.mobile.trim());

      if (newUser.role_id) fd.append("role_id", newUser.role_id);

      if (newUser.unit_id) fd.append("unit_id", newUser.unit_id);

      if (newUser.profile_image) fd.append("profile_image", newUser.profile_image);



      const res = await fetch(`${API_BASE_URL}/api/users`, {

        method: "POST",

        headers: {

          Authorization: `Bearer ${localStorage.getItem("token")}`,

          // NOTE: do not set Content-Type for FormData; browser sets boundary

        },

        body: fd,

      });

      const data = await res.json();

      if (res.ok) {

        Swal.fire({ icon: "success", title: "User added!", timer: 1200, showConfirmButton: false });

        await fetchUsers();

        closeAddModal();

      } else {

        Swal.fire({ icon: "error", title: "Add failed", text: data?.message || "Unknown error" });

      }

    } catch (err) {

      Swal.fire({ icon: "error", title: "Add failed", text: err.message });

    }

  }



  // helpers

  const roleName = (user) => user.role_name || user.role || "";

  const unitName = (user) => user.unit_name || user.unit || "";



  return (

    <div className="p-4 md:p-6">

      {/* Add User CTA */}

      <div className="mb-6">

        <button

          onClick={openAddModal}

          className="flex items-center gap-3 rounded-2xl border bg-white shadow-md hover:shadow-lg px-8 py-6 transition"

          style={{ borderColor: `${colors.primary}40` }}

        >

          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition"
                style={{ backgroundColor: `${colors.primary}15` }}>

            <FiUserPlus className="text-xl" style={{ color: colors.primary }} />

          </span>

          <span className="text-lg font-semibold" style={{ color: colors.primary }}>Add New User</span>

        </button>

      </div>



      {/* Add Modal */}

      {showAddModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">

          <div className="w-full max-w-3xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">

            <div className="px-6 py-4 text-white flex items-center justify-between"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>

              <h5 className="text-lg font-semibold">Create New User</h5>

              <button

                onClick={closeAddModal}

                className="text-white/90 hover:text-white text-2xl leading-none"

                aria-label="Close"

              >

                <FiX />

              </button>

            </div>

            <form onSubmit={e => { e.preventDefault(); saveNewUser(); }} className="px-6 py-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm font-medium mb-1">Username</label>

                  <Input

                    placeholder="Username"

                    value={newUser.username}

                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}

                    required
                    focusColor={colors.primary}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">Email</label>

                  <Input

                    type="email"

                    placeholder="Email"

                    value={newUser.email}

                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}

                    required
                    focusColor={colors.primary}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">Password</label>

                  <Input

                    type="password"

                    placeholder="Password"

                    value={newUser.password}

                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}

                    required
                    focusColor={colors.primary}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">Mobile</label>

                  <Input

                    placeholder="Mobile"

                    value={newUser.mobile}

                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                    focusColor={colors.primary}

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">Role</label>

                  <Select

                    value={newUser.role_id || ""}

                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}

                    required
                    focusColor={colors.primary}

                  >

                    <option value="">Select Role</option>

                    {roles.map((r) => (

                      <option key={r.role_id} value={r.role_id}>

                        {r.role_name}

                      </option>

                    ))}

                  </Select>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-1">Unit</label>

                  <Select

                    value={newUser.unit_id || ""}

                    onChange={(e) => setNewUser({ ...newUser, unit_id: e.target.value })}

                    required
                    focusColor={colors.primary}

                  >

                    <option value="">Select Unit</option>

                    {units.map((u) => (

                      <option key={u.unit_id} value={u.unit_id}>

                        {u.unit_name}

                      </option>

                    ))}

                  </Select>

                </div>

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-1">Profile Image (optional)</label>

                  <div className="flex items-center gap-4">

                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-lg font-semibold">
                      {(newUser.username && newUser.username[0]?.toUpperCase()) || "U"}
                    </div>

                    <input

                      type="file"

                      className="text-sm"

                      onChange={(e) => setNewUser({ ...newUser, profile_image: e.target.files?.[0] || null })}

                    />

                  </div>

                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-6 border-t mt-6">

                <button

                  type="button"

                  onClick={closeAddModal}

                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"

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

                  Save

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-3xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}
            >
              <h5 className="text-lg font-semibold">Edit User</h5>
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
                if (editingId) {
                  saveEdit(editingId);
                }
              }}
              className="px-6 py-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={editData.username}
                    onChange={(e) => handleEditChange("username", e.target.value)}
                    focusColor={colors.primary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                    focusColor={colors.primary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <Input
                    value={editData.mobile}
                    onChange={(e) => handleEditChange("mobile", e.target.value)}
                    focusColor={colors.primary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Select
                    value={editData.role_id}
                    onChange={(e) => handleEditChange("role_id", e.target.value)}
                    focusColor={colors.primary}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <Select
                    value={editData.unit_id}
                    onChange={(e) => handleEditChange("unit_id", e.target.value)}
                    focusColor={colors.primary}
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {editingId && users.find((u) => u.id === editingId)?.profile_image ? (
                      <img
                        src={`data:image/png;base64,${
                          users.find((u) => u.id === editingId)?.profile_image
                        }`}
                        alt={editData.username || "user"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-lg font-semibold">
                        {(editData.username && editData.username[0]?.toUpperCase()) || "U"}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="text-sm"
                      onChange={(e) =>
                        handleEditChange("profile_image", e.target.files?.[0] || null)
                      }
                    />
                  </div>
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

      {/* Title */}

      <h4 className="text-center text-2xl font-semibold mb-6" style={{ color: colors.primary }}>

        User Management

      </h4>



      {/* Table */}

      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: `${colors.primary}30` }}>

        <div className="max-h-[800px] overflow-y-auto">

          <table className="min-w-full text-center">

            <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors.primary }}>

              <tr>

                <th className="px-6 py-3 font-semibold text-center">USERNAME</th>
                <th className="px-6 py-3 font-semibold text-center">EMAIL</th>
                <th className="px-6 py-3 font-semibold text-center">MOBILE</th>
                <th className="px-6 py-3 font-semibold text-center">ROLE</th>
                <th className="px-6 py-3 font-semibold text-center">UNIT</th>
                <th className="px-6 py-3 font-semibold text-center">IMAGE</th>
                <th className="px-6 py-3 font-semibold text-center">ACTIONS</th>
              </tr>

            </thead>
            <tbody className="text-sm">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center" style={{ color: `${colors.primary}80` }}>
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center" style={{ color: `${colors.primary}80` }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {

                  try {

                    return (

                      <tr key={user.id ?? idx} style={{ 
                        backgroundColor: idx % 2 ? `${colors.primary}08` : 'white',
                        transition: 'background-color 0.2s'
                      }}>

                        {/* USERNAME */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {user.username ?? "-"}
                          </div>
                        </td>



                        {/* EMAIL */}

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full bg-gray-100 rounded-md px-6 py-3 text-center font-semibold text-gray-800 truncate">
                            {user.email ?? "-"}
                          </div>
                        </td>



                        {/* MOBILE */}

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {user.mobile ?? "-"}
                          </div>
                        </td>




                        {/* ROLE */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {roleName(user) || "-"}
                          </div>
                        </td>




                        {/* UNIT */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
                               style={{ 
                                 backgroundColor: `${colors.primary}12`,
                                 color: colors.primaryDark
                               }}>
                            {unitName(user) || "-"}
                          </div>
                        </td>



                        {/* IMAGE */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {user.profile_image ? (
                              <img
                                src={`data:image/png;base64,${user.profile_image}`}
                                alt={user.username || "user"}
                                className="w-9 h-9 rounded-full object-cover inline-block"
                              />
                            ) : (
                              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white text-sm font-semibold">
                                {(user.username && user.username[0]?.toUpperCase()) || "U"}
                              </div>
                            )}
                        </td>



                        {/* ACTIONS */}

                        <td className="px-6 py-4 whitespace-nowrap text-center">

                          <div className="flex items-center justify-center gap-4">

                            <button

                              onClick={() => startEdit(user)}

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

                              onClick={() => deleteUser(user.id)}

                              title="Delete"

                              className="text-red-600 hover:text-red-700"

                            >

                              <FiTrash2 />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  } catch (err) {

                    console.error("Error rendering user row:", err, user);

                    return null;

                  }

                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

/* ---------- tiny UI helpers ---------- */



function Input({ className = "", focusColor, ...props }) {

  return (

    <input

      {...props}

      className={`rounded-md border px-3 py-1.5 text-sm outline-none transition ${className}`}
      onFocus={(e) => {
        if (focusColor) {
          e.target.style.borderColor = focusColor;
          e.target.style.boxShadow = `0 0 0 2px ${focusColor}40`;
        }
      }}
      onBlur={(e) => {
        if (focusColor) {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }
      }}

    />

  );

}

function Select({ className = "", focusColor, ...props }) {

  return (

    <select

      {...props}

      className={`rounded-md border px-3 py-1.5 text-sm outline-none transition w-full ${className}`}
      onFocus={(e) => {
        if (focusColor) {
          e.target.style.borderColor = focusColor;
          e.target.style.boxShadow = `0 0 0 2px ${focusColor}40`;
        }
      }}
      onBlur={(e) => {
        if (focusColor) {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }
      }}

    />

  );

}
