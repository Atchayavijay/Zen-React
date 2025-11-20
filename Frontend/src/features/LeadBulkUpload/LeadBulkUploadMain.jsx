// export default function LeadBulkUploadMain() {
//   return (
//     <div>
//       <h1 className="text-xl font-bold mb-4">Lead Bulk Upload</h1>
//       <p>Upload leads in bulk using CSV or Excel files.</p>
//     </div>
//   );
// }

// File: src/components/BulkUpload.jsx
import React, { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'

export default function BulkUpload() {
  const [courseList, setCourseList] = useState([]);
  const [dropText, setDropText] = useState("Drag & Drop CSV File Here or Click to Upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropboxRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch Courses on mount (leave data empty until backend responds)
  useEffect(() => {
    fetchCoursesForValidation();
  }, []);

  async function fetchCoursesForValidation() {
    try {
      const response = await apiClient.get(endpoints.courses.root)
      const data = response.data
      if (Array.isArray(data)) {
        setCourseList(data)
      } else if (Array.isArray(data?.courses)) {
        setCourseList(data.courses)
      } else {
        console.error('Invalid course data format:', data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  // Handlers for drag/drop & click
  function onClickDropbox() {
    fileInputRef.current.click();
  }

  function onDragOver(e) {
    e.preventDefault();
    dropboxRef.current.classList.add("dragover");
  }

  function onDragLeave() {
    dropboxRef.current.classList.remove("dragover");
  }

  function onDrop(e) {
    e.preventDefault();
    dropboxRef.current.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith(".csv")) {
      handleFileSelect(files[0]);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please drop a valid CSV file.",
        confirmButtonColor: "#dc3545",
      });
    }
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please select a valid CSV file.",
        confirmButtonColor: "#dc3545",
      });
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(file) {
    setSelectedFile(file);
    setDropText(file.name);
  }

  // Form submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select a file to upload.",
        confirmButtonColor: "#ffc107",
      });
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const { data } = await apiClient.post(endpoints.leads.bulkUpload, formData)

      await Swal.fire({
        icon: 'success',
        title: 'Upload Complete',
        text: data.message || 'Leads uploaded successfully!',
        confirmButtonColor: '#28a745',
      })
      window.location.reload()
    } catch (error) {
      const result = error.response?.data

      if (result) {
        const errorMessage = result.error || 'Upload Failed'
        const errorDetails = Array.isArray(result.issues) && result.issues.length > 0
          ? result.issues.join('\n')
          : result.details || 'Unknown error occurred.'

        await Swal.fire({
          icon: 'error',
          title: errorMessage,
          html: `<pre style="text-align:left;white-space:pre-wrap">${errorDetails}</pre>`,
          confirmButtonColor: '#dc3545',
          width: 600,
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'Failed to upload leads due to a network issue.',
          confirmButtonColor: '#dc3545',
        })
      }
      setIsSubmitting(false)
    }
  }

  // Export leads
  async function handleExport(e) {
    e.preventDefault()
    try {
      const response = await apiClient.get(endpoints.exportLeads, {
        responseType: 'blob',
      })
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'leads.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Download sample CSV (pink button)
  async function handleDownloadSample(e) {
    e.preventDefault()
    try {
      const response = await apiClient.get(endpoints.leads.sampleCsv, {
        responseType: 'blob',
      })
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sample_leads.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mt-8 px-4 md:px-6">
      {/* Upload area + buttons */}
      <form id="bulkUploadForm" onSubmit={handleSubmit} className="space-y-4">
        <div
          id="dropbox"
          ref={dropboxRef}
          onClick={onClickDropbox}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="p-8 min-h-[120px] w-full max-w-3xl border-2 border-dashed border-blue-400 rounded-lg text-center cursor-pointer text-gray-600"
        >
          {dropText}
        </div>

        <input
          id="csvFile"
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Uploading…" : "Upload CSV"}
          </button>
          <button
            id="exportLeadsButton"
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Leads
          </button>
        </div>
      </form>

      {/* Instructions block */}
      <section className="space-y-3">
        <h3 className="text-2xl font-semibold">Bulk Upload Instructions</h3>
        <p className="text-sm">
          <span className="text-red-600 font-semibold">*</span>
          <span className="font-semibold ml-1">Mandatory Fields:</span>{" "}
          Name, Mobile Number, CourseID, status
        </p>
        <p className="text-sm">
          <span className="font-semibold">Optional Fields:</span>{" "}
          Email, Role, College/Company, Location, Source, Batch Name, Trainer Name, Trainer Mobile, Trainer Email,
          Actual Fee, Discounted Fee, Fee Paid, Fee Balance, Paid Status, Status, Comments
        </p>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          Download Sample CSV
        </button>
      </section>

      {/* Courses table */}
      <section className="space-y-2">
        <h3 className="text-xl font-semibold">Course List With IDs</h3>

        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                Course ID
              </th>
              <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                Course Name
              </th>
              <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                Course Type
              </th>
            </tr>
          </thead>
          <tbody>
            {courseList.length === 0 ? (
              // leave empty row while backend data loads
              <tr>
                <td className="px-4 py-3 border">&nbsp;</td>
                <td className="px-4 py-3 border">&nbsp;</td>
                <td className="px-4 py-3 border">&nbsp;</td>
              </tr>
            ) : (
              courseList.map((course) => (
                <tr key={course.course_id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border">{course.course_id}</td>
                  <td className="px-4 py-2 border">{course.course_name}</td>
                  <td className="px-4 py-2 border">{course.course_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

