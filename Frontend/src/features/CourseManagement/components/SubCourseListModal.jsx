import React from "react";
import {
  FiX,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
} from "react-icons/fi";

const SubCourseListModal = ({
  isOpen,
  course,
  subCourses = [],
  loading = false,
  onClose,
  onAddClick,
  onEditClick,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30">
      <div className="w-full max-w-5xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-3 text-lg font-semibold">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                <FiBookOpen className="text-xl" />
              </span>
              Sub-Courses
            </span>
            <span className="text-sm text-white/70 mt-1">
              {course?.course_name
                ? `Course: ${course.course_name}`
                : "No course selected"}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            <FiX />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <p className="text-sm text-slate-600">
              Manage sub-courses/modules for this course.
            </p>
          </div>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <FiPlus className="text-base" />
            Add Sub-Course
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full border-b-2 border-green-600 animate-spin" />
                <span>Loading sub-courses…</span>
              </div>
            </div>
          ) : subCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-slate-500">
              <span className="text-4xl">📘</span>
              <p className="mt-3 text-base font-medium">
                No sub-courses found for this course.
              </p>
              <p className="text-sm text-slate-500">
                Use “Add Sub-Course” to create the first one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">#</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Sub-Course Name
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Duration (Hours)
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {subCourses.map((subCourse, index) => (
                    <tr
                      key={subCourse.sub_course_id || index}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-5 py-3">{index + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {subCourse.sub_course_name}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {subCourse.sub_course_description || (
                          <span className="italic text-slate-400">
                            No description provided
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {subCourse.duration_hours != null
                          ? `${subCourse.duration_hours} hrs`
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onEditClick?.(subCourse)}
                            title="Edit"
                            className="inline-flex items-center justify-center rounded-md border border-indigo-200 p-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                          <button
                            onClick={() => onDelete?.(subCourse)}
                            title="Delete"
                            className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCourseListModal;

