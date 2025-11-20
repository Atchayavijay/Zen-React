import { createElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import apiClient from '@shared/api/client'
import courseService from '@shared/services/courses/courseService'
import lookupService from '@shared/services/lookups/lookupService'
import commentService from '@shared/services/leads/commentService'
import dropdownCache from '@shared/services/leads/dropdownCache'
import leadService from '@shared/services/leads/leadService'
import {
  sectionIcons,
  stripIcons,
  FaEllipsisVIcon,
  FaTimesIcon,
} from './EditLeadModalIcons'
import { MdCheck, MdDelete, MdEdit } from 'react-icons/md'
import { FaRegSmile, FaRegThumbsUp } from 'react-icons/fa'

const BASE_SECTIONS = [
  { key: "personal", label: "Personal Information", icon: "personal" },
  { key: "course", label: "Course Details", icon: "course" },
  { key: "trainer", label: "Trainer & Payments", icon: "trainer" },
  { key: "financial", label: "Student Finance", icon: "financial" },
  { key: "assignee", label: "Assignee Info", icon: "assignee" },
  { key: "classification", label: "Classification", icon: "classification" },
  { key: "status", label: "Status & Timeline", icon: "status" },
];

const buildSections = (enableSubCourses = false) => {
  if (!enableSubCourses) return BASE_SECTIONS;
  const list = [...BASE_SECTIONS];
  list.splice(2, 0, {
    key: "subCourses",
    label: "Sub-Courses",
    icon: "subCourses",
  });
  return list;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  return Number.isNaN(num) ? value : `₹${num.toLocaleString("en-IN")}`;
};

const formatDateDisplay = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const formatDateTimeDisplay = (value) =>
  value ? new Date(value).toLocaleString() : "N/A";

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  return Number.isNaN(num) ? value : `${num}%`;
};

function EditLeadModal(props) {
  const { open, onClose, lead = {}, comments = [], onUpdated } = props;

  const [dropdowns, setDropdowns] = useState({
    courses: [],
    courseTypes: [],
    units: [],
    cardTypes: [],
    trainers: [],
    batches: [],
    assignees: [],
    users: [],
    sources: [],
    roles: [],
    statusOptions: [],
  });
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [leadData, setLeadData] = useState(lead);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [commentTab, setCommentTab] = useState("all");

  // comments state (UI ONLY CHANGES LIVE BELOW)
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);
  const editRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editSaved, setEditSaved] = useState(false);

  // NEW: sidebar state (restore old behavior)
  const [activeSection, setActiveSection] = useState(BASE_SECTIONS[0].key);
  const [copiedEnrollmentId, setCopiedEnrollmentId] = useState(false);
  const enableSubCoursesSection = leadData?.course_structure === "multiple";
  const sections = useMemo(
    () => buildSections(enableSubCoursesSection),
    [enableSubCoursesSection]
  );
  const subCourses = useMemo(
    () => (Array.isArray(leadData?.sub_courses) ? leadData.sub_courses : []),
    [leadData?.sub_courses]
  );
  const hasSubCourseEntries = subCourses.length > 0;
  const activeSectionMeta = useMemo(
    () => sections.find((section) => section.key === activeSection),
    [sections, activeSection]
  );

  useEffect(() => setLeadData(lead), [lead]);

  useEffect(() => {
    if (!sections.some((section) => section.key === activeSection)) {
      setActiveSection(sections[0]?.key || BASE_SECTIONS[0].key);
    }
  }, [sections, activeSection]);

  useEffect(() => {
    setCopiedEnrollmentId(false);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, [leadData?.enrollment_id]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);


  // ---------- helpers ----------
  const arrOr = (res) =>
    (Array.isArray(res?.data) && res.data) || (Array.isArray(res) && res) || [];

  function normOption(x, idKeys = ["id"], nameKeys = ["name"]) {
    if (typeof x !== "object" || x == null) return { id: x, name: String(x) };
    return {
      id:
        idKeys.map((k) => x[k]).find((v) => v !== undefined && v !== null) ??
        x.id ??
        x.value ??
        x.key,
      name:
        nameKeys.map((k) => x[k]).find((v) => v !== undefined && v !== null) ??
        x.name ??
        x.label ??
        x.title ??
        String(x.id ?? ""),
      _raw: x,
    };
  }

  function normalizeLead(inLead, dd) {
    const out = { ...inLead };

    // COURSE name -> id
    if (
      (out.course_id == null || out.course_id === "") &&
      dd?.courses?.length
    ) {
      const courseName =
        out.course_name || out.course || out.course_label || null;
      if (courseName) {
        const hit = dd.courses.find(
          (o) =>
            String(o.name).toLowerCase() === String(courseName).toLowerCase()
        );
        if (hit) out.course_id = hit.id;
      }
    }

    // COURSE TYPE name -> id
    if (
      (out.course_type_id == null || out.course_type_id === "") &&
      dd?.courseTypes?.length
    ) {
      const ctName =
        out.course_type_name || out.course_type || out.course_type_label;
      if (ctName) {
        const hit = dd.courseTypes.find(
          (o) => String(o.name).toLowerCase() === String(ctName).toLowerCase()
        );
        if (hit) out.course_type_id = hit.id;
      }
    }

    // USER/ASSIGNEE validation
    const users = Array.isArray(dd?.users) ? dd.users : [];
    const validUserIds = new Set(users.map((u) => String(u.id)));
    const trySetUserId = (val) => {
      if (val == null || val === "") return;
      if (validUserIds.has(String(val))) out.user_id = val;
    };
    trySetUserId(out.user_id);
    trySetUserId(out.assignee_id);
    trySetUserId(out.assigned_to_id);
    trySetUserId(out.owner_id);
    trySetUserId(out.owner);
    if (out.user_id != null && !validUserIds.has(String(out.user_id))) {
      out.user_id = null;
    }

    return out;
  }

  const getCommentId = useCallback((comment, fallback = null) => {
    if (!comment || typeof comment !== "object") return fallback;
    return (
      comment.comment_id ??
      comment.id ??
      comment._id ??
      comment.commentId ??
      fallback
    );
  }, []);

  const focusCommentEditor = useCallback(() => {
    if (!editorRef.current || typeof window === "undefined") return;
    editorRef.current.focus();
    const selection = window.getSelection?.();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  function buildDropdownState(responses = {}) {
    const processList = (key, mapper) => {
      const res = responses[key];
      const raw =
        res?.success && Array.isArray(res.data) ? res.data : arrOr(res);
      return Array.isArray(raw) ? raw.map(mapper) : [];
    };

    const arrayOrEmpty = (value) => {
      if (Array.isArray(value)) return value;
      if (value?.success && Array.isArray(value.data)) return value.data;
      if (Array.isArray(value?.data)) return value.data;
      return [];
    };

    return {
      courses: processList(
        "courses",
        (c) =>
          normOption(
            c,
            ["id", "course_id", "value", "key"],
            ["name", "course_name", "label", "title"]
          )
      ),
      courseTypes: processList("courseTypes", (ct) =>
        typeof ct === "object"
          ? normOption(ct)
          : { id: ct, name: String(ct) }
      ),
      units: processList(
        "units",
        (u) => normOption(u, ["unit_id", "id"], ["unit_name", "name"])
      ),
      cardTypes: processList(
        "cardTypes",
        (c) => normOption(c, ["card_type_id", "id"], ["card_type_name", "name"])
      ),
      trainers: processList(
        "trainers",
        (t) =>
          normOption(t, ["id", "trainer_id"], [
            "name",
            "trainer_name",
            "full_name",
            "user_name",
          ])
      ),
      batches: processList(
        "batches",
        (b) => normOption(b, ["id", "batch_id"], ["name", "batch_name"])
      ),
      assignees: processList(
        "assignees",
        (a) =>
          normOption(
            a,
            ["assignee_id", "id", "user_id"],
            ["assignee_name", "name", "full_name", "user_name"]
          )
      ),
      users: processList(
        "users",
        (u) =>
          normOption(u, ["user_id", "id"], ["name", "username", "email"])
      ),
      sources: processList(
        "sources",
        (s) =>
          normOption(
            s,
            ["id"],
            ["name", "source_name", "full_name"]
          )
      ),
      roles: processList(
        "roles",
        (r) => normOption(r, ["id"], ["name"])
      ),
      statusOptions: arrayOrEmpty(responses.statusOptions),
    };
  }

  // ---------- dropdowns fetch (with caching and async loading) ----------
  useEffect(() => {
    if (!open) return;

    async function fetchDropdowns() {
      // Show modal immediately, load dropdowns in background
      setLoadingDropdowns(true);
      
      // Check cache first
      const cacheKeys = ['courses', 'courseTypes', 'units', 'cardTypes', 'trainers', 'batches', 'assignees', 'users', 'sources', 'roles'];
      const { cached, missing } = dropdownCache.getMultiple(cacheKeys);
      
      // If we have cached data, use it immediately
      if (Object.keys(cached).length > 0) {
        const initialDropdowns = buildDropdownState(cached);
        setDropdowns(initialDropdowns);
        setLeadData((ld) => normalizeLead(ld ?? lead ?? {}, initialDropdowns));
        setLoadingDropdowns(false); // Show UI immediately
      }

      // Fetch only missing items
      const fetchPromises = [];
      const fetchKeys = [];
      
      if (!cached.courses || missing.includes('courses')) {
        fetchKeys.push('courses');
        fetchPromises.push(courseService.getCourses?.().then(res => ({ key: 'courses', data: res })));
      }
      if (!cached.courseTypes || missing.includes('courseTypes')) {
        fetchKeys.push('courseTypes');
        fetchPromises.push(courseService.getCourseTypes?.().then(res => ({ key: 'courseTypes', data: res })));
      }
      if (!cached.units || missing.includes('units')) {
        fetchKeys.push('units');
        fetchPromises.push(lookupService.getUnits().then(res => ({ key: 'units', data: res })));
      }
      if (!cached.cardTypes || missing.includes('cardTypes')) {
        fetchKeys.push('cardTypes');
        fetchPromises.push(lookupService.getCardTypes().then(res => ({ key: 'cardTypes', data: res })));
      }
      if (!cached.trainers || missing.includes('trainers')) {
        fetchKeys.push('trainers');
        fetchPromises.push(lookupService.getTrainers().then(res => ({ key: 'trainers', data: res })));
      }
      if (!cached.batches || missing.includes('batches')) {
        fetchKeys.push('batches');
        fetchPromises.push(lookupService.getBatches().then(res => ({ key: 'batches', data: res })));
      }
      if (!cached.assignees || missing.includes('assignees')) {
        fetchKeys.push('assignees');
        fetchPromises.push(lookupService.getAssignees().then(res => ({ key: 'assignees', data: res })));
      }
      if (!cached.users || missing.includes('users')) {
        fetchKeys.push('users');
        fetchPromises.push(lookupService.getUsers().then(res => ({ key: 'users', data: res })));
      }
      if (!cached.sources || missing.includes('sources')) {
        fetchKeys.push('sources');
        fetchPromises.push(lookupService.getSources().then(res => ({ key: 'sources', data: res })));
      }
      if (!cached.roles || missing.includes('roles')) {
        fetchKeys.push('roles');
        fetchPromises.push(lookupService.getRoles?.().then(res => ({ key: 'roles', data: res })));
      }

      // If nothing to fetch, we're done
      if (fetchPromises.length === 0) {
        return;
      }

      try {
        // Fetch only missing items in parallel
        const results = await Promise.all(fetchPromises);
        
        const combinedResponses = { ...cached };
        results.forEach(({ key, data }) => {
          if (data) {
            combinedResponses[key] = data;
            dropdownCache.set(key, data);
          }
        });

        const nextDropdowns = buildDropdownState(combinedResponses);
        setDropdowns(nextDropdowns);
        setLeadData((ld) => normalizeLead(ld ?? lead ?? {}, nextDropdowns));
      } catch {
        setDropdowns({
          courses: [],
          courseTypes: [],
          units: [],
          cardTypes: [],
          trainers: [],
          batches: [],
          assignees: [],
          users: [],
          sources: [],
          roles: [],
          statusOptions: [],
        });
      } finally {
        setLoadingDropdowns(false);
      }
    }

    fetchDropdowns();
  }, [open]);

  // re-normalize when dependencies change
  useEffect(() => {
    if (!open) return;
    setLeadData(normalizeLead(lead ?? {}, dropdowns));
  }, [
    open,
    lead,
    dropdowns.courses,
    dropdowns.courseTypes,
    dropdowns.assignees,
    dropdowns.users,
  ]);

  // ---------- inline edit ----------
  const handleFieldDoubleClick = (field) => {
    setEditField(field);
    setEditValue(leadData[field] ?? "");
  };
  const handleEditChange = (e) => setEditValue(e.target.value);

  const handleEditBlur = async () => {
    if (!editField) return;

    const selectFields = [
      "course_type_id",
      "course_id",
      "batch_id",
      "trainer_id",
      "user_id",
      "unit_id",
      "card_type_id",
      "assignee_id",
      "source_id",
      "role_id",
    ];
    let value = editValue;
    if (selectFields.includes(editField) && value !== "") {
      const num = Number(value);
      value = isNaN(num) ? value : num;
    }

    const requiredFields = [
      "name",
      "mobile_number",
      "status",
      "course_id",
      "unit_id",
      "card_type_id",
    ];
    const updatedLead = { ...leadData, [editField]: value };
    const missingFields = requiredFields.filter(
      (field) => !updatedLead[field] || updatedLead[field] === ""
    );
    if (missingFields.length) {
      alert(`Cannot update lead. Missing: ${missingFields.join(", ")}`);
      setEditField(null);
      return;
    }

    // guard invalid user_id
    const validUserIds = new Set(
      (dropdowns.users || []).map((u) => String(u.id))
    );
    if (
      updatedLead.user_id !== null &&
      updatedLead.user_id !== undefined &&
      updatedLead.user_id !== "" &&
      !validUserIds.has(String(updatedLead.user_id))
    ) {
      updatedLead.user_id = null;
    }

    setEditSaved(true);
    setTimeout(() => {
      setEditSaved(false);
      setEditField(null);
    }, 400);

    try {
      const token = localStorage.getItem("token");
      const leadId = leadData.lead_id || leadData.id;
      if (!leadId) {
        alert("Cannot update: Lead ID is missing or invalid.");
        return;
      }
      // Validate user_id (assignee)
      const users = Array.isArray(dropdowns?.users) ? dropdowns.users : [];
      const validUserIds = new Set(users.map((u) => String(u.id)));
      let payload = { ...updatedLead };
      // Only send user_id if valid
      if (
        payload.user_id !== undefined &&
        payload.user_id !== null &&
        payload.user_id !== "" &&
        !validUserIds.has(String(payload.user_id))
      ) {
        alert("Please select a valid assignee/user.");
        return;
      }
      // Remove assignee_id, assigned_to_id, owner_id, owner if present
      delete payload.assignee_id;
      delete payload.assigned_to_id;
      delete payload.owner_id;
      delete payload.owner;
      // Log payload for debugging
      console.log("Sending lead update payload:", payload);
      const response = await apiClient.put(`/leads/${leadId}`, payload)
      const fresh = response?.data && typeof response.data === 'object' ? response.data : payload
      setLeadData(normalizeLead(fresh, dropdowns))
      onUpdated && onUpdated()
      return
    } catch (err) {
      alert('Failed to update lead: ' + (err?.message || err))
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditBlur();
    }
  };

  // ---------- comments API helpers (UI ONLY CHANGE) ----------
  const leadId = leadData?.lead_id || leadData?.id;

  async function fetchComments() {
    if (!leadId) return;
    setLoadingComments(true);
    const res = await commentService.getComments(leadId);
    setLoadingComments(false);
    if (res && res.success && Array.isArray(res.comments)) {
      setCommentsList(res.comments);
    } else {
      setCommentsList([]);
    }
  }

  useEffect(() => {
    if (open && leadId) fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  function exec(cmd) {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  }

  function getEditorHtml(ref) {
    return (ref.current?.innerHTML || "").trim();
  }

  async function handleAddComment() {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText.trim();
    if (!text) return;
    if (!leadId) {
      alert("Cannot add comment: Lead ID is missing.");
      return;
    }
    setSavingComment(true);
    const res = await commentService.addComment(leadId, text);
    setSavingComment(false);
    if (res.success && res.comment) {
      editorRef.current.innerText = "";
      setCommentsList((prev) => [res.comment, ...(prev || [])]);
      await fetchComments(); // Always re-fetch to sync UI
      setCommentTab("all");
    } else {
      alert(res.error || "Failed to add comment");
    }
  }

  async function handleDeleteComment(id) {
    const previous = [...commentsList];
    setCommentsList((prev) =>
      prev.filter((c, idx) => getCommentId(c, idx) !== id)
    );
    try {
      const res = await commentService.deleteComment(id);
      if (!res?.success) {
        throw new Error(res?.error || "Failed to delete comment");
      }
      await fetchComments();
    } catch (error) {
      setCommentsList(previous);
      alert(error?.message || "Failed to delete comment");
    }
  }

  async function handleSaveEdit(id) {
    const html = getEditorHtml(editRef);
    setEditingId(null);
    await commentService.editComment(id, html);
    await fetchComments(); // Re-fetch to show updated comment immediately
  }

  const handleCopyEnrollmentId = useCallback(async () => {
    const enrollmentId = leadData?.enrollment_id;
    if (!enrollmentId) return;
    if (typeof navigator === "undefined" || !navigator?.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(String(enrollmentId));
      setCopiedEnrollmentId(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedEnrollmentId(false);
        copyTimeoutRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("Failed to copy enrollment ID", error);
    }
  }, [leadData?.enrollment_id]);

  // ---------- renderer ----------
  function renderField(field, label, type = "text", options = []) {
    if (editField === field) {
      const isSelect = type === "select";
      let selectProps = {};
      let inputProps = {};
      let optionsList = options;
      let effectiveValue = editValue;
      if (isSelect) {
        const base = field.endsWith("_id") ? field.slice(0, -3) : field;
        const aliasName =
          leadData[`${base}_name`] ||
          leadData[base] ||
          leadData[`${base}_label`] ||
          (field === "user_id"
            ? leadData.assignee_name ||
              leadData.assignee ||
              leadData.assigned_to
            : null);
        const aliasHit = options.find(
          (o) =>
            String(o.name || o.label).toLowerCase() ===
            String(aliasName || "").toLowerCase()
        );
        const currentId =
          leadData[field] != null && leadData[field] !== ""
            ? String(leadData[field])
            : "";
        effectiveValue =
          editValue !== ""
            ? String(editValue)
            : currentId !== ""
            ? currentId
            : aliasHit?.id ?? "";
        selectProps = {
          autoFocus: true,
          value: effectiveValue,
          onChange: handleEditChange,
          onBlur: handleEditBlur,
          onKeyDown: handleEditKeyDown,
          className: "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        };
      } else {
        inputProps = {
          autoFocus: true,
          type: "text",
          value: editValue,
          onChange: handleEditChange,
          onBlur: handleEditBlur,
          onKeyDown: handleEditKeyDown,
          className: "w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
        };
      }
      return (
        <span className="inline-flex items-center gap-1">
          {isSelect ? (
            <select {...selectProps}>
              <option value="">Select {label}</option>
              {optionsList.map((opt, idx) => (
                <option
                  key={opt.id || opt.value || idx}
                  value={opt.id || opt.value}
                >
                  {opt.name || opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input {...inputProps} />
          )}
          <button
            type="button"
            aria-label="Save"
            onClick={handleEditBlur}
            className="ml-1 p-1 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs border border-green-600 flex items-center justify-center"
            style={{ lineHeight: 1, minWidth: 22, minHeight: 22 }}
            disabled={loadingDropdowns}
          >
            {loadingDropdowns ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <span className="flex items-center justify-center">
                <MdCheck className="text-white text-base" style={{ display: 'block' }} />
              </span>
            )}
          </button>
        </span>
      );
    }

    if (type === "select" && Array.isArray(options) && options.length > 0) {
      let selected =
        options.find(
          (opt) =>
            String(opt.id) === String(leadData[field]) ||
            Number(opt.id) === Number(leadData[field])
        ) || null;

      if (!selected) {
        const base = field.endsWith("_id") ? field.slice(0, -3) : field;
        const aliasName =
          leadData[`${base}_name`] ||
          leadData[base] ||
          leadData[`${base}_label`] ||
          (field === "user_id"
            ? leadData.assignee_name ||
              leadData.assignee ||
              leadData.assigned_to
            : null);

        if (aliasName) {
          selected = options.find(
            (opt) =>
              String(opt.name || opt.label).toLowerCase() ===
              String(aliasName).toLowerCase()
          );
        }
      }

      return (
        <span
          onDoubleClick={() => handleFieldDoubleClick(field)}
          className="cursor-pointer hover:bg-yellow-50 px-1 rounded"
        >
          {selected ? (
            selected.name || selected.label
          ) : leadData[field] && leadData[field] !== "" ? (
            String(leadData[field])
          ) : (
            <span className="text-gray-400">(empty)</span>
          )}
        </span>
      );
    }

    return (
      <span
        onDoubleClick={() => handleFieldDoubleClick(field)}
        className="cursor-pointer hover:bg-yellow-50 px-1 rounded"
      >
        {leadData[field] || <span className="text-gray-400">(empty)</span>}
      </span>
    );
  }

  const filteredCourses = useMemo(
    () => dropdowns.courses || [],
    [dropdowns.courses]
  );

  // Memoize the modal to prevent unnecessary re-renders
  if (!open) return null;

  return (
    <DndContext>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2">
        <div
          className="relative w-[75vw] max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 text-sm flex flex-col"
          style={{ boxSizing: 'border-box', margin: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-7 py-4 sticky top-0 bg-white z-10 rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-800">Edit Lead</h2>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Actions"
                  onClick={() => setOptionsOpen((v) => !v)}
                  className="h-9 w-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
                >
                  <FaEllipsisVIcon className="text-lg" />
                </button>
                {optionsOpen && (
                  <div className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-md border bg-white shadow-xl">
                    <MenuBtn
                      label="Delete"
                      onClick={async () => {
                        setOptionsOpen(false);
                        if (!window.confirm("Are you sure you want to delete this lead?")) {
                          return;
                        }

                        const leadId = leadData?.lead_id || leadData?.id;
                        if (!leadId) {
                          alert("Cannot delete lead: missing lead ID.");
                          return;
                        }

                        try {
                          const result = await leadService.deleteLead(leadId, "Deleted from UI");
                          if (result.success) {
                            onClose?.();
                            onUpdated?.();
                          } else {
                            alert("Failed to delete lead: " + (result.error || "Unknown error"));
                          }
                        } catch (err) {
                          alert("Error deleting lead: " + (err?.message || err));
                        }
                      }}
                    />
                    <MenuBtn
                      label="Archive"
                      onClick={async () => {
                        setOptionsOpen(false);
                        const leadId = leadData.lead_id || leadData.id;
                        if (!leadId) {
                          alert("Cannot archive: Lead ID is missing.");
                          return;
                        }
                        try {
                          const res = await apiClient.put(`/leads/archive/${leadId}`, {});
                          if (res.status === 200 || res.data) {
                            onUpdated && onUpdated(true); // Pass true to indicate archived
                            alert("Lead archived successfully.");
                            onClose && onClose();
                          } else {
                            const errMsg = res.data?.error || "Unknown error";
                            alert("Failed to archive lead: " + errMsg);
                          }
                        } catch (err) {
                          const errorMsg = err?.response?.data?.error || err?.message || "Failed to archive lead";
                          alert("Error archiving lead: " + errorMsg);
                        }
                      }}
                    />
                    <MenuBtn
                      label="On Hold"
                      onClick={async () => {
                        setOptionsOpen(false);
                        const leadId = leadData.lead_id || leadData.id;
                        if (!leadId) {
                          alert("Cannot set On Hold: Lead ID is missing.");
                          return;
                        }
                        try {
                          const res = await apiClient.put(`/leads/onhold/${leadId}`, {});
                          if (res.status === 200 || res.data) {
                            onUpdated && onUpdated();
                            alert("Lead set to On Hold successfully.");
                            onClose && onClose();
                          } else {
                            const errMsg = res.data?.error || "Unknown error";
                            alert("Failed to set lead On Hold: " + errMsg);
                          }
                        } catch (err) {
                          const errorMsg = err?.response?.data?.error || err?.message || "Failed to set lead On Hold";
                          alert("Error setting On Hold: " + errorMsg);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="h-9 w-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
              >
                <FaTimesIcon className="text-lg" />
              </button>
            </div>
          </div>

          {/* Body: sidebar + single active section (old behavior) */}
          <div className="flex gap-0 overflow-auto" style={{maxHeight: 'calc(70vh - 60px)'}}>
            {/* Sidebar */}
            <aside className="w-56 shrink-0 border-r p-4 bg-gray-50 rounded-l-2xl flex flex-col items-start justify-start text-xs">
              <nav className="space-y-3 w-full">
                {sections.map((s) => {
                  const isActive = activeSection === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setActiveSection(s.key)}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition",
                        isActive
                          ? "bg-blue-100 border-blue-300 font-bold text-blue-700"
                          : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700",
                      ].join(" ")}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-black text-[15px]">
                        {sectionIcons[s.icon] && createElement(sectionIcons[s.icon], { className: "" })}
                      </span>
                      <span className="text-xs">{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main (single column content) */}
            <main className="flex-1 p-6 text-sm min-w-0">
              <SectionHeader
                iconKey={activeSectionMeta?.icon}
                title={activeSectionMeta?.label || ""}
              />

              {activeSection === "personal" && (
                <Column>
                  <Strip
                    label="Name"
                    value={renderField("name", "Name")}
                    icon={stripIcons.name}
                  />
                  <Strip
                    label="Mobile"
                    value={renderField("mobile_number", "Mobile", "text")}
                    icon={stripIcons.mobile_number}
                    isLink
                  />
                  <Strip
                    label="Email"
                    value={renderField("email", "Email")}
                    icon={stripIcons.email}
                  />
                  <Strip
                    label="Role"
                    value={renderField(
                      "role_id",
                      "Role",
                      "select",
                      dropdowns.roles || []
                    )}
                    icon={stripIcons.role_id}
                  />
                  <Strip
                    label="College/Company"
                    value={renderField("college_company", "College/Company")}
                    icon={stripIcons.college_company}
                  />
                  <Strip
                    label="Location"
                    value={renderField("location", "Location")}
                    icon={stripIcons.location}
                  />
                  <Strip
                    label="Source"
                    value={renderField(
                      "source_id",
                      "Source",
                      "select",
                      dropdowns.sources || []
                    )}
                    icon={stripIcons.source_id}
                  />
                </Column>
              )}

              {activeSection === "course" && (
                <Column>
                  <Strip
                    label="Course Type"
                    value={renderField(
                      "course_type_id",
                      "Course Type",
                      "select",
                      dropdowns.courseTypes || []
                    )}
                    icon={stripIcons.course_type_id}
                  />
                  <Strip
                    label="Course"
                    value={renderField(
                      "course_id",
                      "Course",
                      "select",
                      filteredCourses
                    )}
                    icon={stripIcons.course_id}
                  />
                  <Strip
                    label="Batch"
                    value={renderField(
                      "batch_id",
                      "Batch",
                      "select",
                      dropdowns.batches || []
                    )}
                    icon={stripIcons.batch_id}
                  />
                  <Strip
                    label="Training Status"
                    value={leadData.training_status || "N/A"}
                    icon={stripIcons.training_status}
                  />
                  <Strip
                    label="Training Start Date"
                    value={formatDateDisplay(leadData.training_start_date)}
                    icon={stripIcons.training_start_date}
                  />
                  <Strip
                    label="Training End Date"
                    value={formatDateDisplay(leadData.training_end_date)}
                    icon={stripIcons.training_end_date}
                  />
                </Column>
              )}

              {activeSection === "subCourses" && enableSubCoursesSection && (
                <div className="space-y-4">
                  {hasSubCourseEntries ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {subCourses.map((subCourse, index) => (
                        <div
                          key={subCourse?.sub_course_id || index}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
                        >
                          <div className="mb-2 text-sm font-semibold text-gray-800">
                            {subCourse?.sub_course_name || "-"}
                          </div>
                          <div className="space-y-1">
                            <CardInfoRow
                              label="Status"
                              value={subCourse?.training_status || "-"}
                            />
                            <CardInfoRow
                              label="Start"
                              value={formatDateDisplay(
                                subCourse?.training_start_date
                              )}
                            />
                            <CardInfoRow
                              label="End"
                              value={formatDateDisplay(
                                subCourse?.training_end_date
                              )}
                            />
                            <CardInfoRow
                              label="Trainer"
                              value={subCourse?.trainer_name || "-"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No sub-courses added." />
                  )}
                </div>
              )}

              {activeSection === "trainer" && (
                <>
                  {enableSubCoursesSection ? (
                    hasSubCourseEntries ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {subCourses.map((subCourse, index) => (
                          <div
                            key={`trainer-${subCourse?.sub_course_id || index}`}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
                          >
                            <div className="mb-2 text-sm font-semibold text-gray-800">
                              {subCourse?.sub_course_name || "-"}
                            </div>
                            <div className="space-y-1">
                              <CardInfoRow
                                label="Trainer"
                                value={subCourse?.trainer_name || "-"}
                              />
                              <CardInfoRow
                                label="Trainer Share (%)"
                                value={formatPercent(subCourse?.trainer_share)}
                              />
                              <CardInfoRow
                                label="Trainer Share Amount"
                                value={formatCurrency(
                                  subCourse?.trainer_share_amount
                                )}
                              />
                              <CardInfoRow
                                label="Paid to Trainer"
                                value={formatCurrency(
                                  subCourse?.amount_paid_trainer
                                )}
                              />
                              <CardInfoRow
                                label="Pending Amount"
                                value={formatCurrency(subCourse?.pending_amount)}
                              />
                              <CardInfoRow
                                label="Trainer Paid"
                                value={
                                  subCourse?.trainer_paid ? "Paid" : "Not Paid"
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No trainer payment data available." />
                    )
                  ) : (
                    <Column>
                      <Strip
                        label="Trainer"
                        value={renderField(
                          "trainer_id",
                          "Trainer",
                          "select",
                          dropdowns.trainers || []
                        )}
                        icon={stripIcons.trainer_id}
                      />
                      <Strip
                        label="Trainer Email"
                        value={leadData.trainer_email || "N/A"}
                        icon={stripIcons.trainer_email}
                      />
                      <Strip
                        label="Trainer Mobile"
                        value={
                          leadData.trainer_phone ||
                          leadData.trainer_mobile ||
                          "N/A"
                        }
                        icon={stripIcons.trainer_mobile}
                        isLink={
                          !!leadData.trainer_phone || !!leadData.trainer_mobile
                        }
                      />
                      <Strip
                        label="Trainer Share (%)"
                        value={leadData.trainer_share || "N/A"}
                        icon={stripIcons.trainer_share}
                      />
                      <Strip
                        label="Trainer Share Amount"
                        value={formatCurrency(leadData.trainer_share_amount)}
                        icon={stripIcons.trainer_share_amount}
                      />
                      <Strip
                        label="Amount Paid to Trainer"
                        value={formatCurrency(leadData.amount_paid_trainer)}
                        icon={stripIcons.amount_paid_trainer}
                      />
                      <Strip
                        label="Pending Amount"
                        value={formatCurrency(leadData.pending_amount)}
                        icon={stripIcons.pending_amount}
                      />
                      <Strip
                        label="Trainer Paid"
                        value={leadData.trainer_paid ? "Paid" : "Not Paid"}
                        icon={stripIcons.trainer_paid}
                      />
                    </Column>
                  )}
                </>
              )}

              {activeSection === "financial" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Strip
                      label="Actual Fee"
                      value={renderField("actual_fee", "Actual Fee")}
                      icon={stripIcons.actual_fee}
                    />
                    <Strip
                      label="Discounted Fee"
                      value={renderField("discounted_fee", "Discounted Fee")}
                      icon={stripIcons.discounted_fee}
                    />
                    <Strip
                      label="Fee Paid"
                      value={renderField("fee_paid", "Fee Paid")}
                      icon={stripIcons.fee_paid}
                    />
                    <Strip
                      label="Fee Balance"
                      value={formatCurrency(leadData.fee_balance)}
                      icon={stripIcons.fee_balance}
                    />
                    <Strip
                      label="Paid Status"
                      value={renderField("paid_status", "Paid Status")}
                      icon={stripIcons.paid_status}
                    />
                  </div>
                  <div className="h-px w-full bg-gray-200" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Strip
                      label="Placement Fee"
                      value={renderField("placement_fee", "Placement Fee")}
                      icon={stripIcons.placement_fee}
                    />
                    <Strip
                      label="Placement Paid"
                      value={renderField("placement_paid", "Placement Paid")}
                      icon={stripIcons.placement_paid}
                    />
                    <Strip
                      label="Placement Balance"
                      value={formatCurrency(leadData.placement_balance)}
                      icon={stripIcons.placement_balance}
                    />
                    <Strip
                      label="Placement Paid Status"
                      value={leadData.placement_paid_status || "N/A"}
                      icon={stripIcons.placement_paid_status}
                    />
                  </div>
                </div>
              )}

              {activeSection === "assignee" && (
                <Column>
                  <Strip
                    label="Assignee"
                    value={renderField(
                      "user_id",
                      "Assign To",
                      "select",
                      dropdowns.users || []
                    )}
                    icon="fa-user-tie"
                  />
                  <Strip
                    label="Mobile"
                    value={
                      leadData.assignee_mobile ||
                      leadData.assignee_phone ||
                      leadData.user_mobile ||
                      "N/A"
                    }
                    icon={stripIcons.assignee_mobile}
                    isLink={
                      !!(
                        leadData.assignee_mobile ||
                        leadData.assignee_phone ||
                        leadData.user_mobile
                      )
                    }
                  />
                  <Strip
                    label="Email"
                    value={
                      leadData.assignee_email || leadData.user_email || "N/A"
                    }
                    icon={stripIcons.assignee_email}
                  />
                  <Strip
                    label="Referred By"
                    value={renderField("referred_by", "Referred By")}
                    icon={stripIcons.referred_by}
                  />
                </Column>
              )}

              {activeSection === "classification" && (
                <Column>
                  <Strip
                    label="Business Unit"
                    value={renderField(
                      "unit_id",
                      "Business Unit",
                      "select",
                      dropdowns.units || []
                    )}
                    icon={stripIcons.unit_id}
                  />
                  <Strip
                    label="Card Type"
                    value={renderField(
                      "card_type_id",
                      "Card Type",
                      "select",
                      dropdowns.cardTypes || []
                    )}
                    icon={stripIcons.card_type_id}
                  />
                </Column>
              )}

              {activeSection === "status" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Strip
                      label="Status"
                      value={renderField(
                        "status",
                        "Status",
                        "select",
                        dropdowns.statusOptions || []
                      )}
                      icon={stripIcons.status}
                    />
                    <Strip
                      label="Created At"
                      value={formatDateTimeDisplay(leadData.created_at)}
                      icon={stripIcons.created_at}
                    />
                    <Strip
                      label="Updated At"
                      value={formatDateTimeDisplay(leadData.updated_at)}
                      icon={stripIcons.updated_at}
                    />
                  </div>
                  <div className="flex items-center rounded-md bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-200">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-black text-[15px]">
                      {createElement(stripIcons.enrollment_id, { size: 15 })}
                    </span>
                    <span className="mr-2 text-[11.5px] font-semibold text-gray-800">
                      Enrollment ID:
                    </span>
                    <span className="text-[12px] text-gray-900">
                      {leadData.enrollment_id || "NA"}
                    </span>
                    {leadData.enrollment_id && (
                      <button
                        type="button"
                        onClick={handleCopyEnrollmentId}
                        className="ml-auto inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-200"
                      >
                        {copiedEnrollmentId ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* Comments (UI ONLY CHANGED) */}
          <div className="px-5 pb-5">
            <div className="rounded-xl border bg-gray-50">
              <div className="border-b px-4 py-2.5">
                <h4 className="text-[13px] font-semibold">Comments</h4>
              </div>
              <div className="px-4 py-3">
                <div className="mb-2 flex gap-2">
                  <Pill
                    active={commentTab === "all"}
                    onClick={() => setCommentTab("all")}
                    label="All"
                  />
                  <Pill
                    active={commentTab === "add"}
                    onClick={() => setCommentTab("add")}
                    label="Add New"
                  />
                </div>

                {commentTab === "all" ? (
                  <div className="rounded-lg border bg-white px-3 py-2 text-sm max-h-24 overflow-y-auto" style={{maxHeight:'6rem',overflowY:'auto'}}>
                    {loadingComments ? (
                      <div className="text-center text-gray-500">
                        Loading comments...
                      </div>
                    ) : commentsList?.length ? (
                      commentsList.map((c, idx) => {
                        const id = getCommentId(c, idx);
                        const text = c.comment_text || c.text || c.html || "";
                        // Relative time (e.g. '6 seconds ago')
                        function getRelativeTime(dateString) {
                          if (!dateString) return '';
                          const now = new Date();
                          const then = new Date(dateString);
                          const diff = Math.floor((now - then) / 1000);
                          if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
                          if (diff < 3600) {
                            const min = Math.floor(diff / 60);
                            return `${min} minute${min !== 1 ? 's' : ''} ago`;
                          }
                          if (diff < 86400) {
                            const hr = Math.floor(diff / 3600);
                            return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
                          }
                          const days = Math.floor(diff / 86400);
                          return `${days} day${days !== 1 ? 's' : ''} ago`;
                        }
                        const created = getRelativeTime(c.created_at);
                        const isEditing = editingId === id;
                        const createdBy = c.created_by || c.author || c.username || "";
                        const createdByFull =
                          c.created_by_full ||
                          c.created_by ||
                          c.author ||
                          c.username ||
                          "";
                        // Trello-style: avatar, author, timestamp, bubble, actions
                        return (
                          <div
                            key={id}
                            className="mb-1 flex items-start gap-2"
                          >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[13px] uppercase">
                                {createdByFull
                                  ? createdByFull.split(' ').map(w => w[0]).join('').slice(0,2)
                                  : 'U'}
                              </div>
                            </div>
                            {/* Comment Card */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-gray-900 text-[12px]">{createdByFull}</span>
                                <span className="text-xs text-gray-500 mt-0.5">{created}</span>
                              </div>
                              {!isEditing ? (
                                <div className="rounded-xl bg-gray-100 px-2 py-1 text-[13px] text-gray-900 mt-0.5" style={{minHeight:'unset'}} dangerouslySetInnerHTML={{__html: text}} />
                              ) : (
                                <div className="rounded-md border mt-1">
                                  <div className="flex items-center gap-1 border-b bg-white px-2 py-1">
                                    <ToolbarButton
                                      onClick={() => document.execCommand("bold")}
                                      label="B"
                                      bold
                                    />
                                    <ToolbarButton
                                      onClick={() => document.execCommand("italic")}
                                      label="I"
                                      italic
                                    />
                                    <ToolbarButton
                                      onClick={() => document.execCommand("underline")}
                                      label="U"
                                      underline
                                    />
                                    <ToolbarDivider />
                                    <ToolbarButton
                                      onClick={() => document.execCommand("insertUnorderedList")}
                                      label="•"
                                    />
                                    <ToolbarButton
                                      onClick={() => document.execCommand("insertOrderedList")}
                                      label="1."
                                    />
                                    <ToolbarDivider />
                                    <ToolbarButton
                                      onClick={() => document.execCommand("strikeThrough")}
                                      label="S̶"
                                    />
                                  </div>
                                  <div
                                    ref={editRef}
                                    contentEditable
                                    className="min-h-[90px] w-full bg-white px-3 py-2 text-[13px] outline-none"
                                    style={{ wordBreak: "break-word" }}
                                  />
                                  <div className="flex justify-end gap-2 p-2">
                                    <button
                                      className="rounded-md px-3 py-1.5 text-[12px] bg-gray-200 hover:bg-gray-300"
                                      onClick={() => setEditingId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="rounded-md px-3 py-1.5 text-[12px] bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                                      onClick={() => handleSaveEdit(id)}
                                    >
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow">
                                        <MdCheck className="text-white text-2xl" style={{ borderRadius: '50%' }} />
                                      </span>
                                      Save
                                    </button>
                                  </div>
                                </div>
                              )}
                              {/* Actions */}
                              {!isEditing && (
                                <div className="flex gap-1 mt-0.5">
                                  <button className="p-0.5 rounded hover:bg-gray-200" title="Like"><FaRegThumbsUp size={14} /></button>
                                  <button className="p-0.5 rounded hover:bg-gray-200" title="Emoji"><FaRegSmile size={14} /></button>
                                  <button
                                    className="text-xs text-gray-700 hover:underline font-medium px-1"
                                    style={{minWidth:28}}
                                    title="Reply"
                                    onClick={() => {
                                      setCommentTab("add");
                                      setTimeout(() => {
                                        if (editorRef.current) {
                                          editorRef.current.innerText = `@${createdByFull || createdBy || ""} `;
                                          focusCommentEditor();
                                        }
                                      }, 0);
                                    }}
                                  >
                                    Reply
                                  </button>
                                  <button
                                    className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full"
                                    title="Edit"
                                    onClick={() => {
                                      setEditingId(id);
                                      setTimeout(() => {
                                        if (editRef.current) {
                                          editRef.current.innerText = text;
                                          editRef.current.focus();
                                        }
                                      }, 0);
                                    }}
                                  >
                                    <MdEdit size={14} />
                                  </button>
                                  <button
                                    className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full"
                                    title="Delete"
                                    onClick={() => handleDeleteComment(id)}
                                  >
                                    <MdDelete size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-gray-500">
                        No comments yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white">
                    <div className="flex items-center gap-1 border-b bg-white px-2 py-1">
                      <ToolbarButton
                        onClick={() => exec("bold")}
                        label="B"
                        bold
                      />
                      <ToolbarButton
                        onClick={() => exec("italic")}
                        label="I"
                        italic
                      />
                      <ToolbarButton
                        onClick={() => exec("underline")}
                        label="U"
                        underline
                      />
                      <ToolbarDivider />
                      <ToolbarButton
                        onClick={() => exec("insertUnorderedList")}
                        label="•"
                      />
                      <ToolbarButton
                        onClick={() => exec("insertOrderedList")}
                        label="1."
                      />
                      <ToolbarDivider />
                      <ToolbarButton
                        onClick={() => exec("strikeThrough")}
                        label="S̶"
                      />
                    </div>

                    <div className="px-2 py-2">
                      <div
                        ref={editorRef}
                        contentEditable
                        className="min-h-[130px] w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:border-blue-500 bg-gray-50"
                        style={{ wordBreak: "break-word" }}
                        data-placeholder="Add a comment..."
                        onInput={() => {}}
                      />
                    </div>

                    <div className="flex justify-start gap-2 px-2 pb-3" style={{position:'relative', zIndex:2}}>
                      <button
                        type="button"
                        disabled={savingComment}
                        onClick={handleAddComment}
                        className="rounded-md bg-blue-600 px-4 py-2 text-[12.5px] font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-60"
                      >
                        {savingComment ? "Saving..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* /Comments */}
        </div>
      </div>
    </DndContext>
  );
}

/* ========== UI atoms ========== */
function SectionHeader({ title, iconKey }) {
  const IconComponent = iconKey ? sectionIcons[iconKey] : null;
  return (
    <>
      <div className="mb-1.5 flex items-center gap-2">
        {IconComponent ? (
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-black">
            {createElement(IconComponent, { size: 14 })}
          </span>
        ) : null}
        <span className="text-[13px] font-semibold text-black">{title}</span>
      </div>
      <div className="mb-3 h-px w-full bg-gray-200" />
    </>
  );
}
function Column({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function EmptyState({ message }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-[12.5px] text-gray-500">
      {message}
    </div>
  );
}

function CardInfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-1 text-[12px] last:border-b-0">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-900">{value ?? "-"}</span>
    </div>
  );
}
function Strip({ label, value, icon, isLink = false }) {
  const display = value ?? "N/A";
  let content = display;

  if (!isValidElement(display)) {
    content =
      isLink && display !== "N/A" ? (
        <a href={`tel:${display}`} className="text-[12px] text-blue-600 hover:text-blue-700 underline">
          {display}
        </a>
      ) : (
        <span className="text-[12px] text-gray-900">{display}</span>
      );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-gray-700 mb-0.5">
        {label}
      </label>
      <div className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[12px] text-gray-900 min-h-[32px] flex items-center">
        {content}
      </div>
    </div>
  );
}
function Pill({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-2.5 py-1 text-[11.5px]",
        active
          ? "bg-gray-200 text-gray-900"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
function MenuBtn({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

// small toolbar atoms for the comment editor
function ToolbarButton({ onClick, label, bold, italic, underline }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-2 py-1 text-xs rounded hover:bg-gray-100",
        bold ? "font-bold" : "",
        italic ? "italic" : "",
        underline ? "underline" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
function ToolbarDivider() {
  return <span className="mx-2 h-4 w-px bg-gray-200 inline-block" />;
}

export default EditLeadModal;
