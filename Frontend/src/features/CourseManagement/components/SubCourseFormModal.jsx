import React, { useEffect, useState } from "react";
import { FiX, FiCheckCircle } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { getPageColors } from "@shared/utils/pageColors";

const defaultState = {
  sub_course_name: "",
  sub_course_description: "",
  duration_hours: "",
};

const SubCourseFormModal = ({
  isOpen,
  mode = "create",
  course,
  initialData = null,
  onClose,
  onSubmit,
}) => {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const [formState, setFormState] = useState(defaultState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormState({
        sub_course_name: initialData.sub_course_name || "",
        sub_course_description: initialData.sub_course_description || "",
        duration_hours:
          initialData.duration_hours != null
            ? String(initialData.duration_hours)
            : "",
      });
    } else {
      setFormState(defaultState);
    }
  }, [initialData, isOpen]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formState.sub_course_name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sub_course_name: formState.sub_course_name.trim(),
        sub_course_description: formState.sub_course_description.trim() || null,
        duration_hours: formState.duration_hours
          ? Number(formState.duration_hours)
          : null,
      };
      await onSubmit?.(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 text-white flex items-center justify-between"
             style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})` }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <FiCheckCircle className="text-xl" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">
                {mode === "edit" ? "Edit Sub-Course" : "Add Sub-Course"}
              </h3>
              {course?.course_name && (
                <p className="text-xs text-white/80">
                  Course: {course.course_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/85 hover:text-white text-2xl leading-none"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Sub-Course Name <span className="text-red-500">*</span>
            </label>
            <input
              value={formState.sub_course_name}
              onChange={(e) => handleChange("sub_course_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }}
              placeholder="e.g., Python Fundamentals"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formState.sub_course_description}
              onChange={(e) =>
                handleChange("sub_course_description", e.target.value)
              }
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }}
              placeholder="Describe the content and objectives of this sub-course..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional: provide a short summary to help trainers/students.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Duration (hours)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formState.duration_hours}
              onChange={(e) => handleChange("duration_hours", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }}
              placeholder="e.g., 40"
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional: total hours required to complete this sub-course.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formState.sub_course_name.trim()}
              className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.primary;
              }}
            >
              {saving
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                ? "Save Changes"
                : "Create Sub-Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCourseFormModal;

