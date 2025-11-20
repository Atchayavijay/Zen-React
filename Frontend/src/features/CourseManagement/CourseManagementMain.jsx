import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiPlus, FiEdit } from "react-icons/fi";
import { Toaster } from "react-hot-toast";
import { useCourses } from "@shared/hooks/useCourses";
import { getPageColors } from "@shared/utils/pageColors";
import AddCourseModal from "@features/CourseManagement/components/AddCourseModal";
import CourseTable from "@features/CourseManagement/components/CourseTable";
import AuthGuard from "@app/routes/AuthGuard";
import SubCourseListModal from "@features/CourseManagement/components/SubCourseListModal";
import SubCourseFormModal from "@features/CourseManagement/components/SubCourseFormModal";
import { courseService } from "@shared/services/courses/courseService";
import { useNotification } from "@shared/hooks/useNotification";

export default function CourseManagementPage() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const {
    courses,
    loading,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseTypes,
  } = useCourses();
  const { showSuccess, showError } = useNotification();

  const [showAddModal, setShowAddModal] = useState(false);
  const [courseTypes, setCourseTypes] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [subCoursesLoading, setSubCoursesLoading] = useState(false);
  const [showSubCourseModal, setShowSubCourseModal] = useState(false);
  const [subCourseFormOpen, setSubCourseFormOpen] = useState(false);
  const [editingSubCourse, setEditingSubCourse] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseType, setEditCourseType] = useState("");
  const [editCustomType, setEditCustomType] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Load course types when component mounts or courses change
  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        // Don't show error toasts for initial course type loading
        const types = await getCourseTypes(false);
        setCourseTypes(types);
      } catch (error) {
        console.error("Error loading course types:", error);
        // Fallback to extracting types from existing courses
        if (courses.length > 0) {
          const fallbackTypes = [
            ...new Set(
              courses.map((course) => course.course_type).filter(Boolean)
            ),
          ];
          setCourseTypes(fallbackTypes);
        }
      }
    };
    loadCourseTypes();
  }, [courses]); // Remove getCourseTypes from dependencies to prevent infinite loop

  // Handlers for Add Modal
  const handleAddCourse = async (courseData) => {
    const result = await addCourse(courseData);
    return result;
  };

  const openEditModal = (course) => {
    if (!course) return;
    setEditingCourse(course);
    const existingType = course.course_type || "";
    if (existingType && courseTypes.includes(existingType)) {
      setEditCourseType(existingType);
      setEditCustomType("");
    } else if (existingType) {
      setEditCourseType("__custom__");
      setEditCustomType(existingType);
    } else {
      setEditCourseType("");
      setEditCustomType("");
    }
    setEditCourseName(course.course_name || "");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCourse(null);
    setEditCourseName("");
    setEditCourseType("");
    setEditCustomType("");
    setSavingEdit(false);
  };

  const handleUpdateCourse = async (courseId, payload) => {
    const result = await updateCourse(courseId, payload);
    if (result.success) {
      showSuccess("Course updated successfully");
      closeEditModal();
    } else if (result.error) {
      showError(result.error);
    }
    return result;
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    const type =
      editCourseType === "__custom__"
        ? editCustomType.trim()
        : editCourseType.trim();
    if (!editCourseName.trim() || !type) return;
    setSavingEdit(true);
    await handleUpdateCourse(editingCourse.course_id, {
      course_name: editCourseName.trim(),
      course_type: type,
    });
    setSavingEdit(false);
  };

  const handleDelete = async (courseId) => {
    const result = await deleteCourse(courseId);
    if (!result.success && result.error) {
      // Show a user-friendly alert for foreign key constraint errors
      if (
        result.error.includes("assigned to") ||
        result.error.includes("referenced by")
      ) {
        window.alert(
          `Cannot delete this course.\n\n${result.error}\n\nPlease reassign or remove all related leads before deleting.`
        );
      } else {
        window.alert(`Error: ${result.error}`);
      }
    }
  };

  const loadSubCourses = async (courseId) => {
    setSubCoursesLoading(true);
    const result = await courseService.getSubCourses(courseId);
    if (result.success) {
      setSubCourses(result.data);
    } else {
      setSubCourses([]);
      showError(result.error || "Failed to load sub-courses.");
    }
    setSubCoursesLoading(false);
  };

  const handleManageSubCourses = async (course) => {
    setSelectedCourse(course);
    setShowSubCourseModal(true);
    await loadSubCourses(course.course_id);
  };

  const handleAddSubCourseClick = () => {
    setEditingSubCourse(null);
    setSubCourseFormOpen(true);
  };

  const handleEditSubCourseClick = (subCourse) => {
    setEditingSubCourse(subCourse);
    setSubCourseFormOpen(true);
  };

  const handleDeleteSubCourse = async (subCourse) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subCourse.sub_course_name}"?`
      )
    ) {
      return;
    }
    const result = await courseService.deleteSubCourse(
      subCourse.sub_course_id
    );
    if (result.success) {
      showSuccess("Sub-course deleted successfully!");
      await loadSubCourses(selectedCourse.course_id);
    } else {
      showError(result.error || "Failed to delete sub-course.");
    }
  };

  const handleSubmitSubCourse = async (payload) => {
    const courseId = selectedCourse?.course_id;
    if (!courseId) {
      showError("Course ID is missing.");
      return;
    }

    let result;
    if (editingSubCourse) {
      result = await courseService.updateSubCourse(
        editingSubCourse.sub_course_id,
        payload
      );
      if (result.success) {
        showSuccess("Sub-course updated successfully!");
      }
    } else {
      result = await courseService.addSubCourse({
        ...payload,
        course_id: courseId,
      });
      if (result.success) {
        showSuccess("Sub-course added successfully!");
      }
    }

    if (result?.success) {
      setSubCourseFormOpen(false);
      setEditingSubCourse(null);
      await loadSubCourses(courseId);
    } else if (result?.error) {
      showError(result.error);
    }
  };

  const closeSubCourseModal = () => {
    setShowSubCourseModal(false);
    setSubCourseFormOpen(false);
    setEditingSubCourse(null);
    setSelectedCourse(null);
    setSubCourses([]);
  };

  return (
    <AuthGuard>
      <div className="p-4 md:p-6">
        <Toaster
          position="top-center"
          containerStyle={{ top: 80 }}
          toastOptions={{
            duration: 2500,
            style: {
              fontSize: "0.9rem",
              borderRadius: "10px",
            },
          }}
        />

        {/* Add New Course Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 rounded-xl border shadow-md px-8 py-6 hover:shadow-lg bg-white transition"
            style={{ borderColor: `${colors.primary}40` }}
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg transition"
                  style={{ backgroundColor: `${colors.primary}15` }}>
              <FiPlus className="text-xl" style={{ color: colors.primary }} />
            </span>
            <span className="text-lg font-semibold" style={{ color: colors.primary }}>
              Add New Course
            </span>
          </button>
        </div>

        {/* Title */}
        <h4 className="text-center text-2xl font-semibold mb-6" style={{ color: colors.primary }}>
          Course Management
        </h4>

        {/* Courses Table */}
        <CourseTable
          courses={courses}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onManageSubCourses={handleManageSubCourses}
          colors={colors}
        />

        {/* Add Course Modal */}
        <AddCourseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddCourse}
          courseTypes={courseTypes}
        />

        <SubCourseListModal
          isOpen={showSubCourseModal}
          course={selectedCourse}
          subCourses={subCourses}
          loading={subCoursesLoading}
          onClose={closeSubCourseModal}
          onAddClick={handleAddSubCourseClick}
          onEditClick={handleEditSubCourseClick}
          onDelete={handleDeleteSubCourse}
        />

        <SubCourseFormModal
          isOpen={subCourseFormOpen}
          mode={editingSubCourse ? "edit" : "create"}
          course={selectedCourse}
          initialData={editingSubCourse}
          onClose={() => {
            setSubCourseFormOpen(false);
            setEditingSubCourse(null);
          }}
          onSubmit={handleSubmitSubCourse}
        />
        {showEditModal && editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white overflow-hidden">
              <div
                className="px-6 py-4 text-white flex items-center justify-between"
                style={{
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/20">
                    <FiEdit className="text-white text-xl" />
                  </span>
                  <h5 className="text-lg font-semibold">Edit Course</h5>
                </div>
                <button
                  onClick={closeEditModal}
                  aria-label="Close"
                  className="text-white/90 hover:text-white text-2xl leading-none"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleEditCourseSubmit} className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editCourseType}
                      onChange={(e) => setEditCourseType(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary;
                        e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "";
                        e.target.style.boxShadow = "";
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
                  </div>

                  {editCourseType === "__custom__" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter New Course Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={editCustomType}
                        onChange={(e) => setEditCustomType(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "";
                          e.target.style.boxShadow = "";
                        }}
                      />
                    </div>
                  )}

                  <div className={editCourseType === "__custom__" ? "" : "md:col-span-2"}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={editCourseName}
                      onChange={(e) => setEditCourseName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] focus:outline-none transition"
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.primary;
                        e.target.style.boxShadow = `0 0 0 2px ${colors.primary}40`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "";
                        e.target.style.boxShadow = "";
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={savingEdit}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      savingEdit ||
                      !editCourseName.trim() ||
                      !editCourseType ||
                      (editCourseType === "__custom__" && !editCustomType.trim())
                    }
                    className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.primary }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.primaryDark;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.primary;
                    }}
                  >
                    {savingEdit ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
