import React from "react";
import CourseTableRow from "./CourseTableRow";

const CourseTable = ({
  courses,
  loading,
  onEdit,
  onDelete,
  onManageSubCourses,
  colors,
}) => {
  if (loading) {
    return (
      <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: colors ? `${colors.primary}30` : '#e5e7eb' }}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors ? colors.primary : '#2563eb' }}></div>
            <span style={{ color: colors ? `${colors.primary}80` : '#6b7280' }}>Loading courses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: colors ? `${colors.primary}30` : '#e5e7eb' }}>
      <div className="max-h-[600px] overflow-y-auto">
        <table className="min-w-full text-center">
          <thead className="sticky top-0 text-white text-sm" style={{ backgroundColor: colors ? colors.primary : '#111827' }}>
            <tr>
              <th className="px-6 py-3 font-semibold text-center">COURSE ID</th>
              <th className="px-6 py-3 font-semibold text-center">COURSE NAME</th>
              <th className="px-6 py-3 font-semibold text-center">COURSE TYPE</th>
              <th className="px-6 py-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center" style={{ color: colors ? `${colors.primary}80` : '#6b7280' }}>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📚</span>
                    <span>No courses found</span>
                    <span className="text-xs">
                      Add your first course to get started
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              courses.map((course, index) => (
              <CourseTableRow
                key={course.course_id || index}
                course={course}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onManageSubCourses={onManageSubCourses}
                colors={colors}
              />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseTable;
