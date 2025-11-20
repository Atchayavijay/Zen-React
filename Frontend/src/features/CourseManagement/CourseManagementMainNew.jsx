// import React, { useEffect, useState } from "react";
// import { FiPlus } from "react-icons/fi";
// import { Toaster } from "react-hot-toast";
// import { useCourses } from "@shared/hooks/useCourses";
// import AddCourseModal from "@features/CourseManagement/components/AddCourseModal";
// import CourseTable from "@features/CourseManagement/components/CourseTable";
// import AuthGuard from "@app/routes/AuthGuard";

// export default function CourseManagementPage() {
//   const {
//     courses,
//     loading,
//     addCourse,
//     updateCourse,
//     deleteCourse,
//     getCourseTypes,
//   } = useCourses();

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [courseTypes, setCourseTypes] = useState([]);

//   // Inline edit state
//   const [editingId, setEditingId] = useState(null);
//   const [editData, setEditData] = useState({
//     course_name: "",
//     course_type: "",
//   });

//   // Load course types when component mounts or courses change
//   useEffect(() => {
//     const loadCourseTypes = async () => {
//       try {
//         // Don't show error toasts for initial course type loading
//         const types = await getCourseTypes(false);
//         setCourseTypes(types);
//       } catch (error) {
//         console.error("Error loading course types:", error);
//         // Fallback to extracting types from existing courses
//         if (courses.length > 0) {
//           const fallbackTypes = [
//             ...new Set(
//               courses.map((course) => course.course_type).filter(Boolean)
//             ),
//           ];
//           setCourseTypes(fallbackTypes);
//         }
//       }
//     };
//     loadCourseTypes();
//   }, [courses]); // Remove getCourseTypes from dependencies to prevent infinite loop

//   // Handlers for Add Modal
//   const handleAddCourse = async (courseData) => {
//     const result = await addCourse(courseData);
//     return result;
//   };

//   // Handlers for Inline Edit
//   const handleEditStart = (course) => {
//     setEditingId(course.course_id);
//     setEditData({
//       course_name: course.course_name || "",
//       course_type: course.course_type || "",
//     });
//   };

//   const handleEditCancel = () => {
//     setEditingId(null);
//     setEditData({ course_name: "", course_type: "" });
//   };

//   const handleEditChange = (changes) => {
//     setEditData((prev) => ({ ...prev, ...changes }));
//   };

//   const handleEditSave = async (courseId) => {
//     if (!editData.course_name.trim() || !editData.course_type.trim()) {
//       return;
//     }

//     const result = await updateCourse(courseId, {
//       course_name: editData.course_name.trim(),
//       course_type: editData.course_type.trim(),
//     });

//     if (result.success) {
//       handleEditCancel();
//     }
//   };

//   const handleDelete = async (courseId) => {
//     const result = await deleteCourse(courseId);
//     if (!result.success && result.error) {
//       // Show a user-friendly alert for foreign key constraint errors
//       if (
//         result.error.includes("assigned to") ||
//         result.error.includes("referenced by")
//       ) {
//         window.alert(
//           `Cannot delete this course.\n\n${result.error}\n\nPlease reassign or remove all related leads before deleting.`
//         );
//       } else {
//         window.alert(`Error: ${result.error}`);
//       }
//     }
//   };

//   return (
//     <AuthGuard>
//       <div className="p-4 md:p-6">
//         <Toaster />

//         {/* Add New Course Button */}
//         <div className="mb-6">
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="flex items-center gap-3 rounded-xl border border-gray-200 shadow-md px-8 py-6 hover:shadow-lg bg-white transition-shadow"
//           >
//             <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
//               <FiPlus className="text-blue-600 text-xl" />
//             </span>
//             <span className="text-lg font-semibold text-gray-800">
//               Add New Course
//             </span>
//           </button>
//         </div>

//         {/* Title */}
//         <h4 className="text-center text-2xl font-semibold text-gray-800 mb-6">
//           Course Management
//         </h4>

//         {/* Courses Table */}
//         <CourseTable
//           courses={courses}
//           loading={loading}
//           editingId={editingId}
//           editData={editData}
//           onEditStart={handleEditStart}
//           onEditCancel={handleEditCancel}
//           onEditSave={handleEditSave}
//           onEditChange={handleEditChange}
//           onDelete={handleDelete}
//         />

//         {/* Add Course Modal */}
//         <AddCourseModal
//           isOpen={showAddModal}
//           onClose={() => setShowAddModal(false)}
//           onSubmit={handleAddCourse}
//           courseTypes={courseTypes}
//         />
//       </div>
//     </AuthGuard>
//   );
// }
