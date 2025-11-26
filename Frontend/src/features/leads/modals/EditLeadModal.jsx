// import { createElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import { DndContext } from '@dnd-kit/core'
// import apiClient from '@shared/api/client'
// import courseService from '@shared/services/courses/courseService'
// import lookupService from '@shared/services/lookups/lookupService'
// import commentService from '@shared/services/leads/commentService'
// import dropdownCache from '@shared/services/leads/dropdownCache'
// import leadService from '@shared/services/leads/leadService'
// import {
//   sectionIcons,
//   stripIcons,
//   FaEllipsisVIcon,
//   FaTimesIcon,
// } from './EditLeadModalIcons'
// import { MdCheck, MdDelete, MdEdit } from 'react-icons/md'
// import { FaRegSmile, FaRegThumbsUp } from 'react-icons/fa'

// const BASE_SECTIONS = [
//   { key: "personal", label: "Personal Information", icon: "personal" },
//   { key: "course", label: "Course Details", icon: "course" },
//   { key: "trainer", label: "Trainer & Payments", icon: "trainer" },
//   { key: "financial", label: "Student Finance", icon: "financial" },
//   { key: "assignee", label: "Assignee Info", icon: "assignee" },
//   { key: "classification", label: "Classification", icon: "classification" },
//   { key: "status", label: "Status & Timeline", icon: "status" },
// ];

// const buildSections = (enableSubCourses = false) => {
//   if (!enableSubCourses) return BASE_SECTIONS;
//   const list = [...BASE_SECTIONS];
//   list.splice(2, 0, {
//     key: "subCourses",
//     label: "Sub-Courses",
//     icon: "subCourses",
//   });
//   return list;
// };

// const formatCurrency = (value) => {
//   if (value === null || value === undefined || value === "") return "N/A";
//   const num = Number(value);
//   return Number.isNaN(num) ? value : `₹${num.toLocaleString("en-IN")}`;
// };

// const formatDateDisplay = (value) =>
//   value ? new Date(value).toLocaleDateString() : "N/A";

// const formatDateTimeDisplay = (value) =>
//   value ? new Date(value).toLocaleString() : "N/A";

// const formatPercent = (value) => {
//   if (value === null || value === undefined || value === "") return "N/A";
//   const num = Number(value);
//   return Number.isNaN(num) ? value : `${num}%`;
// };

// function EditLeadModal(props) {
//   const { open, onClose, lead = {}, comments = [], onUpdated } = props;

//   const [dropdowns, setDropdowns] = useState({
//     courses: [],
//     courseTypes: [],
//     units: [],
//     cardTypes: [],
//     trainers: [],
//     batches: [],
//     assignees: [],
//     users: [],
//     sources: [],
//     roles: [],
//     statusOptions: [],
//   });
//   const [loadingDropdowns, setLoadingDropdowns] = useState(false);
//   const [leadData, setLeadData] = useState(lead);
//   const [optionsOpen, setOptionsOpen] = useState(false);
//   const [commentTab, setCommentTab] = useState("all");

//   // comments state (UI ONLY CHANGES LIVE BELOW)
//   const [commentsList, setCommentsList] = useState([]);
//   const [loadingComments, setLoadingComments] = useState(false);
//   const [savingComment, setSavingComment] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const editorRef = useRef(null);
//   const editRef = useRef(null);
//   const copyTimeoutRef = useRef(null);

//   const [editField, setEditField] = useState(null);
//   const [editValue, setEditValue] = useState("");
//   const [editSaved, setEditSaved] = useState(false);

//   // NEW: sidebar state (restore old behavior)
//   const [activeSection, setActiveSection] = useState(BASE_SECTIONS[0].key);
//   const [copiedEnrollmentId, setCopiedEnrollmentId] = useState(false);
//   const enableSubCoursesSection = leadData?.course_structure === "multiple";
//   const sections = useMemo(
//     () => buildSections(enableSubCoursesSection),
//     [enableSubCoursesSection]
//   );
//   const subCourses = useMemo(
//     () => (Array.isArray(leadData?.sub_courses) ? leadData.sub_courses : []),
//     [leadData?.sub_courses]
//   );
//   const hasSubCourseEntries = subCourses.length > 0;
//   const activeSectionMeta = useMemo(
//     () => sections.find((section) => section.key === activeSection),
//     [sections, activeSection]
//   );

//   useEffect(() => setLeadData(lead), [lead]);

//   useEffect(() => {
//     if (!sections.some((section) => section.key === activeSection)) {
//       setActiveSection(sections[0]?.key || BASE_SECTIONS[0].key);
//     }
//   }, [sections, activeSection]);

//   useEffect(() => {
//     setCopiedEnrollmentId(false);
//     if (copyTimeoutRef.current) {
//       clearTimeout(copyTimeoutRef.current);
//       copyTimeoutRef.current = null;
//     }
//   }, [leadData?.enrollment_id]);

//   useEffect(() => {
//     return () => {
//       if (copyTimeoutRef.current) {
//         clearTimeout(copyTimeoutRef.current);
//       }
//     };
//   }, []);


//   // ---------- helpers ----------
//   const arrOr = (res) =>
//     (Array.isArray(res?.data) && res.data) || (Array.isArray(res) && res) || [];

//   function normOption(x, idKeys = ["id"], nameKeys = ["name"]) {
//     if (typeof x !== "object" || x == null) return { id: x, name: String(x) };
//     return {
//       id:
//         idKeys.map((k) => x[k]).find((v) => v !== undefined && v !== null) ??
//         x.id ??
//         x.value ??
//         x.key,
//       name:
//         nameKeys.map((k) => x[k]).find((v) => v !== undefined && v !== null) ??
//         x.name ??
//         x.label ??
//         x.title ??
//         String(x.id ?? ""),
//       _raw: x,
//     };
//   }

//   function normalizeLead(inLead, dd) {
//     const out = { ...inLead };

//     // COURSE name -> id
//     if (
//       (out.course_id == null || out.course_id === "") &&
//       dd?.courses?.length
//     ) {
//       const courseName =
//         out.course_name || out.course || out.course_label || null;
//       if (courseName) {
//         const hit = dd.courses.find(
//           (o) =>
//             String(o.name).toLowerCase() === String(courseName).toLowerCase()
//         );
//         if (hit) out.course_id = hit.id;
//       }
//     }

//     // COURSE TYPE name -> id
//     if (
//       (out.course_type_id == null || out.course_type_id === "") &&
//       dd?.courseTypes?.length
//     ) {
//       const ctName =
//         out.course_type_name || out.course_type || out.course_type_label;
//       if (ctName) {
//         const hit = dd.courseTypes.find(
//           (o) => String(o.name).toLowerCase() === String(ctName).toLowerCase()
//         );
//         if (hit) out.course_type_id = hit.id;
//       }
//     }

//     // USER/ASSIGNEE validation
//     const users = Array.isArray(dd?.users) ? dd.users : [];
//     const validUserIds = new Set(users.map((u) => String(u.id)));
//     const trySetUserId = (val) => {
//       if (val == null || val === "") return;
//       if (validUserIds.has(String(val))) out.user_id = val;
//     };
//     trySetUserId(out.user_id);
//     trySetUserId(out.assignee_id);
//     trySetUserId(out.assigned_to_id);
//     trySetUserId(out.owner_id);
//     trySetUserId(out.owner);
//     if (out.user_id != null && !validUserIds.has(String(out.user_id))) {
//       out.user_id = null;
//     }

//     return out;
//   }

//   const getCommentId = useCallback((comment, fallback = null) => {
//     if (!comment || typeof comment !== "object") return fallback;
//     return (
//       comment.comment_id ??
//       comment.id ??
//       comment._id ??
//       comment.commentId ??
//       fallback
//     );
//   }, []);

//   const focusCommentEditor = useCallback(() => {
//     if (!editorRef.current || typeof window === "undefined") return;
//     editorRef.current.focus();
//     const selection = window.getSelection?.();
//     if (!selection) return;
//     const range = document.createRange();
//     range.selectNodeContents(editorRef.current);
//     range.collapse(false);
//     selection.removeAllRanges();
//     selection.addRange(range);
//   }, []);

//   function buildDropdownState(responses = {}) {
//     const processList = (key, mapper) => {
//       const res = responses[key];
//       const raw =
//         res?.success && Array.isArray(res.data) ? res.data : arrOr(res);
//       return Array.isArray(raw) ? raw.map(mapper) : [];
//     };

//     const arrayOrEmpty = (value) => {
//       if (Array.isArray(value)) return value;
//       if (value?.success && Array.isArray(value.data)) return value.data;
//       if (Array.isArray(value?.data)) return value.data;
//       return [];
//     };

//     return {
//       courses: processList(
//         "courses",
//         (c) =>
//           normOption(
//             c,
//             ["id", "course_id", "value", "key"],
//             ["name", "course_name", "label", "title"]
//           )
//       ),
//       courseTypes: processList("courseTypes", (ct) =>
//         typeof ct === "object"
//           ? normOption(ct)
//           : { id: ct, name: String(ct) }
//       ),
//       units: processList(
//         "units",
//         (u) => normOption(u, ["unit_id", "id"], ["unit_name", "name"])
//       ),
//       cardTypes: processList(
//         "cardTypes",
//         (c) => normOption(c, ["card_type_id", "id"], ["card_type_name", "name"])
//       ),
//       trainers: processList(
//         "trainers",
//         (t) => {
//           const normalized = normOption(t, ["id", "trainer_id"], [
//             "name",
//             "trainer_name",
//             "full_name",
//             "user_name",
//           ]);
//           // Preserve email and mobile from the trainer object
//           return {
//             ...normalized,
//             email: t.email || t.trainer_email || '',
//             mobile: t.mobile || t.trainer_mobile || t.phone || t.trainer_phone || '',
//           };
//         }
//       ),
//       batches: processList(
//         "batches",
//         (b) => normOption(b, ["id", "batch_id"], ["name", "batch_name"])
//       ),
//       assignees: processList(
//         "assignees",
//         (a) => {
//           const normalized = normOption(
//             a,
//             ["assignee_id", "id", "user_id"],
//             ["assignee_name", "name", "full_name", "user_name"]
//           );
//           return {
//             ...normalized,
//             email: a.email || a.user_email || a.assignee_email || '',
//             mobile: a.mobile || a.user_mobile || a.assignee_mobile || a.phone || '',
//           };
//         }
//       ),
//       users: processList(
//         "users",
//         (u) => {
//           const normalized = normOption(u, ["user_id", "id"], ["name", "username", "email"]);
//           return {
//             ...normalized,
//             email: u.email || u.user_email || '',
//             mobile: u.mobile || u.user_mobile || u.phone || '',
//           };
//         }
//       ),
//       sources: processList(
//         "sources",
//         (s) =>
//           normOption(
//             s,
//             ["id"],
//             ["name", "source_name", "full_name"]
//           )
//       ),
//       roles: processList(
//         "roles",
//         (r) => normOption(r, ["id"], ["name"])
//       ),
//       statusOptions: arrayOrEmpty(responses.statusOptions),
//     };
//   }

//   // ---------- dropdowns fetch (with caching and async loading) ----------
//   useEffect(() => {
//     if (!open) return;

//     async function fetchDropdowns() {
//       // Show modal immediately, load dropdowns in background
//       setLoadingDropdowns(true);
      
//       // Check cache first
//       const cacheKeys = ['courses', 'courseTypes', 'units', 'cardTypes', 'trainers', 'batches', 'assignees', 'users', 'sources', 'roles'];
//       const { cached, missing } = dropdownCache.getMultiple(cacheKeys);
      
//       // If we have cached data, use it immediately
//       if (Object.keys(cached).length > 0) {
//         const initialDropdowns = buildDropdownState(cached);
//         setDropdowns(initialDropdowns);
//         setLeadData((ld) => normalizeLead(ld ?? lead ?? {}, initialDropdowns));
//         setLoadingDropdowns(false); // Show UI immediately
//       }

//       // Fetch only missing items
//       const fetchPromises = [];
//       const fetchKeys = [];
      
//       if (!cached.courses || missing.includes('courses')) {
//         fetchKeys.push('courses');
//         fetchPromises.push(courseService.getCourses?.().then(res => ({ key: 'courses', data: res })));
//       }
//       if (!cached.courseTypes || missing.includes('courseTypes')) {
//         fetchKeys.push('courseTypes');
//         fetchPromises.push(courseService.getCourseTypes?.().then(res => ({ key: 'courseTypes', data: res })));
//       }
//       if (!cached.units || missing.includes('units')) {
//         fetchKeys.push('units');
//         fetchPromises.push(lookupService.getUnits().then(res => ({ key: 'units', data: res })));
//       }
//       if (!cached.cardTypes || missing.includes('cardTypes')) {
//         fetchKeys.push('cardTypes');
//         fetchPromises.push(lookupService.getCardTypes().then(res => ({ key: 'cardTypes', data: res })));
//       }
//       if (!cached.trainers || missing.includes('trainers')) {
//         fetchKeys.push('trainers');
//         fetchPromises.push(lookupService.getTrainers().then(res => ({ key: 'trainers', data: res })));
//       }
//       if (!cached.batches || missing.includes('batches')) {
//         fetchKeys.push('batches');
//         fetchPromises.push(lookupService.getBatches().then(res => ({ key: 'batches', data: res })));
//       }
//       if (!cached.assignees || missing.includes('assignees')) {
//         fetchKeys.push('assignees');
//         fetchPromises.push(lookupService.getAssignees().then(res => ({ key: 'assignees', data: res })));
//       }
//       if (!cached.users || missing.includes('users')) {
//         fetchKeys.push('users');
//         fetchPromises.push(lookupService.getUsers().then(res => ({ key: 'users', data: res })));
//       }
//       if (!cached.sources || missing.includes('sources')) {
//         fetchKeys.push('sources');
//         fetchPromises.push(lookupService.getSources().then(res => ({ key: 'sources', data: res })));
//       }
//       if (!cached.roles || missing.includes('roles')) {
//         fetchKeys.push('roles');
//         fetchPromises.push(lookupService.getRoles?.().then(res => ({ key: 'roles', data: res })));
//       }

//       // If nothing to fetch, we're done
//       if (fetchPromises.length === 0) {
//         return;
//       }

//       try {
//         // Fetch only missing items in parallel
//         const results = await Promise.all(fetchPromises);
        
//         const combinedResponses = { ...cached };
//         results.forEach(({ key, data }) => {
//           if (data) {
//             combinedResponses[key] = data;
//             dropdownCache.set(key, data);
//           }
//         });

//         const nextDropdowns = buildDropdownState(combinedResponses);
//         setDropdowns(nextDropdowns);
//         setLeadData((ld) => normalizeLead(ld ?? lead ?? {}, nextDropdowns));
//       } catch {
//         setDropdowns({
//           courses: [],
//           courseTypes: [],
//           units: [],
//           cardTypes: [],
//           trainers: [],
//           batches: [],
//           assignees: [],
//           users: [],
//           sources: [],
//           roles: [],
//           statusOptions: [],
//         });
//       } finally {
//         setLoadingDropdowns(false);
//       }
//     }

//     fetchDropdowns();
//   }, [open]);

//   // re-normalize when dependencies change
//   useEffect(() => {
//     if (!open) return;
//     setLeadData(normalizeLead(lead ?? {}, dropdowns));
//   }, [
//     open,
//     lead,
//     dropdowns.courses,
//     dropdowns.courseTypes,
//     dropdowns.assignees,
//     dropdowns.users,
//   ]);

//   // Auto-populate trainer email and phone when trainer is selected
//   useEffect(() => {
//     if (!open || !leadData?.trainer_id || !dropdowns.trainers?.length) return;
    
//     const selectedTrainer = dropdowns.trainers.find(
//       (t) => String(t.id) === String(leadData.trainer_id)
//     );
    
//     if (selectedTrainer && (selectedTrainer.email || selectedTrainer.mobile)) {
//       // Only update if the current email/mobile are empty or don't match the selected trainer's data
//       const needsUpdate = 
//         (selectedTrainer.email && leadData.trainer_email !== selectedTrainer.email) ||
//         (selectedTrainer.mobile && leadData.trainer_phone !== selectedTrainer.mobile && leadData.trainer_mobile !== selectedTrainer.mobile);
      
//       if (needsUpdate) {
//         setLeadData((prev) => {
//           const updates = {};
//           if (selectedTrainer.email) {
//             updates.trainer_email = selectedTrainer.email;
//           }
//           if (selectedTrainer.mobile) {
//             updates.trainer_phone = selectedTrainer.mobile;
//             updates.trainer_mobile = selectedTrainer.mobile;
//           }
//           return { ...prev, ...updates };
//         });
//       }
//     }
//   }, [open, leadData?.trainer_id, dropdowns.trainers, leadData?.trainer_email, leadData?.trainer_phone, leadData?.trainer_mobile]);

//   const getInputClasses = (field, extra = "w-full") => {
//     const base =
//       "border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2";
//     // Simple error check if we had fieldErrors state, for now just base
//     const normalState =
//       "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
//     return `${extra} ${base} ${normalState}`.trim();
//   };

//   const handleInputChange = (field, value) => {
//     setLeadData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSave = async (field, value) => {
//     let finalValue = value;
    
//     // Handle numeric fields
//     const numericFields = [
//       "course_id", "batch_id", "trainer_id", "user_id", 
//       "unit_id", "card_type_id", "assignee_id", "source_id", "role_id",
//       "actual_fee", "discounted_fee", "placement_fee", "placement_actual_fee",
//       "placement_discounted_fee", "trainer_share", "trainer_share_amount",
//       "amount_paid_trainer", "pending_amount", "placement_paid", "placement_pending"
//     ];

//     if (numericFields.includes(field) && finalValue !== "") {
//       const num = Number(finalValue);
//       finalValue = isNaN(num) ? finalValue : num;
//     }

//     if (field === "trainer_paid") {
//       finalValue = (finalValue === "true" || finalValue === true);
//     }

//     // Special handling for course_id change to update course_type
//     if (field === "course_id" && finalValue) {
//       const selectedCourse = dropdowns.courses.find(
//         (c) => String(c.id) === String(finalValue)
//       );
//       if (selectedCourse) {
//         const courseType = selectedCourse._raw?.course_type || 
//                            selectedCourse.course_type || 
//                            selectedCourse.name?.split(' - ')[0] || 
//                            null;
//         if (courseType) {
//            // Update local state for immediate feedback
//            setLeadData(prev => ({
//              ...prev,
//              course_type: courseType,
//              course_type_name: courseType,
//              course_type_id: courseType
//            }));
//         }
//       }
//     }

//     // Prepare payload
//     const payload = { ...leadData, [field]: finalValue };
    
//     // Clean up payload - only delete fields that are NOT being explicitly saved
//     delete payload.assignee_id; // Use user_id
//     delete payload.assigned_to_id;
//     delete payload.owner_id;
//     delete payload.owner;
    
//     // Only delete course_type fields if we're NOT saving course_type_id
//     if (field !== "course_type_id") {
//       delete payload.course_type_id; // Not in leads table (unless explicitly saving)
//     }
//     delete payload.course_type; // Not in leads table
//     delete payload.course_type_name; // Not in leads table

//     try {
//       const leadId = leadData.lead_id || leadData.id;
//       if (!leadId) return;

//       // Debug logging for placement fees
//       if (field === "placement_discounted_fee" || field === "placement_fee") {
//         console.log(`Saving ${field}:`, finalValue);
//         console.log("Full payload:", payload);
//       }

//       const response = await apiClient.put(`/leads/${leadId}`, payload);
//       if (response?.data) {
//         // Update with fresh data from server
//         setLeadData(normalizeLead(response.data, dropdowns));
//         onUpdated && onUpdated();
        
//         // Confirm save for placement fees
//         if (field === "placement_discounted_fee" || field === "placement_fee") {
//           console.log("Server response:", response.data);
//         }
//       }
//     } catch (err) {
//       console.error("Failed to update lead:", err);
//       alert("Failed to update lead: " + (err?.message || "Unknown error"));
//     }
//   };

//   // Auto-populate assignee email and mobile when assignee/user is selected
//   useEffect(() => {
//     if (!open || !leadData?.user_id || (!dropdowns.assignees?.length && !dropdowns.users?.length)) return;
    
//     // Try to find in assignees first, then users
//     const selectedAssignee = dropdowns.assignees?.find(
//       (a) => String(a.id) === String(leadData.user_id)
//     ) || dropdowns.users?.find(
//       (u) => String(u.id) === String(leadData.user_id)
//     );
    
//     if (selectedAssignee && (selectedAssignee.email || selectedAssignee.mobile)) {
//       // Only update if the current email/mobile are empty or don't match the selected assignee's data
//       const needsUpdate = 
//         (selectedAssignee.email && leadData.assignee_email !== selectedAssignee.email) ||
//         (selectedAssignee.mobile && leadData.assignee_mobile !== selectedAssignee.mobile && leadData.user_mobile !== selectedAssignee.mobile);
      
//       if (needsUpdate) {
//         setLeadData((prev) => {
//           const updates = {};
//           if (selectedAssignee.email) {
//             updates.assignee_email = selectedAssignee.email;
//             updates.user_email = selectedAssignee.email;
//           }
//           if (selectedAssignee.mobile) {
//             updates.assignee_mobile = selectedAssignee.mobile;
//             updates.user_mobile = selectedAssignee.mobile;
//           }
//           return { ...prev, ...updates };
//         });
//       }
//     }
//   }, [open, leadData?.user_id, dropdowns.assignees, dropdowns.users, leadData?.assignee_email, leadData?.assignee_mobile, leadData?.user_email, leadData?.user_mobile]);

//   // Auto-update course_type display when course_id changes
//   useEffect(() => {
//     if (!open || !leadData?.course_id || !dropdowns.courses?.length) return;
    
//     const selectedCourse = dropdowns.courses.find(
//       (c) => String(c.id) === String(leadData.course_id)
//     );
    
//     if (selectedCourse) {
//       // Get course_type from the course object
//       const courseType = selectedCourse._raw?.course_type || 
//                          selectedCourse.course_type || 
//                          null;
      
//       // Update the display value if it's different
//       if (courseType && leadData.course_type !== courseType) {
//         setLeadData((prev) => ({
//           ...prev,
//           course_type: courseType,
//           course_type_name: courseType,
//         }));
//       }
//     }
//   }, [open, leadData?.course_id, dropdowns.courses, leadData?.course_type]);

//   const handleCopyEnrollmentId = () => {
//     if (!leadData?.enrollment_id) return;
    
//     navigator.clipboard.writeText(leadData.enrollment_id).then(() => {
//       setCopiedEnrollmentId(true);
//       if (copyTimeoutRef.current) {
//         clearTimeout(copyTimeoutRef.current);
//       }
//       copyTimeoutRef.current = setTimeout(() => {
//         setCopiedEnrollmentId(false);
//       }, 2000);
//     }).catch(err => {
//       console.error('Failed to copy enrollment ID:', err);
//     });
//   };



//   // ---------- inline edit ----------
//   const renderInlineField = (field, label, type = "text", options = []) => {
//     const isEditing = editField === field;
    
//     // Get the value with fallback for placement_fee
//     let value = leadData[field];
//     if (field === "placement_fee" && (value === null || value === undefined || value === "")) {
//       value = leadData.placement_actual_fee;
//     }

//     const handleSaveClick = (currentValue) => {
//       handleSave(field, currentValue);
//       setEditField(null);
//     };

//     if (isEditing) {
//       const commonProps = {
//         autoFocus: true,
//         value: value === null || value === undefined ? "" : value,
//         onChange: (e) => handleInputChange(field, e.target.value),
//         onKeyDown: (e) => {
//           if (e.key === "Enter") {
//             handleSaveClick(e.target.value);
//           } else if (e.key === "Escape") {
//             setEditField(null);
//           }
//         },
//         className: getInputClasses(field, "flex-1"),
//       };

//       if (type === "select") {
//         return (
//           <div className="flex items-center gap-1.5">
//             <select {...commonProps}>
//               <option value="">Select {label}</option>
//               {options.map((opt) => (
//                 <option key={opt.id || opt.value} value={opt.id || opt.value}>
//                   {opt.name || opt.label}
//                 </option>
//               ))}
//             </select>
//             <button
//               type="button"
//               onClick={() => handleSaveClick(leadData[field])}
//               className="flex-shrink-0 h-8 w-8 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
//               title="Save"
//             >
//               <MdCheck className="text-lg" />
//             </button>
//           </div>
//         );
//       } else if (type === "date") {
//          const dateValue = value ? new Date(value).toISOString().split('T')[0] : "";
//          return (
//            <div className="flex items-center gap-1.5">
//              <input type="date" {...commonProps} value={dateValue} />
//              <button
//                type="button"
//                onClick={() => handleSaveClick(leadData[field])}
//                className="flex-shrink-0 h-8 w-8 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
//                title="Save"
//              >
//                <MdCheck className="text-lg" />
//              </button>
//            </div>
//          );
//       } else {
//         return (
//           <div className="flex items-center gap-1.5">
//             <input type={type} {...commonProps} />
//             <button
//               type="button"
//               onClick={() => handleSaveClick(leadData[field])}
//               className="flex-shrink-0 h-8 w-8 rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
//               title="Save"
//             >
//               <MdCheck className="text-lg" />
//             </button>
//           </div>
//         );
//       }
//     }

//     // Display Mode - NOW WITH VISIBLE BORDERS
//     let displayValue = value;
//     if (type === "select") {
//       const selected = options.find(
//         (opt) => String(opt.id || opt.value) === String(value)
//       );
//       displayValue = selected ? (selected.name || selected.label) : (value || "-");
//     } else if (type === "date") {
//       displayValue = formatDateDisplay(value);
//     } else if (value === null || value === undefined || value === "") {
//         displayValue = "-";
//     }

//     return (
//       <div
//         onClick={() => setEditField(field)}
//         className="min-h-[32px] w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50 hover:border-blue-400 flex items-center transition-colors"
//         title="Click to edit"
//       >
//         <span className={!value ? "text-gray-400" : "text-gray-900"}>
//           {displayValue}
//         </span>
//       </div>
//     );
//   };

//   // Get current course type from selected course or leadData
//   const currentCourseType = useMemo(() => {
//     if (leadData?.course_id && dropdowns.courses?.length) {
//       const selectedCourse = dropdowns.courses.find(
//         (c) => String(c.id) === String(leadData.course_id)
//       );
//       return selectedCourse?._raw?.course_type || 
//              selectedCourse?.course_type || 
//              leadData.course_type || 
//              leadData.course_type_name || 
//              null;
//     }
//     return leadData?.course_type || leadData?.course_type_name || null;
//   }, [leadData?.course_id, leadData?.course_type, leadData?.course_type_name, dropdowns.courses]);

//   // Filter courses by selected course type
//   const filteredCourses = useMemo(() => {
//     if (!dropdowns.courses) return [];
    
//     // If course_type_id is selected, filter courses by that type
//     if (leadData?.course_type_id) {
//       return dropdowns.courses.filter(course => {
//         const courseType = course._raw?.course_type || course.course_type;
//         return String(courseType).toLowerCase() === String(leadData.course_type_id).toLowerCase();
//       });
//     }
    
//     // Otherwise show all courses
//     return dropdowns.courses;
//   }, [dropdowns.courses, leadData?.course_type_id]);

//   // Memoize the modal to prevent unnecessary re-renders
//   if (!open) return null;

//   return (
//     <DndContext>
//       <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2">
//         <div
//           className="relative w-[75vw] max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 text-sm flex flex-col"
//           style={{ boxSizing: 'border-box', margin: 'auto' }}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between border-b px-7 py-4 sticky top-0 bg-white z-10 rounded-t-2xl">
//             <h2 className="text-lg font-bold text-gray-800">Edit Lead</h2>
//             <div className="ml-auto flex items-center gap-2">
//               <div className="relative">
//                 <button
//                   type="button"
//                   aria-label="Actions"
//                   onClick={() => setOptionsOpen((v) => !v)}
//                   className="h-9 w-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
//                 >
//                   <FaEllipsisVIcon className="text-lg" />
//                 </button>
//                 {optionsOpen && (
//                   <div className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-md border bg-white shadow-xl">
//                     <MenuBtn
//                       label="Delete"
//                       onClick={async () => {
//                         setOptionsOpen(false);
//                         if (!window.confirm("Are you sure you want to delete this lead?")) {
//                           return;
//                         }

//                         const leadId = leadData?.lead_id || leadData?.id;
//                         if (!leadId) {
//                           alert("Cannot delete lead: missing lead ID.");
//                           return;
//                         }

//                         try {
//                           const result = await leadService.deleteLead(leadId, "Deleted from UI");
//                           if (result.success) {
//                             onClose?.();
//                             onUpdated?.();
//                           } else {
//                             alert("Failed to delete lead: " + (result.error || "Unknown error"));
//                           }
//                         } catch (err) {
//                           alert("Error deleting lead: " + (err?.message || err));
//                         }
//                       }}
//                     />
//                     <MenuBtn
//                       label="Archive"
//                       onClick={async () => {
//                         setOptionsOpen(false);
//                         const leadId = leadData.lead_id || leadData.id;
//                         if (!leadId) {
//                           alert("Cannot archive: Lead ID is missing.");
//                           return;
//                         }
//                         try {
//                           const res = await apiClient.put(`/leads/archive/${leadId}`, {});
//                           if (res.status === 200 || res.data) {
//                             onUpdated && onUpdated(true); // Pass true to indicate archived
//                             alert("Lead archived successfully.");
//                             onClose && onClose();
//                           } else {
//                             const errMsg = res.data?.error || "Unknown error";
//                             alert("Failed to archive lead: " + errMsg);
//                           }
//                         } catch (err) {
//                           const errorMsg = err?.response?.data?.error || err?.message || "Failed to archive lead";
//                           alert("Error archiving lead: " + errorMsg);
//                         }
//                       }}
//                     />
//                     <MenuBtn
//                       label="On Hold"
//                       onClick={async () => {
//                         setOptionsOpen(false);
//                         const leadId = leadData.lead_id || leadData.id;
//                         if (!leadId) {
//                           alert("Cannot set On Hold: Lead ID is missing.");
//                           return;
//                         }
//                         try {
//                           const res = await apiClient.put(`/leads/onhold/${leadId}`, {});
//                           if (res.status === 200 || res.data) {
//                             onUpdated && onUpdated();
//                             alert("Lead set to On Hold successfully.");
//                             onClose && onClose();
//                           } else {
//                             const errMsg = res.data?.error || "Unknown error";
//                             alert("Failed to set lead On Hold: " + errMsg);
//                           }
//                         } catch (err) {
//                           const errorMsg = err?.response?.data?.error || err?.message || "Failed to set lead On Hold";
//                           alert("Error setting On Hold: " + errorMsg);
//                         }
//                       }}
//                     />
//                   </div>
//                 )}
//               </div>
//               <button
//                 type="button"
//                 aria-label="Close"
//                 onClick={onClose}
//                 className="h-9 w-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
//               >
//                 <FaTimesIcon className="text-lg" />
//               </button>
//             </div>
//           </div>

//           {/* Body: sidebar + single active section (old behavior) */}
//           <div className="flex gap-0 overflow-auto" style={{maxHeight: 'calc(70vh - 60px)'}}>
//             {/* Sidebar */}
//             <aside className="w-56 shrink-0 border-r p-4 bg-gray-50 rounded-l-2xl flex flex-col items-start justify-start text-xs">
//               <nav className="space-y-3 w-full">
//                 {sections.map((s) => {
//                   const isActive = activeSection === s.key;
//                   return (
//                     <button
//                       key={s.key}
//                       type="button"
//                       onClick={() => setActiveSection(s.key)}
//                       className={[
//                         "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition",
//                         isActive
//                           ? "bg-blue-100 border-blue-300 font-bold text-blue-700"
//                           : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700",
//                       ].join(" ")}
//                     >
//                       <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-black text-[15px]">
//                         {sectionIcons[s.icon] && createElement(sectionIcons[s.icon], { className: "" })}
//                       </span>
//                       <span className="text-xs">{s.label}</span>
//                     </button>
//                   );
//                 })}
//               </nav>
//             </aside>

//             {/* Main (single column content) */}
//             <main className="flex-1 p-6 text-sm min-w-0">
//               <SectionHeader
//                 iconKey={activeSectionMeta?.icon}
//                 title={activeSectionMeta?.label || ""}
//               />

//               {activeSection === "personal" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Personal Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
//                       {renderInlineField("name", "Name")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
//                       {renderInlineField("mobile_number", "Mobile")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
//                       {renderInlineField("email", "Email", "email")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
//                       {renderInlineField("role_id", "Role", "select", dropdowns.roles)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">College/Company</label>
//                       {renderInlineField("college_company", "College/Company")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
//                       {renderInlineField("location", "Location")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
//                       {renderInlineField("source_id", "Source", "select", dropdowns.sources)}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeSection === "course" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Course Details</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Course Type</label>
//                       {renderInlineField("course_type_id", "Course Type", "select", dropdowns.courseTypes)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
//                       {renderInlineField("course_id", "Course", "select", filteredCourses)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
//                       {renderInlineField("batch_id", "Batch", "select", dropdowns.batches)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Training Status</label>
//                       {renderInlineField("training_status", "Training Status", "select", [
//                         {id: "nottaken", name: "Not Taken"},
//                         {id: "scheduled", name: "Scheduled"},
//                         {id: "in_progress", name: "In Progress"},
//                         {id: "onhold", name: "On Hold"},
//                         {id: "completed", name: "Completed"}
//                       ])}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Training Start Date</label>
//                       {renderInlineField("training_start_date", "Training Start Date", "date")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Training End Date</label>
//                       {renderInlineField("training_end_date", "Training End Date", "date")}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeSection === "subCourses" && enableSubCoursesSection && (
//                 <div className="space-y-4">
//                   {hasSubCourseEntries ? (
//                     <div className="grid gap-4 md:grid-cols-2">
//                       {subCourses.map((subCourse, index) => (
//                         <div
//                           key={subCourse?.sub_course_id || index}
//                           className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
//                         >
//                           <div className="mb-2 text-sm font-semibold text-gray-800">
//                             {subCourse?.sub_course_name || "-"}
//                           </div>
//                           <div className="space-y-1">
//                             <CardInfoRow
//                               label="Status"
//                               value={subCourse?.training_status || "-"}
//                             />
//                             <CardInfoRow
//                               label="Start"
//                               value={formatDateDisplay(
//                                 subCourse?.training_start_date
//                               )}
//                             />
//                             <CardInfoRow
//                               label="End"
//                               value={formatDateDisplay(
//                                 subCourse?.training_end_date
//                               )}
//                             />
//                             <CardInfoRow
//                               label="Trainer"
//                               value={subCourse?.trainer_name || "-"}
//                             />
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <EmptyState message="No sub-courses added." />
//                   )}
//                 </div>
//               )}

//               {activeSection === "trainer" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Trainer & Payments</h3>
//                   {enableSubCoursesSection ? (
//                     hasSubCourseEntries ? (
//                       <div className="grid gap-4 md:grid-cols-2">
//                         {subCourses.map((subCourse, index) => (
//                           <div
//                             key={`trainer-${subCourse?.sub_course_id || index}`}
//                             className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
//                           >
//                             <div className="mb-2 text-sm font-semibold text-gray-800">
//                               {subCourse?.sub_course_name || "-"}
//                             </div>
//                             <div className="space-y-1">
//                               <CardInfoRow
//                                 label="Trainer"
//                                 value={subCourse?.trainer_name || "-"}
//                               />
//                               <CardInfoRow
//                                 label="Trainer Share (%)"
//                                 value={formatPercent(subCourse?.trainer_share)}
//                               />
//                               <CardInfoRow
//                                 label="Trainer Share Amount"
//                                 value={formatCurrency(
//                                   subCourse?.trainer_share_amount
//                                 )}
//                               />
//                               <CardInfoRow
//                                 label="Paid to Trainer"
//                                 value={formatCurrency(
//                                   subCourse?.amount_paid_trainer
//                                 )}
//                               />
//                               <CardInfoRow
//                                 label="Pending Amount"
//                                 value={formatCurrency(subCourse?.pending_amount)}
//                               />
//                               <CardInfoRow
//                                 label="Trainer Paid"
//                                 value={
//                                   subCourse?.trainer_paid ? "Paid" : "Not Paid"
//                                 }
//                               />
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <EmptyState message="No trainer payment data available." />
//                     )
//                   ) : (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer</label>
//                         {renderInlineField("trainer_id", "Trainer", "select", dropdowns.trainers)}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Email</label>
//                         {renderInlineField("trainer_email", "Trainer Email", "email")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Phone</label>
//                         {renderInlineField("trainer_phone", "Trainer Phone", "tel")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Share (%)</label>
//                         {renderInlineField("trainer_share", "Trainer Share", "number")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Share Amount</label>
//                         {renderInlineField("trainer_share_amount", "Trainer Share Amount", "number")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid to Trainer</label>
//                         {renderInlineField("amount_paid_trainer", "Amount Paid to Trainer", "number")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Pending Amount</label>
//                         {renderInlineField("pending_amount", "Pending Amount", "number")}
//                       </div>
//                       <div>
//                         <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Paid</label>
//                         {renderInlineField("trainer_paid", "Trainer Paid", "select", [
//                           {id: false, name: "Not Paid"},
//                           {id: true, name: "Paid"}
//                         ])}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {activeSection === "financial" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Student Finance</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Actual Fee</label>
//                       {renderInlineField("actual_fee", "Actual Fee", "number")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Discounted Fee</label>
//                       {renderInlineField("discounted_fee", "Discounted Fee", "number")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Fee Paid</label>
//                       <div className="min-h-[32px] w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 flex items-center">
//                         {formatCurrency(leadData.fee_paid)}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Fee Balance</label>
//                       <div className="min-h-[32px] w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 flex items-center">
//                         {formatCurrency(leadData.fee_balance)}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Paid Status</label>
//                       {renderInlineField("paid_status", "Paid Status", "select", [
//                         {id: "", name: "Select Status"},
//                         {id: "paid", name: "Paid"},
//                         {id: "pending", name: "Pending"},
//                         {id: "overdue", name: "Overdue"}
//                       ])}
//                     </div>
//                   </div>
                  
//                   <div className="h-px w-full bg-gray-200 my-4" />
//                   <h4 className="text-xs font-semibold text-gray-600 mb-3">Placement Fees</h4>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Placement Actual Fee</label>
//                       {renderInlineField("placement_fee", "Placement Actual Fee", "number")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Placement Discounted Fee</label>
//                       {renderInlineField("placement_discounted_fee", "Placement Discounted Fee", "number")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Placement Paid</label>
//                       {renderInlineField("placement_paid", "Placement Paid", "number")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Placement Balance</label>
//                       <div className="min-h-[32px] w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 flex items-center">
//                         {formatCurrency(leadData.placement_balance || leadData.placement_pending)}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Placement Paid Status</label>
//                       {renderInlineField("placement_paid_status", "Placement Paid Status", "select", [
//                         {id: "", name: "Select Status"},
//                         {id: "paid", name: "Paid"},
//                         {id: "pending", name: "Pending"},
//                         {id: "overdue", name: "Overdue"}
//                       ])}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeSection === "assignee" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Assignee Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
//                       {renderInlineField("user_id", "Assignee", "select", dropdowns.users)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Assignee Email</label>
//                       {renderInlineField("assignee_email", "Assignee Email", "email")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Assignee Mobile</label>
//                       {renderInlineField("assignee_mobile", "Assignee Mobile", "tel")}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Referred By</label>
//                       {renderInlineField("referred_by", "Referred By")}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeSection === "classification" && (
//                 <div className="space-y-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Classification</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Business Unit</label>
//                       {renderInlineField("unit_id", "Business Unit", "select", dropdowns.units)}
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Card Type</label>
//                       {renderInlineField("card_type_id", "Card Type", "select", dropdowns.cardTypes)}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeSection === "status" && (
//                 <div className="flex flex-col gap-4">
//                   <h3 className="text-sm font-semibold mb-4 text-gray-800">Status & Timeline</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
//                       {renderInlineField("status", "Status", "select", dropdowns.statusOptions.map(s => ({id: s.value, name: s.label})))}
//                     </div>
//                     <Strip
//                       label="Created At"
//                       value={formatDateTimeDisplay(leadData.created_at)}
//                       icon={stripIcons.created_at}
//                     />
//                     <Strip
//                       label="Updated At"
//                       value={formatDateTimeDisplay(leadData.updated_at)}
//                       icon={stripIcons.updated_at}
//                     />
//                   </div>
//                   <div className="flex items-center rounded-md bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-200">
//                     <span className="mr-2 flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-black text-[15px]">
//                       {createElement(stripIcons.enrollment_id, { size: 15 })}
//                     </span>
//                     <span className="mr-2 text-[11.5px] font-semibold text-gray-800">
//                       Enrollment ID:
//                     </span>
//                     <span className="text-[12px] text-gray-900">
//                       {leadData.enrollment_id || "NA"}
//                     </span>
//                     {leadData.enrollment_id && (
//                       <button
//                         type="button"
//                         onClick={handleCopyEnrollmentId}
//                         className="ml-auto inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-200"
//                       >
//                         {copiedEnrollmentId ? "Copied" : "Copy"}
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </main>
//           </div>

//           {/* Comments (UI ONLY CHANGED) */}
//           <div className="px-5 pb-5">
//             <div className="rounded-xl border bg-gray-50">
//               <div className="border-b px-4 py-2.5">
//                 <h4 className="text-[13px] font-semibold">Comments</h4>
//               </div>
//               <div className="px-4 py-3">
//                 <div className="mb-2 flex gap-2">
//                   <Pill
//                     active={commentTab === "all"}
//                     onClick={() => setCommentTab("all")}
//                     label="All"
//                   />
//                   <Pill
//                     active={commentTab === "add"}
//                     onClick={() => setCommentTab("add")}
//                     label="Add New"
//                   />
//                 </div>

//                 {commentTab === "all" ? (
//                   <div className="rounded-lg border bg-white px-3 py-2 text-sm max-h-24 overflow-y-auto" style={{maxHeight:'6rem',overflowY:'auto'}}>
//                     {loadingComments ? (
//                       <div className="text-center text-gray-500">
//                         Loading comments...
//                       </div>
//                     ) : commentsList?.length ? (
//                       commentsList.map((c, idx) => {
//                         const id = getCommentId(c, idx);
//                         const text = c.comment_text || c.text || c.html || "";
//                         // Relative time (e.g. '6 seconds ago')
//                         function getRelativeTime(dateString) {
//                           if (!dateString) return '';
//                           const now = new Date();
//                           const then = new Date(dateString);
//                           const diff = Math.floor((now - then) / 1000);
//                           if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
//                           if (diff < 3600) {
//                             const min = Math.floor(diff / 60);
//                             return `${min} minute${min !== 1 ? 's' : ''} ago`;
//                           }
//                           if (diff < 86400) {
//                             const hr = Math.floor(diff / 3600);
//                             return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
//                           }
//                           const days = Math.floor(diff / 86400);
//                           return `${days} day${days !== 1 ? 's' : ''} ago`;
//                         }
//                         const created = getRelativeTime(c.created_at);
//                         const isEditing = editingId === id;
//                         const createdBy = c.created_by || c.author || c.username || "";
//                         const createdByFull =
//                           c.created_by_full ||
//                           c.created_by ||
//                           c.author ||
//                           c.username ||
//                           "";
//                         // Trello-style: avatar, author, timestamp, bubble, actions
//                         return (
//                           <div
//                             key={id}
//                             className="mb-1 flex items-start gap-2"
//                           >
//                             {/* Avatar */}
//                             <div className="flex-shrink-0">
//                               <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[13px] uppercase">
//                                 {createdByFull
//                                   ? createdByFull.split(' ').map(w => w[0]).join('').slice(0,2)
//                                   : 'U'}
//                               </div>
//                             </div>
//                             {/* Comment Card */}
//                             <div className="flex-1">
//                               <div className="flex items-center gap-2 mb-0.5">
//                                 <span className="font-semibold text-gray-900 text-[12px]">{createdByFull}</span>
//                                 <span className="text-xs text-gray-500 mt-0.5">{created}</span>
//                               </div>
//                               {!isEditing ? (
//                                 <div className="rounded-xl bg-gray-100 px-2 py-1 text-[13px] text-gray-900 mt-0.5" style={{minHeight:'unset'}} dangerouslySetInnerHTML={{__html: text}} />
//                               ) : (
//                                 <div className="rounded-md border mt-1">
//                                   <div className="flex items-center gap-1 border-b bg-white px-2 py-1">
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("bold")}
//                                       label="B"
//                                       bold
//                                     />
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("italic")}
//                                       label="I"
//                                       italic
//                                     />
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("underline")}
//                                       label="U"
//                                       underline
//                                     />
//                                     <ToolbarDivider />
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("insertUnorderedList")}
//                                       label="•"
//                                     />
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("insertOrderedList")}
//                                       label="1."
//                                     />
//                                     <ToolbarDivider />
//                                     <ToolbarButton
//                                       onClick={() => document.execCommand("strikeThrough")}
//                                       label="S̶"
//                                     />
//                                   </div>
//                                   <div
//                                     ref={editRef}
//                                     contentEditable
//                                     className="min-h-[90px] w-full bg-white px-3 py-2 text-[13px] outline-none"
//                                     style={{ wordBreak: "break-word" }}
//                                   />
//                                   <div className="flex justify-end gap-2 p-2">
//                                     <button
//                                       className="rounded-md px-3 py-1.5 text-[12px] bg-gray-200 hover:bg-gray-300"
//                                       onClick={() => setEditingId(null)}
//                                     >
//                                       Cancel
//                                     </button>
//                                     <button
//                                       className="rounded-md px-3 py-1.5 text-[12px] bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
//                                       onClick={() => handleSaveEdit(id)}
//                                     >
//                                       <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow">
//                                         <MdCheck className="text-white text-2xl" style={{ borderRadius: '50%' }} />
//                                       </span>
//                                       Save
//                                     </button>
//                                   </div>
//                                 </div>
//                               )}
//                               {/* Actions */}
//                               {!isEditing && (
//                                 <div className="flex gap-1 mt-0.5">
//                                   <button className="p-0.5 rounded hover:bg-gray-200" title="Like"><FaRegThumbsUp size={14} /></button>
//                                   <button className="p-0.5 rounded hover:bg-gray-200" title="Emoji"><FaRegSmile size={14} /></button>
//                                   <button
//                                     className="text-xs text-gray-700 hover:underline font-medium px-1"
//                                     style={{minWidth:28}}
//                                     title="Reply"
//                                     onClick={() => {
//                                       setCommentTab("add");
//                                       setTimeout(() => {
//                                         if (editorRef.current) {
//                                           editorRef.current.innerText = `@${createdByFull || createdBy || ""} `;
//                                           focusCommentEditor();
//                                         }
//                                       }, 0);
//                                     }}
//                                   >
//                                     Reply
//                                   </button>
//                                   <button
//                                     className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full"
//                                     title="Edit"
//                                     onClick={() => {
//                                       setEditingId(id);
//                                       setTimeout(() => {
//                                         if (editRef.current) {
//                                           editRef.current.innerText = text;
//                                           editRef.current.focus();
//                                         }
//                                       }, 0);
//                                     }}
//                                   >
//                                     <MdEdit size={14} />
//                                   </button>
//                                   <button
//                                     className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full"
//                                     title="Delete"
//                                     onClick={() => handleDeleteComment(id)}
//                                   >
//                                     <MdDelete size={14} />
//                                   </button>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="text-center text-gray-500">
//                         No comments yet.
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="rounded-lg border bg-white">
//                     <div className="flex items-center gap-1 border-b bg-white px-2 py-1">
//                       <ToolbarButton
//                         onClick={() => exec("bold")}
//                         label="B"
//                         bold
//                       />
//                       <ToolbarButton
//                         onClick={() => exec("italic")}
//                         label="I"
//                         italic
//                       />
//                       <ToolbarButton
//                         onClick={() => exec("underline")}
//                         label="U"
//                         underline
//                       />
//                       <ToolbarDivider />
//                       <ToolbarButton
//                         onClick={() => exec("insertUnorderedList")}
//                         label="•"
//                       />
//                       <ToolbarButton
//                         onClick={() => exec("insertOrderedList")}
//                         label="1."
//                       />
//                       <ToolbarDivider />
//                       <ToolbarButton
//                         onClick={() => exec("strikeThrough")}
//                         label="S̶"
//                       />
//                     </div>

//                     <div className="px-2 py-2">
//                       <div
//                         ref={editorRef}
//                         contentEditable
//                         className="min-h-[130px] w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:border-blue-500 bg-gray-50"
//                         style={{ wordBreak: "break-word" }}
//                         data-placeholder="Add a comment..."
//                         onInput={() => {}}
//                       />
//                     </div>

//                     <div className="flex justify-start gap-2 px-2 pb-3" style={{position:'relative', zIndex:2}}>
//                       <button
//                         type="button"
//                         disabled={savingComment}
//                         onClick={handleAddComment}
//                         className="rounded-md bg-blue-600 px-4 py-2 text-[12.5px] font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-60"
//                       >
//                         {savingComment ? "Saving..." : "Submit"}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//           {/* /Comments */}
//         </div>
//       </div>
//     </DndContext>
//   );
// }

// /* ========== UI atoms ========== */
// function SectionHeader({ title, iconKey }) {
//   const IconComponent = iconKey ? sectionIcons[iconKey] : null;
//   return (
//     <>
//       <div className="mb-1.5 flex items-center gap-2">
//         {IconComponent ? (
//           <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-black">
//             {createElement(IconComponent, { size: 14 })}
//           </span>
//         ) : null}
//         <span className="text-[13px] font-semibold text-black">{title}</span>
//       </div>
//       <div className="mb-3 h-px w-full bg-gray-200" />
//     </>
//   );
// }
// function Column({ children }) {
//   return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
// }

// function EmptyState({ message }) {
//   return (
//     <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-[12.5px] text-gray-500">
//       {message}
//     </div>
//   );
// }

// function CardInfoRow({ label, value }) {
//   return (
//     <div className="flex items-center justify-between border-b border-gray-200 py-1 text-[12px] last:border-b-0">
//       <span className="font-medium text-gray-600">{label}:</span>
//       <span className="text-gray-900">{value ?? "-"}</span>
//     </div>
//   );
// }
// function Strip({ label, value, icon, isLink = false }) {
//   const display = value ?? "N/A";
//   let content = display;

//   if (!isValidElement(display)) {
//     content =
//       isLink && display !== "N/A" ? (
//         <a href={`tel:${display}`} className="text-[12px] text-blue-600 hover:text-blue-700 underline">
//           {display}
//         </a>
//       ) : (
//         <span className="text-[12px] text-gray-900">{display}</span>
//       );
//   }

//   return (
//     <div className="flex flex-col gap-1">
//       <label className="text-[10px] font-semibold text-gray-700 mb-0.5">
//         {label}
//       </label>
//       <div className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[12px] text-gray-900 min-h-[32px] flex items-center">
//         {content}
//       </div>
//     </div>
//   );
// }
// function Pill({ active, onClick, label }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={[
//         "rounded-full px-2.5 py-1 text-[11.5px]",
//         active
//           ? "bg-gray-200 text-gray-900"
//           : "bg-gray-100 text-gray-700 hover:bg-gray-200",
//       ].join(" ")}
//     >
//       {label}
//     </button>
//   );
// }
// function MenuBtn({ label, onClick }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="block w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
//     >
//       {label}
//     </button>
//   );
// }

// // small toolbar atoms for the comment editor
// function ToolbarButton({ onClick, label, bold, italic, underline }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={[
//         "px-2 py-1 text-xs rounded hover:bg-gray-100",
//         bold ? "font-bold" : "",
//         italic ? "italic" : "",
//         underline ? "underline" : "",
//       ].join(" ")}
//     >
//       {label}
//     </button>
//   );
// }
// function ToolbarDivider() {
//   return <span className="mx-2 h-4 w-px bg-gray-200 inline-block" />;
// }

// export default EditLeadModal;
