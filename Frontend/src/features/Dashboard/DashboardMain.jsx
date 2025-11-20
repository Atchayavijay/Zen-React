// Import React first before any React.memo usage
import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Navbar from "@app/layout/Navbar";
import { handleCardDrop } from "@features/leads/utils/leadBoardUtils";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

// Lazy load heavy modals - they're only needed when user clicks
const AddLeadModal = lazy(() => import("@features/leads/modals/AddLeadModal.jsx"));
const EditLeadModal = lazy(() => import("@features/leads/modals/EditLeadModal"));

// Lazy load sweetalert2 - only needed for notifications
const loadSwal = () => import('sweetalert2');

// Animation styles for spinner and fade-in
if (typeof window !== 'undefined' && window.document && !document.head.querySelector('style[data-dashboard-anim]')) {
  const style = document.createElement('style');
  style.setAttribute('data-dashboard-anim', 'true');
  style.innerHTML = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fadeIn { animation: fadeIn 0.3s ease; }
  `;
  document.head.appendChild(style);
}

// Lazy inject scrollbar styles so scrollbars stay hidden until hover
if (typeof window !== 'undefined' && window.document && !document.head.querySelector('style[data-dashboard-scrollbar]')) {
  const style = document.createElement('style');
  style.setAttribute('data-dashboard-scrollbar', 'true');
  style.innerHTML = `
    .custom-scrollbar {
      scrollbar-width: none;
    }
    .custom-scrollbar:hover {
      scrollbar-width: thin;
      scrollbar-color: #bdbdbd #f0f1f5;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 0;
      height: 0;
      background: transparent;
    }
    .custom-scrollbar:hover::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 999px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background: #bdbdbd;
    }
  `;
  document.head.appendChild(style);
}
// StatusCircleOutline: outlined circle SVG for status
const StatusCircleOutline = React.memo(function StatusCircleOutline({ color, title }) {
  return (
    <span
      className="ml-[2px]  pr-1  inline-flex cursor-pointer items-center"
      title={title}
      aria-label={title}
    >
      <svg
        className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        viewBox="0 0 22 22"
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
});

/* --------- MAKE STATUS ORDER STABLE (module-level constant) --------- */
const STATUS_ORDER = [
  { key: "enquiry", title: "Enquiry", color: "bg-[#f44336]" },
  { key: "prospect", title: "Prospect", color: "bg-[#ff9800]" },
  { key: "enrollment", title: "Enrollment", color: "bg-[#ffc107]" },
  {
    key: "trainingprogress",
    title: "Training Progress",
    color: "bg-[#00c853]",
  },
  { key: "handsonproject", title: "Hands-on Project", color: "bg-[#2879ff]" },
  { key: "certification", title: "Certification", color: "bg-[#e91e63]" },
  { key: "cvbuild", title: "CV Build", color: "bg-[#6a1b9a]" },
  { key: "mockinterviews", title: "Mock Interviews", color: "bg-[#00bcd4]" },
  { key: "liveinterviews", title: "Live Interviews", color: "bg-[#607d8b]" },
  { key: "placement", title: "Placement", color: "bg-[#43a047]" },
  { key: "placementdue", title: "Placement Due", color: "bg-[#795548]" },
  { key: "placementpaid", title: "Placement Paid", color: "bg-[#009688]" },
  { key: "finishers", title: "Finishers", color: "bg-[#8bc34a]" },
  { key: "onhold", title: "On Hold", color: "bg-[#757575]" },
];

/* ---------- small utils ---------- */
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
async function fetchAvatar(/* userId */) {
  return null;
}

/* ---------- tiny SVG chips ---------- */
const StatusCircleFilled = React.memo(function StatusCircleFilled({ color, title }) {
  return (
    <span
      className="mr-[1px]  inline-flex cursor-pointer items-center"
      title={title}
      aria-label={title}
    >
      <svg
        className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        viewBox="0 0 22 22"
      >
        <circle cx="11" cy="11" r="9" fill={color} stroke="none" />
      </svg>
    </span>
  );
});

/* ---------- lead card ---------- */
const LeadCard = React.memo(function LeadCard({ lead, onClick, isColumnHovered }) {
  // Memoize expensive calculations
  const timeDiff = useMemo(() => getTimeDifference(lead.created_at), [lead.created_at]);
  const paidStatusColor = useMemo(() => getStatusColor(lead.paid_status), [lead.paid_status]);
  const placementPaidStatus = useMemo(() => 
    (lead.placement_paid_status || "").trim().toLowerCase(),
    [lead.placement_paid_status]
  );
  const placementStatusColor = useMemo(() => getStatusColor(placementPaidStatus), [placementPaidStatus]);
  const cardType = useMemo(() => 
    (lead.card_type_name || "").toLowerCase().replace(/\s+/g, ""),
    [lead.card_type_name]
  );

  // Name formatting: single line, ellipsis
  const formattedName = useMemo(() => (lead.name || "").trim(), [lead.name]);

  const unitLogo = useMemo(() => getUnitLogo(lead.unit_name), [lead.unit_name]);
  const assigneeName = useMemo(() => lead.assignee_name || "No Assignee", [lead.assignee_name]);
  const initials = useMemo(() => getInitials(assigneeName), [assigneeName]);
  // Use assignee_profile_image if present (base64 string)
  const assigneeProfileImage = lead.assignee_profile_image;

  const timeSpanClass = useMemo(() =>
    timeDiff.isOverADay && (lead.status || "").toLowerCase() === "enquiry"
      ? "bg-red-500"
      : "bg-green-500",
    [timeDiff.isOverADay, lead.status]
  );

  const [isHovered, setIsHovered] = React.useState(false);

  const blackLineOpacity = useMemo(() => 
    (!isHovered && !isColumnHovered) ? 1 : 0,
    [isHovered, isColumnHovered]
  );

  // Memoize event handlers
  const handleClick = useCallback(() => {
    onClick && onClick(lead);
  }, [onClick, lead]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const accentOpacityClass = blackLineOpacity === 1 ? "opacity-100" : "opacity-0";

  return (
    <div
      className="lead-card relative mb-3 flex h-[140px] min-h-[140px] w-[220px] min-w-[220px] max-w-[220px] cursor-pointer select-none flex-row items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white pl-3 pr-1 pt-2 pb-2 shadow-sm transition hover:shadow-md"
      data-lead-id={lead.lead_id}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        {/* Status indicators */}
        <div className="absolute right-12 top-[13px] z-20 flex items-center gap-[3px]">
          {(cardType === "trainingonly" || cardType === "training&placement") &&
            !!String(lead.paid_status || "").trim() && (
              <StatusCircleFilled
                color={paidStatusColor}
                title={`Training Fee Status: ${lead.paid_status}`}
              />
            )}
          {(cardType === "placementonly" || cardType === "training&placement") &&
            !!String(lead.placement_paid_status || "").trim() && (
              <StatusCircleOutline
                color={placementStatusColor}
                title={`Placement Fee Status: ${lead.placement_paid_status}`}
              />
            )}
        </div>

        {/* Time pill */}
        <div className="absolute right-[10px] top-2 z-10 pr-2">
          <span
            className={`time inline-flex items-center rounded-sm px-2 py-[3px] text-[8px] leading-none text-white ${timeSpanClass}`}
          >
            {timeDiff.text}
          </span>
        </div>

        {/* Content */}
        <div className="mb-0.5 w-full pt-2 text-[0.8rem] font-medium leading-tight text-slate-900">
          {formattedName}
        </div>
        <p className="truncate text-[10px] font-medium text-slate-500">
          Mobile: {lead.country_code} {lead.mobile_number}
        </p>
        <p className="truncate text-[10px] font-medium text-slate-500">
          Course: {lead.course_name || "Course not found"}
        </p>
        <p className="truncate text-[10px] font-medium text-slate-500">
          Fee Paid: {lead.fee_paid ?? "null"} <span className="text-slate-500">| Fee Bal: {lead.fee_balance ?? "null"}</span>
        </p>
        <p className="truncate text-[10px] font-medium text-slate-500">
          Batch: {lead.batch_name || "Not Assigned"}
        </p>
        {/* Business Unit Logo below batch field */}
        {unitLogo && <div className="mt-0.5">{unitLogo}</div>}
      </div>
      <div
        className="assignee-profile ml-1 mr-3 mt-[95px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#444] text-xs font-semibold uppercase text-white shadow-[0_1px_4px_rgba(60,60,60,0.10)]"
        title={lead.assignee_name || "No Assignee"}
      >
        {assigneeProfileImage ? (
          <img
            src={`data:image/png;base64,${assigneeProfileImage}`}
            alt={initials}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.parentNode.innerHTML = initials;
              e.target.parentNode.style.backgroundColor = "#444";
            }}
          />
        ) : (
          initials
        )}
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-1 rounded-r-lg bg-[#111] transition-opacity ${accentOpacityClass}`}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if lead data or hover state actually changed
  return (
    prevProps.lead.lead_id === nextProps.lead.lead_id &&
    prevProps.lead.status === nextProps.lead.status &&
    prevProps.lead.name === nextProps.lead.name &&
    prevProps.lead.paid_status === nextProps.lead.paid_status &&
    prevProps.lead.placement_paid_status === nextProps.lead.placement_paid_status &&
    prevProps.lead.created_at === nextProps.lead.created_at &&
    prevProps.isColumnHovered === nextProps.isColumnHovered &&
    prevProps.onClick === nextProps.onClick
  );
});

/* ---------- status column header ---------- */
const LeadColumnHeader = React.memo(function LeadColumnHeader({ title, color, count }) {
  return (
    <div
      className={`mb-4 w-[220px] max-w-[220px] min-w-[220px] truncate rounded-[5px] px-2.5 py-2 text-center text-base font-semibold tracking-[0.02em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] ${color}`}
      title={title}
    >
      {title} ({count ?? 0})
    </div>
  );
});

/* ---------- page ---------- */
export default function Dashboard() {
  const [columns, setColumns] = useState([]); // [{key,title,color,leads:[]}
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState(null);
  const [courses, setCourses] = useState([]); // Define and initialize courses
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  // Undo/Redo stacks
  const [history, setHistory] = useState([]); // stack of previous columns
  const [redoStack, setRedoStack] = useState([]); // stack of redo columns
  const [columnHoverIndex, setColumnHoverIndex] = useState(null);

  /* ---------- fetch courses ---------- */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await apiClient.get(endpoints.courses.root, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        setCourses(res.data)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      }
    }

    fetchCourses()
  }, [])

  // Helper: apply selected filters to a leads array (client-side)
  function applyFiltersToArray(leads, filters = {}) {
    if (!filters || Object.keys(filters).length === 0) return leads;
    return leads.filter((lead) => {
      // courseTypes -> compare lead.course_type
      if (filters.courseTypes && filters.courseTypes.length > 0) {
        const ok = filters.courseTypes.some((ct) => String((lead.course_type || lead.courseType || '')).toLowerCase() === String(ct).toLowerCase());
        if (!ok) return false;
      }
      // courses -> compare lead.course_id
      if (filters.courses && filters.courses.length > 0) {
        const ok = filters.courses.some((c) => String(lead.course_id || lead.courseId || '').toLowerCase() === String(c).toLowerCase());
        if (!ok) return false;
      }
      // statuses -> compare lead.status (case-insensitive)
      if (filters.statuses && filters.statuses.length > 0) {
        const ok = filters.statuses.some((s) => String(lead.status || '').toLowerCase() === String(s).toLowerCase());
        if (!ok) return false;
      }
      // trainers -> compare lead.trainer_id
      if (filters.trainers && filters.trainers.length > 0) {
        const ok = filters.trainers.some((t) => String(lead.trainer_id || lead.trainerId || '').toLowerCase() === String(t).toLowerCase());
        if (!ok) return false;
      }
      // paidStatuses -> paid_status
      if (filters.paidStatuses && filters.paidStatuses.length > 0) {
        const ok = filters.paidStatuses.some((p) => String(lead.paid_status || '').toLowerCase() === String(p).toLowerCase());
        if (!ok) return false;
      }
      // batches -> batch_id
      if (filters.batches && filters.batches.length > 0) {
        const ok = filters.batches.some((b) => String(lead.batch_id || lead.batchId || '').toLowerCase() === String(b).toLowerCase());
        if (!ok) return false;
      }
      // sources -> source_id or source
      if (filters.sources && filters.sources.length > 0) {
        const ok = filters.sources.some((s) => String(lead.source_id || lead.sourceId || lead.source || '').toLowerCase() === String(s).toLowerCase());
        if (!ok) return false;
      }
      // assignees -> user_id
      if (filters.assignees && filters.assignees.length > 0) {
        const ok = filters.assignees.some((a) => String(lead.user_id || lead.userId || '').toLowerCase() === String(a).toLowerCase());
        if (!ok) return false;
      }
      // businessUnits -> unit_id
      if (filters.businessUnits && filters.businessUnits.length > 0) {
        const ok = filters.businessUnits.some((u) => String(lead.unit_id || lead.unitId || '').toLowerCase() === String(u).toLowerCase());
        if (!ok) return false;
      }
      // cardTypes -> card_type_id
      if (filters.cardTypes && filters.cardTypes.length > 0) {
        const ok = filters.cardTypes.some((c) => String(lead.card_type_id || lead.cardTypeId || '').toLowerCase() === String(c).toLowerCase());
        if (!ok) return false;
      }

      // Time periods (basic support)
      if (filters.timePeriods && filters.timePeriods.length > 0) {
        // If 'All Time' present, skip
        if (!filters.timePeriods.includes('All Time')) {
          const created = lead.created_at ? new Date(lead.created_at) : null;
          if (created) {
            const now = new Date();
            const matchesTime = filters.timePeriods.some((tp) => {
              switch (tp) {
                case 'Today':
                  return created.toDateString() === now.toDateString();
                case 'This Week':
                  return (now - created) <= 7 * 24 * 60 * 60 * 1000;
                case 'This Month':
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                case 'This Year':
                  return created.getFullYear() === now.getFullYear();
                default:
                  return false;
              }
            });
            if (!matchesTime) return false;
          }
        }
      }

      return true;
    });
  }

  const buildEmptyColumns = () =>
    STATUS_ORDER.map((col) => ({ ...col, leads: [] }));

  // Helper to convert frontend filter format to backend query params
  const buildQueryParams = (filters = {}) => {
    const params = new URLSearchParams();

    const firstValue = (arr) =>
      Array.isArray(arr) && arr.length > 0 ? arr[0] : null;

    const courseType = firstValue(filters.courseTypes);
    if (courseType) {
      params.append("courseType", courseType);
    }

    const course = firstValue(filters.courses);
    if (course) {
      params.append("course", course);
    }

    const status = firstValue(filters.statuses);
    if (status) {
      params.append("status", status.toLowerCase());
    }

    const trainer = firstValue(filters.trainers);
    if (trainer) {
      params.append("trainer", trainer);
    }

    const batch = firstValue(filters.batches);
    if (batch) {
      params.append("batch", batch);
    }

    const feeStatus = firstValue(filters.paidStatuses);
    if (feeStatus) {
      params.append("feeStatus", feeStatus.toLowerCase());
    }

    const source = firstValue(filters.sources);
    if (source) {
      params.append("source", source);
    }

    const assignee = firstValue(filters.assignees);
    if (assignee) {
      params.append("user_id", assignee);
    }

    const unit = firstValue(filters.businessUnits);
    if (unit) {
      params.append("unit", unit);
    }

    const cardType = firstValue(filters.cardTypes);
    if (cardType) {
      params.append("cardType", cardType);
    }

    const timePeriod =
      Array.isArray(filters.timePeriods) && filters.timePeriods.length > 0
        ? filters.timePeriods.find((tp) => tp !== "All Time") ||
          filters.timePeriods[0]
        : null;
    if (timePeriod && timePeriod !== "All Time") {
      params.append("timePeriod", timePeriod);
    }

    return params.toString();
  };

  const loadBoard = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const queryString = buildQueryParams(filters)
      const url = queryString ? `${endpoints.leads.root}?${queryString}` : endpoints.leads.root

      const res = await apiClient.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const leads = res.data
      const allLeads = Array.isArray(leads) ? leads : []

      const statusMap = {}
      for (const lead of allLeads) {
        const status = (lead.status || '').toLowerCase()
        if (!statusMap[status]) statusMap[status] = []
        statusMap[status].push(lead)
      }

      const colArr = STATUS_ORDER.map((col) => ({
        key: col.key,
        title: col.title,
        color: col.color,
        leads: statusMap[col.key] || [],
      }))

      setColumns(colArr)
    } catch (e) {
      console.error('Failed to load board:', e)
      setColumns(buildEmptyColumns())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load without filters on mount
    loadBoard();
  }, [loadBoard]);

  // Listen for global filter events dispatched by FilterDropdown (from Navbar)
  useEffect(() => {
    function onGlobalFilters(e) {
      try {
        const filters = e?.detail || {};
        setAppliedFilters(filters || {});
        loadBoard(filters || {});
      } catch (err) {
        console.error('Failed to apply global filters', err);
      }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('zen:filtersApplied', onGlobalFilters);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('zen:filtersApplied', onGlobalFilters);
      }
    };
  }, [loadBoard]);

  // Handler when user applies filters from the modal
  const handleApplyFilters = useCallback(async (filters) => {
    setAppliedFilters(filters || {});
    setFilterOpen(false);
    await loadBoard(filters || {});
  }, [loadBoard]);

  const handleCardClick = useCallback((lead) => {
    setSelectedLead(lead);
    setEditOpen(true);
  }, []);

  const onDragEnd = useCallback(async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setColumns((prevColumns) => {
      const sourceColIdx = prevColumns.findIndex((c) => c.key === source.droppableId);
      const destColIdx = prevColumns.findIndex(
        (c) => c.key === destination.droppableId
      );
      if (sourceColIdx === -1 || destColIdx === -1) return prevColumns;

      const movedLead = prevColumns[sourceColIdx].leads[source.index];
      if (!movedLead) return prevColumns;

      // optimistic update
      const nextColumns = prevColumns.map((col) => ({
        ...col,
        leads: [...col.leads],
      }));
      nextColumns[sourceColIdx].leads.splice(source.index, 1);
      nextColumns[destColIdx].leads.splice(destination.index, 0, {
        ...movedLead,
        status: nextColumns[destColIdx].key,
      });
      
      // Save to history for undo
      setHistory((h) => [...h, prevColumns]);
      setRedoStack([]); // clear redo stack on new move

      // Show notification asynchronously (lazy load Swal)
      loadSwal().then(({ default: Swal }) => {
        Swal.fire({
          icon: 'success',
          title: 'Lead moved',
          text: `Moved to ${nextColumns[destColIdx].title}.`,
          timer: 1000,
          showConfirmButton: false,
          position: 'center',
          toast: false,
        });
      });

      // Update server asynchronously
      handleCardDrop(movedLead.lead_id, nextColumns[destColIdx].key).catch((err) => {
        console.error("Failed to update status on server, rolling back:", err);
        setColumns(prevColumns);
      });

      return nextColumns;
    });
  }, []);

  // Undo/Redo handlers
  const handleUndo = () => {
    if (history.length === 0) return false;
    setHistory((h) => {
      if (h.length === 0) return h;
      setRedoStack((r) => [columns, ...r]);
      const prev = h[h.length - 1];
      setColumns(prev);
      return h.slice(0, -1);
    });
    return true;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return false;
    setRedoStack((r) => {
      if (r.length === 0) return r;
      setHistory((h) => [...h, columns]);
      const next = r[0];
      setColumns(next);
      return r.slice(1);
    });
    return true;
  };



  return (
  <div className="w-full min-h-screen h-screen flex flex-col" style={{ minHeight: '100vh', height: '100vh', marginLeft: 0, paddingLeft: 0, background: '#ffffffff', overflow: 'hidden' }}>
      {/* Navbar is now only provided by Layout. Undo/redo handlers can be passed via context or props if needed. */}
           {/* Navbar with undo/redo handlers */}
      {/* <Navbar
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        undoDisabled={history.length === 0}
        redoDisabled={redoStack.length === 0}
      /> */}

      {/* board with Add Lead button */}
      <div
        className="flex-1 flex flex-col pb-2"
        style={{
          background: '#f3f4f6',
          minHeight: 0,
          borderRadius: 12,
          boxShadow: '0 2px 8px 0 rgba(60,60,60,0.04)',
          width: '100%',
          overflowX: 'visible',
        }}
      >
        <div className="flex items-center justify-between mb-4 pt-4 px-4">
          <button
            onClick={() => setAddOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded shadow-md transition-all duration-150"
            style={{ fontSize: 16, letterSpacing: 0.2 }}
          >
            + Add Lead
          </button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            className="flex gap-6 flex-1 h-full px-2"
            style={{ height: '100%', width: '100%', minWidth: 0 }}
          >
            {columns.map((col, colIdx) => {
              const isColumnHovered = columnHoverIndex === colIdx;
              
              return (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-w-[220px] w-[220px] max-w-[220px] flex flex-col h-full"
                      style={{ minHeight: 0, height: '100%', flex: '0 0 220px' }}
                      onMouseEnter={() => setColumnHoverIndex(colIdx)}
                      onMouseLeave={() => setColumnHoverIndex(null)}
                    >
                      <LeadColumnHeader
                        title={col.title}
                        color={col.color}
                        count={col.leads?.length}
                      />
                      <div
                        className="flex-1 overflow-y-auto custom-scrollbar"
                        style={{
                          minHeight: 0,
                          height: '100%',
                          padding: '4px 2px 4px 2px',
                          overflowX: 'hidden',
                          overflowY: 'auto',
                          width: 220,
                          maxWidth: 220,
                          minWidth: 220,
                          // Removed position: 'relative' and persistent black line
                        }}
                      >
                        {col.leads.map((lead, idx) => {
                          // Use lead_id as key for better React reconciliation
                          return (
                            <Draggable
                              key={lead.lead_id}
                              draggableId={String(lead.lead_id)}
                              index={idx}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <LeadCard
                                    lead={lead}
                                    onClick={handleCardClick}
                                    isColumnHovered={isColumnHovered}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* {loading && (
        <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center z-30" style={{pointerEvents:'none'}}>
          <div className="flex flex-col items-center gap-4 bg-white/90 text-gray-800 px-8 py-8 rounded-xl shadow-2xl animate-fadeIn border border-gray-200" style={{minWidth: 220}}>
            <svg className="animate-spin" style={{width:48,height:48,marginBottom:8}} viewBox="0 0 50 50">
              <circle className="opacity-25" cx="25" cy="25" r="22" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle className="opacity-90" cx="25" cy="25" r="22" fill="none" stroke="#f87171" strokeWidth="6" strokeDasharray="34.6 103.6" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold tracking-wide">Loading dashboard…</span>
          </div>
        </div>
      )} */}

      {/* Lead Registration modal - lazy loaded */}
      {addOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>}>
          <AddLeadModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onSaved={async () => {
              await loadBoard();
              setAddOpen(false);
            }}
            courses={courses}
          />
        </Suspense>
      )}

      {/* Edit Lead modal - lazy loaded */}
      {editOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>}>
          <EditLeadModal
            open={editOpen}
            lead={selectedLead}
            onClose={() => setEditOpen(false)}
            onUpdated={async (archived) => {
              if (archived && selectedLead) {
                // Remove the archived lead from the board immediately
                setColumns((prevCols) =>
                  prevCols.map((col) => ({
                    ...col,
                    leads: col.leads.filter((l) => l.lead_id !== selectedLead.lead_id)
                  }))
                );
                setEditOpen(false);
              } else {
                await loadBoard();
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
