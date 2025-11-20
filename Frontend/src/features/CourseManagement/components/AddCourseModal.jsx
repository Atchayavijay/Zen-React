import React, { useState } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { getPageColors } from "@shared/utils/pageColors";

const AddCourseModal = ({ isOpen, onClose, onSubmit, courseTypes = [] }) => {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const [courseName, setCourseName] = useState("");
  const [courseType, setCourseType] = useState("");
  const [customType, setCustomType] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCourseName("");
    setCourseType("");
    setCustomType("");
    setSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const type =
      courseType === "__custom__" ? customType.trim() : courseType.trim();

    if (!courseName.trim() || !type) {
      return;
    }

    setSaving(true);
    try {
      const result = await onSubmit({
        course_name: courseName.trim(),
        course_type: type,
      });

      if (result?.success !== false) {
        handleClose();
      }
    } catch (error) {
      console.error("Error submitting course:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${colors.gradient} text-white flex items-center justify-between`}
             style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/20">
              <FiPlus className="text-white text-xl" />
            </span>
            <h5 className="text-lg font-semibold">Add New Course</h5>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-white/90 hover:text-white text-2xl leading-none"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Course Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type <span className="text-red-500">*</span>
              </label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                style={{
                  '--tw-ring-color': colors.primary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
              >
                <option value="" disabled>
                  Select type…
                </option>
                {courseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__custom__">+ Add new type…</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Pick an existing type or choose "Add new type…"
              </p>
            </div>

            {/* Custom Course Type */}
            {courseType === "__custom__" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter New Course Type <span className="text-red-500">*</span>
                </label>
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g., Cloud & DevOps"
                  required={courseType === "__custom__"}
                  className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px]
                       focus:outline-none focus:ring-2 ${colors.ring} focus:border-${colors.primary.split('#')[1] ? '' : 'pink-500'}
                       transition`}
                  style={{
                    '--tw-ring-color': colors.primary,
                    '--tw-border-color': colors.primary,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '';
                    e.target.style.boxShadow = '';
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be saved as a new type.
                </p>
              </div>
            )}

            {/* Course Name */}
            <div className={courseType === "__custom__" ? "" : "md:col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Enter Course Name"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                style={{
                  '--tw-ring-color': colors.primary,
                }}
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !courseName.trim() ||
                !courseType ||
                (courseType === "__custom__" && !customType.trim())
              }
              className={`px-5 py-2.5 rounded-lg text-white font-medium
                   ${colors.hover} disabled:opacity-60 disabled:cursor-not-allowed`}
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.primary;
              }}
            >
              {saving ? "Saving…" : "Save Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourseModal;
