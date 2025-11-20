
import React, { useEffect, useState, useMemo } from "react";
import Swal from 'sweetalert2'
import { FiRefreshCw, FiArchive, FiSearch, FiX, FiPhone, FiMail, FiUsers, FiBookOpen, FiRotateCw, FiArrowLeft } from 'react-icons/fi'

// Add animation styles
if (typeof window !== 'undefined' && window.document && !document.head.querySelector('style[data-archived-leads-anim]')) {
  const style = document.createElement('style');
  style.setAttribute('data-archived-leads-anim', 'true');
  style.innerHTML = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// --- Helper functions and components copied from DashboardMain.jsx ---
function getTimeDifference(dateString) {
  if (!dateString) return { text: "-", isOverADay: false };
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now - created;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return { text: "<1hr", isOverADay: false };
  if (diffHrs < 24) return { text: `${diffHrs}hr`, isOverADay: false };
  const diffDays = Math.floor(diffHrs / 24);
  return { text: `${diffDays}d`, isOverADay: true };
}
function getStatusColor(status) {
  switch ((status || "").trim().toLowerCase()) {
    case "paid":
      return "#28a745";
    case "partially paid":
      return "#ffc107";
    case "not paid":
      return "#dc3545";
    default:
      return "#adb5bd";
  }
}
function getUnitLogo(unitName) {
  if (!unitName) return null;
  if (unitName.trim().toLowerCase() === "urbancode") {
    return (
      <img
        src="/uc_icon.png"
        alt="Urbancode"
        style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #eee", objectFit: "cover", background: "#fff" }}
      />
    );
  }
  if (unitName.trim().toLowerCase() === "jobzenter") {
    return (
      <img
        src="/jz_icon.png"
        alt="Jobzenter"
        style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #eee", objectFit: "cover", background: "#fff" }}
      />
    );
  }
  return null;
}
function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Format date like "10 Aug 2025, 20:00"
function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch (e) {
    return "—";
  }
}
function StatusCircleFilled({ color, title }) {
  return (
    <span
      style={{ display: "inline-block", marginRight: 2, cursor: "pointer" }}
      title={title}
      aria-label={title}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        style={{
          verticalAlign: "middle",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
        }}
      >
        <circle cx="11" cy="11" r="9" fill={color} stroke="none" />
      </svg>
    </span>
  );
}
function StatusCircleOutline({ color, title }) {
  return (
    <span
      style={{ display: "inline-block", marginLeft: 1, cursor: "pointer" }}
      title={title}
      aria-label={title}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        style={{
          verticalAlign: "middle",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
        }}
      >
        <circle
          cx="11"
          cy="11"
          r="9"
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
      </svg>
    </span>
  );
}

function LeadCard({ lead, onUnarchive }) {
  const formattedName = (lead.name || "").trim();
  const assigneeName = lead.assignee_name || "Unassigned";
  const archivedDate = lead.updated_at || lead.created_at; // Use updated_at as archived date if status is archived
  const createdDate = lead.created_at;
  const courseName = lead.course_name || "Course Not Found";
  const courseId = lead.course_id ? `CRS-${String(lead.course_id).padStart(3, '0')}` : '';
  const mobileNumber = lead.mobile_number ? `${lead.country_code || ''} ${lead.mobile_number}`.trim() : "—";
  const email = lead.email || "Not provided";

  return (
    <div
      className="relative bg-white rounded-lg border border-gray-200 shadow-sm group cursor-pointer"
      style={{
        padding: '12px',
        minHeight: '200px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateY(0) scale(1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '';
      }}
      data-lead-id={lead.lead_id}
    >
      {/* Archived Badge */}
      <div className="absolute top-2 right-2 transition-transform duration-300 group-hover:scale-110">
        <span className="bg-blue-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
          Archived
        </span>
      </div>

      {/* Lead Name */}
      <h3 className="text-sm font-bold text-slate-900 mb-1 pr-14 transition-colors duration-300 group-hover:text-purple-600">
        {formattedName}
      </h3>

      {/* Archived Date */}
      <p className="text-[10px] text-slate-500 mb-2">
        Archived on {formatDateDisplay(archivedDate)}
      </p>

      {/* Contact Info */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
          <FiPhone className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
          <span className="truncate">{mobileNumber}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
          <FiMail className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
          <span className="truncate">{email}</span>
        </div>
      </div>

      {/* Course Info */}
      <div className="flex items-center gap-1 text-[11px] text-slate-700 mb-1 transition-colors duration-300 group-hover:text-slate-900">
        <FiBookOpen className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
        <span className="truncate">
          {courseName} {courseId ? `(${courseId})` : ''}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1 text-[11px] text-slate-700 mb-2 transition-colors duration-300 group-hover:text-slate-900">
        <FiUsers className="w-3 h-3 text-slate-500 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-600" />
        <span className="truncate">{assigneeName}</span>
      </div>

      {/* Created Date */}
      <p className="text-[10px] text-slate-500 mb-2 mt-auto">
        Created {formatDateDisplay(createdDate)}
      </p>

      {/* Restore Button */}
      <button
        onClick={() => onUnarchive && onUnarchive(lead)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group-hover:shadow-lg"
      >
        <FiRotateCw className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
        Restore to Enquiry
      </button>
    </div>
  );
}

import archivedLeadService from '@shared/services/leads/archivedLeadService'
export default function ArchivedLeadsMain() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchArchivedLeads() {
      setLoading(true);
      setError(null);
      const res = await archivedLeadService.getArchivedLeads();
      if (res.success === false) {
        setError(res.error);
        setLeads([]);
      } else {
        setLeads(res);
      }
      setLoading(false);
    }
    fetchArchivedLeads();
  }, []);

  // Unarchive handler
  const handleUnarchive = async (lead) => {
    const result = await Swal.fire({
      title: 'Restore Lead?',
      text: `Are you sure you want to restore ${lead.name || 'this lead'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await archivedLeadService.unarchiveLead(lead.lead_id || lead.id);
      if (res && !res.success && res.error) {
        if (res.error.toLowerCase().includes('not found')) {
          Swal.fire({
            icon: 'warning',
            title: 'Lead Not Found',
            text: 'This lead no longer exists or was already restored.',
          });
          // Remove from UI anyway
          setLeads(leads => leads.filter(l => (l.lead_id || l.id) !== (lead.lead_id || lead.id)));
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Restore Failed',
            text: res.error || 'Failed to restore lead.',
          });
        }
        return;
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Lead Restored!',
        text: 'Lead has been restored successfully.',
        timer: 2000,
        showConfirmButton: false
      });
      
      setLeads(leads => leads.filter(l => (l.lead_id || l.id) !== (lead.lead_id || lead.id)));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to restore lead.',
      });
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await archivedLeadService.getArchivedLeads();
      if (res.success === false) {
        setError(res.error);
        setLeads([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.error || 'Failed to fetch archived leads.',
        });
      } else {
        setLeads(res);
      }
    } catch (err) {
      setError(err.message);
      setLeads([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to fetch archived leads.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) {
      return leads;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return leads.filter((lead) => {
      const name = (lead.name || "").toLowerCase();
      const mobile = (lead.mobile_number || "").toLowerCase();
      const course = (lead.course_name || "").toLowerCase();
      const batch = (lead.batch_name || "").toLowerCase();
      const leadId = String(lead.lead_id || lead.id || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      const assignee = (lead.assignee_name || "").toLowerCase();
      
      return (
        name.includes(query) ||
        mobile.includes(query) ||
        course.includes(query) ||
        batch.includes(query) ||
        leadId.includes(query) ||
        email.includes(query) ||
        assignee.includes(query)
      );
    });
  }, [leads, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header Section with Purple Gradient */}
        <div className="px-4 md:px-6">
          <div 
            className="rounded-2xl shadow-lg p-6 md:p-8 text-white mx-auto"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              maxWidth: '95%'
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Archived Leads</h1>
                <p className="text-purple-100 text-sm md:text-base mb-6">
                  Review leads you previously archived and move them back to the Enquiry pipeline whenever they're ready for a fresh follow-up.
                </p>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
                  <div>
                    <p className="text-purple-200 text-xs md:text-sm font-medium mb-1">TOTAL ARCHIVED</p>
                    <p className="text-2xl md:text-3xl font-bold">{leads.length}</p>
                  </div>
                  <div>
                    <p className="text-purple-200 text-xs md:text-sm font-medium mb-1">CURRENTLY SHOWING</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {loading ? '—' : searchQuery.trim() ? filteredLeads.length : leads.length}
                    </p>
                  </div>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 md:px-5 py-2 md:py-2.5 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to pipeline
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="w-full lg:w-72">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <FiSearch className="h-4 w-4 md:h-5 md:w-5 text-purple-300" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, mobile, course or"
                    className="block w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg md:rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm md:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-purple-200 hover:text-white"
                    >
                      <FiX className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  )}
                </div>
                <p className="text-purple-200 text-[10px] md:text-xs mt-1.5 md:mt-2 ml-1">/ Focus search instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-4"></div>
            <p className="text-slate-600">Loading archived leads...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-semibold">Error Loading Archived Leads</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leads Grid */}
        {!loading && !error && (
          <div>
            {leads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
                <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                  <FiArchive className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Archived Leads</h3>
                <p className="text-slate-500">There are no archived leads at the moment.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
                <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                  <FiSearch className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Found</h3>
                <p className="text-slate-500">
                  No archived leads match your search query "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="flex justify-center px-4">
                <div className="w-full max-w-[1400px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5" style={{ gridAutoRows: 'minmax(200px, auto)' }}>
                    {filteredLeads.map((lead, index) => (
                      <div
                        key={lead.lead_id || lead.id}
                        className="flex justify-center"
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        <div style={{ width: '100%', maxWidth: '280px' }}>
                          <LeadCard
                            lead={lead}
                            onUnarchive={handleUnarchive}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
