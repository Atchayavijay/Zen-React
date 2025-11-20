import React from "react";
import { FiEdit, FiTrash2, FiLayers } from "react-icons/fi";

const CourseTableRow = ({
  course,
  index,
  onEdit,
  onDelete,
  onManageSubCourses,
  colors,
}) => {
  const handleDelete = () => {
    if (
      window.confirm(`Are you sure you want to delete "${course.course_name}"?`)
    ) {
      onDelete(course.course_id);
    }
  };

  return (
    <tr style={{ 
      backgroundColor: index % 2 ? (colors ? `${colors.primary}08` : '#f9fafb') : 'white',
      transition: 'background-color 0.2s'
    }}>
      {/* Course ID */}
      <td className="px-6 py-4 whitespace-nowrap text-center" style={{ color: colors ? colors.primaryDark : '#374151' }}>
        {course.course_id}
      </td>

      {/* Course Name */}
      <td className="px-6 py-4 text-center">
        <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
             style={{ 
               backgroundColor: colors ? `${colors.primary}12` : '#f3f4f6',
               color: colors ? colors.primaryDark : '#1f2937'
             }}>
          {course.course_name}
        </div>
      </td>

      {/* Course Type */}
      <td className="px-6 py-4 text-center">
        <div className="w-full rounded-md px-6 py-3 text-center font-semibold"
             style={{ 
               backgroundColor: colors ? `${colors.primary}12` : '#f3f4f6',
               color: colors ? colors.primaryDark : '#1f2937'
             }}>
          {course.course_type}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onManageSubCourses?.(course)}
            title="Manage sub-courses"
            className="text-indigo-600 hover:text-indigo-700 p-1"
          >
            <FiLayers size={16} />
          </button>
          <button
            onClick={() => onEdit(course)}
            title="Edit"
            className="p-1"
            style={{ color: colors ? colors.primary : '#2563eb' }}
            onMouseEnter={(e) => {
              if (colors) e.target.style.color = colors.primaryDark;
            }}
            onMouseLeave={(e) => {
              if (colors) e.target.style.color = colors.primary;
            }}
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="text-red-600 hover:text-red-700 p-1"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CourseTableRow;
