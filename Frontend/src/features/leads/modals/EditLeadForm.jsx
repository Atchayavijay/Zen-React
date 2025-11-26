import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

import Swal from "sweetalert2";

import apiClient from "@shared/api/client";

import { endpoints } from "@shared/api/endpoints";

import courseService from "@shared/services/courses/courseService";

import lookupService from "@shared/services/lookups/lookupService";

import { MdCheck, MdEdit, MdDelete } from "react-icons/md";

import { FaRegThumbsUp, FaThumbsUp, FaRegSmile, FaEllipsisV } from "react-icons/fa";

const FIELD_LABELS = {
  name: "Name",
  mobile_number: "Mobile Number",
  email: "Email",
  role_id: "Role",
  college_company: "College/Company",
  location: "Location",
  source_id: "Source",
  referred_by: "Referred By",
  meta_campaign_id: "Meta Campaign",
  status: "Status",
  course_type: "Course Type",
  course_id: "Course",
  batch_id: "Batch",
  user_id: "Assigned To",
  unit_id: "Business Unit",
  card_type_id: "Card Type",
  course_structure: "Course Structure",
  trainer_id: "Trainer",
  training_status: "Training Status",
  training_start_date: "Training Start Date",
  training_end_date: "Training End Date",
  trainer_share: "Trainer Share (%)",
  trainer_share_amount: "Trainer Share Amount",
  amount_paid_trainer: "Amount Paid to Trainer",
  pending_amount: "Pending Amount",
  actual_fee: "Actual Fee",
  discounted_fee: "Discounted Fee",
  fee_paid: "Fee Paid",
  fee_balance: "Fee Balance",
  paid_status: "Paid Status",
  placement_fee: "Placement Actual Fee",
  placement_discounted_fee: "Placement Discounted Fee",
  placement_paid: "Placement Paid",
  placement_balance: "Placement Balance",
  placement_paid_status: "Placement Paid Status",
};

const REQUIRED_FIELDS = new Set([
  "name",
  "mobile_number",
  "source_id",
  "status",
  "course_type",
  "course_id",
  "user_id",
  "unit_id",
  "card_type_id",
  "course_structure",
]);


const STEPS = [

  { label: "Basic Info" },

  { label: "Course Info" },

  { label: "Payment Info" },

  { label: "Trainer & Training" },

];



const STATUS_OPTIONS = [

  { value: "enquiry", label: "Enquiry" },

  { value: "prospect", label: "Prospect" },

  { value: "enrollment", label: "Enrollment" },

  { value: "trainingprogress", label: "Training Progress" },

  { value: "handsonproject", label: "Hands on Project" },

  { value: "certification", label: "Certification" },

  { value: "cvbuild", label: "CV Build" },

  { value: "mockinterviews", label: "Mock Interviews" },

  { value: "liveinterviews", label: "Live Interviews" },

  { value: "placement", label: "Placement" },

];


const STATUS_PRIORITY = STATUS_OPTIONS.reduce((acc, option, index) => {
  acc[String(option.value).toLowerCase()] = index;
  return acc;
}, {});


const TRAINING_STATUS_OPTIONS = [

  { value: "nottaken", label: "Not Taken" },

  { value: "scheduled", label: "Scheduled" },

  { value: "in_progress", label: "In Progress" },

  { value: "onhold", label: "On Hold" },

  { value: "completed", label: "Completed" },

];



const COUNTRY_CODES = [

  { value: "+91", label: "+91 (India)" },

  { value: "+1", label: "+1 (USA)" },

  { value: "+44", label: "+44 (UK)" },

  { value: "+61", label: "+61 (AUS)" },

  { value: "manual", label: "Manual Entry" },

];




const toIntOrNull = (val) => {
  if (val === null || val === undefined || String(val).trim() === "" || String(val) === "undefined") return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const toFloatOrZero = (val) => {
  if (val === null || val === undefined || String(val).trim() === "") return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeTrainingStatusValue = (val) => {
  if (!val) return "nottaken";
  const normalized = String(val).toLowerCase().replace(/[^a-z0-9]/g, "");
  // Map common variations to standard values
  if (normalized === "inprogress") return "in_progress";
  if (normalized === "notstarted") return "nottaken";
  return normalized || "nottaken";
};

const EditLeadForm = ({ open, onClose, leadId, onSaved }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState(null);

  // Editing state for inline editing

  const [editingField, setEditingField] = useState(null);

  const [editValue, setEditValue] = useState("");



  // Dropdown Data

  const [courseTypes, setCourseTypes] = useState([]);

  const [courses, setCourses] = useState([]);

  const [trainers, setTrainers] = useState([]);

  const [batches, setBatches] = useState([]);

  const [assignees, setAssignees] = useState([]);

  const [units, setUnits] = useState([]);

  const [cardTypes, setCardTypes] = useState([]);

  const [sources, setSources] = useState([]);

  const [roles, setRoles] = useState([]);

  const [metaCampaigns, setMetaCampaigns] = useState([]);


  // Card Type IDs mapping

  const [cardTypeIds, setCardTypeIds] = useState({

    TRAINING: null,

    PLACEMENT: null,

    BOTH: null,

  });



  // Comments state

  const [commentTab, setCommentTab] = useState("all");

  const [commentsList, setCommentsList] = useState([]);

  const [loadingComments, setLoadingComments] = useState(false);

  const [savingComment, setSavingComment] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [optionsOpen, setOptionsOpen] = useState(false);

  const [commentLikes, setCommentLikes] = useState({}); // { commentId: [user1, user2, ...] }
  const [commentReactions, setCommentReactions] = useState({}); // { commentId: { emoji: [user1, user2, ...] } }
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // commentId or null
  const editorRef = useRef(null);

  const editRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const [subCourseList, setSubCourseList] = useState([]);
  const [availableSubCourses, setAvailableSubCourses] = useState([]);
  const [savingSubCourses, setSavingSubCourses] = useState(false);
  const [inlineErrors, setInlineErrors] = useState({});
  const [editingMeta, setEditingMeta] = useState({
    label: "",
    required: false,
  });
  const baseTrainingFee = useMemo(() => {
    const discounted = parseFloat(leadData?.discounted_fee);
    if (Number.isFinite(discounted) && discounted > 0) return discounted;
    const actual = parseFloat(leadData?.actual_fee);
    return Number.isFinite(actual) && actual > 0 ? actual : 0;
  }, [leadData?.discounted_fee, leadData?.actual_fee]);

  const notifyLeadUpdated = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zen:leadUpdated"));
      }
    } catch (err) {
      console.warn("Unable to dispatch lead update event", err);
    }
  }, []);

  const showToast = useCallback(
    (options = {}) => {
      const {
        icon = "success",
        title = "",
        text = "",
        timer = 2000,
      } = options;
      Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        text,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
      });
    },
    []
  );

  // Check if source is Referral
  const sourceFlags = useMemo(() => {
    if (!leadData || !sources.length) {
      return { isReferralSource: false, isMetaAdsSource: false };
    }
    const rawSourceId = leadData.source_id;
    let sourceId = "";
    if (rawSourceId === null || rawSourceId === undefined) {
      sourceId = "";
    } else if (typeof rawSourceId === "object" && rawSourceId !== null) {
      sourceId = rawSourceId.id || rawSourceId.value || rawSourceId.name || "";
    } else {
      sourceId = rawSourceId;
    }
    const normalizedName = (sources.find(
      (s) => String(s.id || s.value || "").toLowerCase() === String(sourceId).toLowerCase()
    )?.name || "").toLowerCase();
    const isReferralSource = normalizedName === "referral";
    const isMetaAdsSource =
      normalizedName === "meta ad" ||
      normalizedName === "meta ads" ||
      normalizedName === "metaad" ||
      normalizedName === "metaads";
    return { isReferralSource, isMetaAdsSource };
  }, [leadData, sources]);
  const isReferralSource = sourceFlags.isReferralSource;
  const isMetaAdsSource = sourceFlags.isMetaAdsSource;

  // Show Enrollment ID when lead reaches Enrollment (or later) or already has ID
  const showEnrollmentId = useMemo(() => {
    if (!leadData) return false;
    const enrollmentId = leadData.enrollment_id;
    const hasEnrollmentId =
      typeof enrollmentId === "string"
        ? enrollmentId.trim() !== ""
        : enrollmentId !== null && enrollmentId !== undefined;

    if (hasEnrollmentId) return true;

    const rawStatus = leadData.status;
    let statusValue = "";
    if (rawStatus === null || rawStatus === undefined) {
      statusValue = "";
    } else if (typeof rawStatus === "object" && rawStatus !== null) {
      statusValue =
        rawStatus.value ||
        rawStatus.id ||
        rawStatus.name ||
        rawStatus.status ||
        "";
    } else {
      statusValue = rawStatus;
    }

    const normalizedStatus = String(statusValue).toLowerCase();
    const currentRank = STATUS_PRIORITY[normalizedStatus];
    const enrollmentRank = STATUS_PRIORITY["enrollment"];

    if (typeof enrollmentRank !== "number") {
      return false;
    }

    if (typeof currentRank !== "number") {
      return false;
    }

    return currentRank >= enrollmentRank;
  }, [leadData]);




  // Fetch lead data

  useEffect(() => {

    if (!open || !leadId) return;



    const fetchLead = async () => {

      setLoading(true);

      try {

        const response = await apiClient.get(`${endpoints.leads.root}/${leadId}`);

        setLeadData(response.data);

      } catch (error) {

        console.error("Error fetching lead:", JSON.stringify(error?.message || "Unknown error"));

        showToast({
          icon: "error",
          title: "Error",
          text: "Failed to load lead data",
        });
      } finally {

        setLoading(false);

      }

    };



    fetchLead();

  }, [open, leadId]);


  const fetchMetaCampaigns = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.metaCampaigns.apiRoot);
      setMetaCampaigns(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching meta campaigns:", error?.message || "Unknown error");
      setMetaCampaigns([]);
    }
  }, []);


  // Fetch dropdown data

  useEffect(() => {

    if (!open) {
      setMetaCampaigns([]);
      return;
    }


    const fetchAllData = async () => {

      try {

        const [

          courseTypesRes,

          coursesRes,

          trainersRes,

          batchesRes,

          assigneesRes,

          unitsRes,

          cardTypesRes,

          sourcesRes,

          rolesRes,

        ] = await Promise.all([

          courseService.getCourseTypes(),

          courseService.getCourses(),

          lookupService.getTrainers(),

          lookupService.getBatches(),

          lookupService.getAssignees(),

          lookupService.getUnits(),

          lookupService.getCardTypes(),

          lookupService.getSources(),

          lookupService.getRoles(),

        ]);



        if (courseTypesRes?.success) {

          const courseTypesData = courseTypesRes.data || [];

          const normalizedCourseTypes = courseTypesData.map((ct) => {

            if (typeof ct === "string") {

              return { id: ct, name: ct, course_type: ct };

            }

            return {

              id: ct.id || ct.course_type || ct,

              name: ct.name || ct.course_type || String(ct),

              course_type: ct.course_type || ct.name || ct,

            };

          });

          setCourseTypes(normalizedCourseTypes);

        }



        if (coursesRes?.success) {

          const coursesData = coursesRes.data || [];

          let rawCourses = coursesData;

          if (coursesData.courses && Array.isArray(coursesData.courses)) {

            rawCourses = coursesData.courses;

          } else if (coursesData.data && Array.isArray(coursesData.data)) {

            rawCourses = coursesData.data;

          }

          const normalizedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map((c) => ({

            course_id: c.course_id || c.id || c._id,

            id: c.course_id || c.id || c._id,

            course_name: c.course_name || c.name || c.title || String(c.course_id || c.id),

            name: c.course_name || c.name || c.title || String(c.course_id || c.id),

            course_type: c.course_type || c.courseType || c.type || "",

            _raw: c,

          }));

          setCourses(normalizedCourses);

        }



        if (trainersRes?.success) setTrainers(trainersRes.data || []);

        if (batchesRes?.success) setBatches(batchesRes.data || []);

        if (assigneesRes?.success) setAssignees(assigneesRes.data || []);

        if (unitsRes?.success) setUnits(unitsRes.data || []);

        if (cardTypesRes?.success) {

          const cardTypesData = cardTypesRes.data || [];

          setCardTypes(cardTypesData);



          // Build card type IDs mapping

          const ids = { TRAINING: null, PLACEMENT: null, BOTH: null };

          cardTypesData.forEach((card) => {

            const label = String(card.name || "").toLowerCase();

            if (label.includes("training") && label.includes("placement")) {

              ids.BOTH = card.id;

            } else if (label === "training only") {

              ids.TRAINING = card.id;

            } else if (label === "placement only") {

              ids.PLACEMENT = card.id;

            }

          });

          setCardTypeIds(ids);

        }

        if (sourcesRes?.success) setSources(sourcesRes.data || []);

        if (rolesRes?.success) setRoles(rolesRes.data || []);

      } catch (error) {

        console.error("Error fetching dropdown data:", error?.message || "Unknown error");

      }

    };



    fetchAllData();

  }, [open]);


  useEffect(() => {
    if (open && isMetaAdsSource) {
      fetchMetaCampaigns();
    } else {
      setMetaCampaigns([]);
    }
  }, [fetchMetaCampaigns, isMetaAdsSource, open]);

  const autoFillSubCourseAmounts = useCallback(
    (list = []) =>
      list.map((sub) => {
        const sharePercent = parseFloat(sub.trainer_share) || 0;
        const paidAmount = parseFloat(sub.amount_paid_trainer) || 0;
        let shareAmount = sub.trainer_share_amount ?? "";
        if (baseTrainingFee > 0 && sharePercent > 0) {
          shareAmount = ((baseTrainingFee * sharePercent) / 100).toFixed(2);
        }
        let pendingAmount = sub.pending_amount ?? "";
        if (
          shareAmount !== "" &&
          shareAmount !== null &&
          !Number.isNaN(parseFloat(shareAmount))
        ) {
          pendingAmount = (parseFloat(shareAmount) - paidAmount).toFixed(2);
        }
        return {
          ...sub,
          trainer_share_amount: shareAmount === null ? "" : shareAmount,
          pending_amount: pendingAmount === null ? "" : pendingAmount,
        };
      }),
    [baseTrainingFee]
  );

  // Sync sub-course list from lead data when editing an existing record
  useEffect(() => {
    if (
      leadData &&
      leadData.course_structure &&
      String(leadData.course_structure).toLowerCase().startsWith("multiple") &&
      Array.isArray(leadData.sub_courses)
    ) {
      const mapped = leadData.sub_courses.map((sub, idx) => ({
        tempId: sub.sub_course_id || sub.id || `existing-${idx}`,
        sub_course_id: sub.sub_course_id || sub.id || "",
        sub_course_name: sub.sub_course_name || sub.name || "",
        trainer_id: sub.trainer_id || sub.trainerId || "",
        trainer_share: sub.trainer_share ?? "",
        trainer_share_amount: sub.trainer_share_amount ?? "",
        amount_paid_trainer:
          sub.amount_paid_trainer ??
          sub.amount_paid ??
          sub.amount_paid_to_trainer ??
          "",
        pending_amount: sub.pending_amount ?? "",
        training_status: sub.training_status || "nottaken",
        training_start_date: sub.training_start_date || "",
        training_end_date: sub.training_end_date || "",
      }));
      setSubCourseList(autoFillSubCourseAmounts(mapped));
    } else {
      setSubCourseList([]);
    }
  }, [autoFillSubCourseAmounts, leadData?.course_structure, leadData?.sub_courses]);

  // Fetch available sub-courses when lead course changes
  useEffect(() => {
    if (!leadData?.course_id) {
      setAvailableSubCourses([]);
      return;
    }

    let cancelled = false;
    const fetchSubCoursesForLead = async () => {
      try {
        const response = await apiClient.get(endpoints.courses.subCourses, {
          params: { course_id: leadData.course_id },
        });
        if (!cancelled) {
          setAvailableSubCourses(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching sub-courses:", error);
          setAvailableSubCourses([]);
        }
      }
    };

    fetchSubCoursesForLead();
    return () => {
      cancelled = true;
    };
  }, [leadData?.course_id]);


  // Handle field edit

  const handleStartEdit = (field, value, meta = {}) => {
    setEditingField(field);

    setEditingMeta({
      label: meta.label || FIELD_LABELS[field] || field,
      required:
        typeof meta.required === "boolean"
          ? meta.required
          : REQUIRED_FIELDS.has(field),
    });
    setEditValue(value ?? "");
    setInlineErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };



  const handleCancelEdit = () => {

    setInlineErrors((prev) => {
      if (!prev[editingField]) return prev;
      const next = { ...prev };
      delete next[editingField];
      return next;
    });
    setEditingField(null);

    setEditingMeta({
      label: "",
      required: false,
    });
    setEditValue("");

  };



  const handleSaveEdit = async () => {

    if (!editingField) return;


    const trimmedValue =
      typeof editValue === "string" ? editValue.trim() : editValue;
    const fieldLabel =
      editingMeta.label || FIELD_LABELS[editingField] || "Field";
    const isEmpty =
      trimmedValue === "" || trimmedValue === null || trimmedValue === undefined;
    if (isEmpty) {
      setInlineErrors((prev) => ({
        ...prev,
        [editingField]: `${fieldLabel} cannot be empty.`,
      }));
      return;
    }


    try {

      let updatedLead = {

        ...leadData,

        [editingField]: editValue,

      };



      // Auto-calculate Training Fee Balance

      if (editingField === "discounted_fee" || editingField === "fee_paid") {

        const discount = parseFloat(editingField === "discounted_fee" ? editValue : leadData.discounted_fee) || 0;

        const paid = parseFloat(editingField === "fee_paid" ? editValue : leadData.fee_paid) || 0;

        updatedLead.fee_balance = discount - paid;

      }



      // Auto-calculate Placement Fee Balance

      if (editingField === "placement_discounted_fee" || editingField === "placement_paid") {

        const discount = parseFloat(editingField === "placement_discounted_fee" ? editValue : leadData.placement_discounted_fee) || 0;

        const paid = parseFloat(editingField === "placement_paid" ? editValue : leadData.placement_paid) || 0;

        updatedLead.placement_balance = discount - paid;

      }



      // Auto-calculate Trainer Share Amount and Pending Amount (Single Course)

      if (editingField === "trainer_share" || editingField === "amount_paid_trainer") {

        const discountedFee = parseFloat(leadData.discounted_fee) || 0;



        let sharePercent = parseFloat(leadData.trainer_share) || 0;

        if (editingField === "trainer_share") {

          sharePercent = parseFloat(editValue) || 0;

        }



        // Calculate Share Amount

        const shareAmount = (discountedFee * sharePercent) / 100;

        updatedLead.trainer_share_amount = shareAmount;

        updatedLead.trainer_share = sharePercent; // Ensure percentage is updated



        // Calculate Pending Amount

        let paidAmount = parseFloat(leadData.amount_paid_trainer) || 0;

        if (editingField === "amount_paid_trainer") {

          paidAmount = parseFloat(editValue) || 0;

        }



        updatedLead.pending_amount = shareAmount - paidAmount;

      }



      await apiClient.put(`${endpoints.leads.root}/${leadId}`, updatedLead);



      setLeadData(updatedLead);

      setInlineErrors((prev) => {
        if (!prev[editingField]) return prev;
        const next = { ...prev };
        delete next[editingField];
        return next;
      });
      setEditingField(null);

      setEditingMeta({
        label: "",
        required: false,
      });
      setEditValue("");



      showToast({
        icon: "success",

        title: `${fieldLabel} updated`,
      });

      notifyLeadUpdated();
    } catch (error) {

      console.error("Error updating field:", error?.message || "Unknown error");

      setInlineErrors((prev) => ({
        ...prev,
        [editingField]:
          `${fieldLabel} could not be updated.`,
      }));
      showToast({
        icon: "error",
        title: "Error",
        text: `Failed to update ${fieldLabel}.`,
      });
    }
  };

  const normalizeTrainingStatusValue = (status) => {
    const normalized = String(status || "").toLowerCase();
    const allowedValues = TRAINING_STATUS_OPTIONS.map((opt) => opt.value);
    return allowedValues.includes(normalized) ? normalized : "nottaken";
  };

  const toFloatOrZero = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toIntOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  };

  const normalizedCourseStructure = useMemo(() => {
    if (!leadData) return "";
    const raw = leadData.course_structure;
    if (typeof raw === "string") return raw.toLowerCase();
    if (typeof raw === "object" && raw !== null) {
      const descriptive =
        raw.name ||
        raw.label ||
        raw.value ||
        raw.course_structure ||
        raw.courseStructure ||
        raw.title ||
        raw.text;
      if (descriptive) return String(descriptive).toLowerCase();
      if (raw.id) return String(raw.id).toLowerCase();
    }
    return String(raw || "").toLowerCase();
  }, [leadData?.course_structure]);


  // Helper to safely extract value (handle objects from backend)

  const extractValue = (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return "";
    if (typeof fieldValue === "object" && fieldValue !== null) {
      // Handle object values - try common ID fields
      return fieldValue.id || fieldValue.value || fieldValue.name || "";
    }
    return fieldValue;
  };

  const hasValue = useCallback(
    (field) => {
      if (!leadData) return false;
      const raw = leadData[field];
      const normalized = extractValue(raw);
      if (normalized === null || normalized === undefined) return false;
      if (typeof normalized === "string") return normalized.trim() !== "";
      return true;
    },
    [leadData]
  );



  // Render inline editable field

  const renderField = (
    field,
    label,
    type = "text",
    options = null,
    config = {}
  ) => {
    if (!leadData) return null;



    const rawValue = leadData[field];

    const value = extractValue(rawValue);

    const isEditing = editingField === field;

    const { readOnly = false } = config;
    const configuredRequired = config.required;
    const isRequired =
      typeof configuredRequired === "boolean"
        ? configuredRequired
        : REQUIRED_FIELDS.has(field);
    const fieldError = inlineErrors[field];


    if (isEditing) {

      return (

        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center gap-2">

            {type === "select" ? (

              <select

                value={editValue}

                onChange={(e) => {
                  setEditValue(e.target.value);
                  if (inlineErrors[field]) {
                    setInlineErrors((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    });
                  }
                }}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs focus:outline-none ${fieldError
                    ? "border border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                    : "border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  } ${readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                autoFocus

                disabled={readOnly}
              >

                <option value="">{`Select ${label}`}</option>
                {options?.map((opt) => {

                  const optId =
                    opt.id ||
                    opt.value ||
                    opt.campaign_id ||
                    opt.batch_id ||
                    opt.trainer_id ||
                    opt.user_id;
                  const optName =
                    opt.name ||
                    opt.label ||
                    opt.campaign_name ||
                    opt.batch_name ||
                    opt.trainer_name ||
                    opt.username;
                  return (

                    <option key={optId} value={optId}>

                      {optName}

                    </option>

                  );

                })}

              </select>

            ) : (

              <input

                type={type}

                value={editValue}

                onChange={(e) => {
                  setEditValue(e.target.value);
                  if (inlineErrors[field]) {
                    setInlineErrors((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    });
                  }
                }}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs focus:outline-none ${fieldError
                    ? "border border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                    : "border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  } ${readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                autoFocus

                readOnly={readOnly}
                onKeyDown={(e) => {

                  if (e.key === "Enter") handleSaveEdit();

                  if (e.key === "Escape") handleCancelEdit();

                }}

              />

            )}

            <button

              onClick={handleSaveEdit}

              className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={readOnly}
              title="Save"
            >

              <MdCheck size={16} />

            </button>

            <button

              onClick={handleCancelEdit}

              className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"

              title="Cancel"
            >

              ×

            </button>

          </div>
          {fieldError && (
            <p className="text-[11px] text-red-600">{fieldError}</p>
          )}
        </div>

      );

    }



    // Display value - safely convert to string

    let displayValue = "";

    try {

      if (type === "select" && options && value) {

        // Find option with flexible field name matching

        const option = options.find((o) => {

          const optId =
            o.id ||
            o.value ||
            o.campaign_id ||
            o.batch_id ||
            o.trainer_id ||
            o.user_id;
          return String(optId) === String(value);

        });

        if (option) {

          displayValue =
            option.name ||
            option.label ||
            option.campaign_name ||
            option.batch_name ||
            option.trainer_name ||
            option.username ||
            String(value);
        } else {

          displayValue = String(value || "");

        }

      } else {

        displayValue = value !== null && value !== undefined ? String(value) : "";

      }

    } catch (err) {

      displayValue = "-";

    }



    return (

      <div

        onClick={() =>
          !readOnly &&
          handleStartEdit(field, value, { label, required: isRequired })
        }
        className={`group min-h-[32px] w-full rounded-md border px-2.5 py-1.5 text-xs flex items-center justify-between ${readOnly
            ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            : "border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
          }`}
      >

        <span className="text-gray-700">

          {displayValue || "-"}

        </span>

      </div>

    );

  };



  const validateMandatoryFields = useCallback(() => {
    if (!leadData) return false;

    const missingKeys = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (!hasValue(field)) {
        missingKeys.push(field);
      }
    });

    if (isMetaAdsSource && !hasValue("meta_campaign_id")) {
      missingKeys.push("meta_campaign_id");
    }

    const showSingleValidations =
      normalizedCourseStructure === "single" ||
      normalizedCourseStructure.startsWith("single ");
    const showMultiValidations =
      normalizedCourseStructure === "multiple" ||
      normalizedCourseStructure === "multi" ||
      normalizedCourseStructure.startsWith("multiple ");

    if (showSingleValidations) {
      if (!hasValue("trainer_id")) missingKeys.push("trainer_id");
      if (!hasValue("trainer_share")) missingKeys.push("trainer_share");
    }

    const additionalIssues = [];
    if (showMultiValidations) {
      if (!subCourseList.length) {
        additionalIssues.push("Add at least one sub-course with trainer details.");
      } else {
        const invalidRows = subCourseList.reduce((acc, sub, idx) => {
          const hasSubCourse = String(sub.sub_course_id || "").trim() !== "";
          const hasTrainer = String(sub.trainer_id || "").trim() !== "";
          if (!hasSubCourse || !hasTrainer) acc.push(idx + 1);
          return acc;
        }, []);
        if (invalidRows.length) {
          additionalIssues.push(
            `Sub-course row${invalidRows.length > 1 ? "s" : ""} ${invalidRows.join(
              ", "
            )} missing Sub-course or Trainer.`
          );
        }
      }
    }

    if (missingKeys.length || additionalIssues.length) {
      setInlineErrors((prev) => {
        const next = { ...prev };
        missingKeys.forEach((key) => {
          next[key] = `${FIELD_LABELS[key] || key} is required.`;
        });
        if (showMultiValidations && !subCourseList.length) {
          next.course_structure = "Add at least one sub-course.";
        }
        return next;
      });

      const labels = missingKeys.map((key) => FIELD_LABELS[key] || key);
      const formattedList =
        labels.length <= 3
          ? labels.join(", ")
          : `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;

      const toastMessage = [formattedList, ...additionalIssues]
        .filter(Boolean)
        .join(" • ");

      showToast({
        icon: "warning",
        title: "Missing required fields",
        text: toastMessage || "Fill all mandatory inputs.",
      });
      return false;
    }

    return true;
  }, [
    hasValue,
    isMetaAdsSource,
    leadData,
    normalizedCourseStructure,
    setInlineErrors,
    showToast,
    subCourseList,
  ]);

  const validateStep = useCallback(
    (stepIndex) => {
      if (!leadData) return false;

      const stepMissing = [];
      const additionalIssues = [];

      if (stepIndex === 0) {
        ["name", "mobile_number", "source_id", "status"].forEach((field) => {
          if (!hasValue(field)) stepMissing.push(field);
        });
        if (isMetaAdsSource && !hasValue("meta_campaign_id")) {
          stepMissing.push("meta_campaign_id");
        }
      } else if (stepIndex === 1) {
        [
          "course_type",
          "course_id",
          "user_id",
          "unit_id",
          "card_type_id",
          "course_structure",
        ].forEach((field) => {
          if (!hasValue(field)) stepMissing.push(field);
        });
      } else if (stepIndex === 3) {
        const showSingleValidations =
          normalizedCourseStructure === "single" ||
          normalizedCourseStructure.startsWith("single ");
        const showMultiValidations =
          normalizedCourseStructure === "multiple" ||
          normalizedCourseStructure === "multi" ||
          normalizedCourseStructure.startsWith("multiple ");

        if (showSingleValidations) {
          if (!hasValue("trainer_id")) stepMissing.push("trainer_id");
          if (!hasValue("trainer_share")) stepMissing.push("trainer_share");
        }

        if (showMultiValidations) {
          if (!subCourseList.length) {
            additionalIssues.push("Add at least one sub-course with trainer.");
          } else {
            const invalidRows = subCourseList.reduce((acc, sub, idx) => {
              const hasSubCourse = String(sub.sub_course_id || "").trim() !== "";
              const hasTrainer = String(sub.trainer_id || "").trim() !== "";
              if (!hasSubCourse || !hasTrainer) acc.push(idx + 1);
              return acc;
            }, []);
            if (invalidRows.length) {
              additionalIssues.push(
                `Sub-course row${invalidRows.length > 1 ? "s" : ""} ${invalidRows.join(
                  ", "
                )} missing Sub-course or Trainer.`
              );
            }
          }
        }
      }

      if (!stepMissing.length && !additionalIssues.length) {
        return true;
      }

      setInlineErrors((prev) => {
        const next = { ...prev };
        stepMissing.forEach((key) => {
          next[key] = `${FIELD_LABELS[key] || key} is required.`;
        });
        if (
          stepIndex === 3 &&
          additionalIssues.length &&
          (normalizedCourseStructure === "multiple" ||
            normalizedCourseStructure === "multi" ||
            normalizedCourseStructure.startsWith("multiple "))
        ) {
          next.course_structure = "Fix sub-course rows before continuing.";
        }
        return next;
      });

      const labels = stepMissing.map((key) => FIELD_LABELS[key] || key);
      const formattedList =
        labels.length <= 3
          ? labels.join(", ")
          : `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
      const toastMessage = [formattedList, ...additionalIssues]
        .filter(Boolean)
        .join(" • ");

      showToast({
        icon: "warning",
        title: "Complete this step",
        text: toastMessage || "Fill required inputs before proceeding.",
      });

      return false;
    },
    [
      hasValue,
      isMetaAdsSource,
      normalizedCourseStructure,
      setInlineErrors,
      showToast,
      subCourseList,
    ]
  );

  // Read-only field (not editable)

  const renderReadOnlyField = (value, className = "") => {

    // Safely convert value to string

    let displayValue = "";

    if (value === null || value === undefined) {

      displayValue = "-";

    } else if (typeof value === "object" && value !== null) {

      displayValue = value.name || value.value || value.id || "-";

    } else {

      displayValue = String(value);

    }



    return (

      <div className={`min-h-[32px] w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs flex items-center ${className || "bg-gray-50 text-gray-600"}`}>

        {displayValue}

      </div>

    );

  };



  const formatCurrency = (value) => {

    if (!value || isNaN(parseFloat(value))) return "₹0";

    return `₹${parseFloat(value).toLocaleString("en-IN")}`;

  };



  // Fetch comments

  useEffect(() => {

    if (!open || !leadId) return;



    const fetchComments = async () => {

      setLoadingComments(true);

      try {

        const response = await apiClient.get(endpoints.leads.comments(leadId));

        setCommentsList(response.data.comments || []);

      } catch (error) {

        console.error("Error fetching comments:", error?.message || "Unknown error");

      } finally {

        setLoadingComments(false);

      }

    };



    fetchComments();

  }, [open, leadId]);


  const combinedSubCourseOptions = useMemo(() => {
    const map = new Map();
    (availableSubCourses || []).forEach((sc) => {
      if (sc?.sub_course_id !== undefined && sc?.sub_course_id !== null) {
        map.set(String(sc.sub_course_id), sc);
      }
    });
    (subCourseList || []).forEach((sc) => {
      if (
        sc?.sub_course_id &&
        !map.has(String(sc.sub_course_id))
      ) {
        map.set(String(sc.sub_course_id), {
          sub_course_id: sc.sub_course_id,
          sub_course_name: sc.sub_course_name || `Sub-course ${sc.sub_course_id}`,
        });
      }
    });
    return Array.from(map.values());
  }, [availableSubCourses, subCourseList]);

  const handleAddSubCourseRow = useCallback(() => {
    setSubCourseList((prev) => [
      ...prev,
      {
        tempId: `temp-${Date.now()}`,
        sub_course_id: "",
        sub_course_name: "",
        trainer_id: "",
        trainer_share: "",
        trainer_share_amount: "",
        amount_paid_trainer: "",
        pending_amount: "",
        training_status: "nottaken",
        training_start_date: "",
        training_end_date: "",
      },
    ]);
  }, []);

  const handleRemoveSubCourseRow = useCallback((index) => {
    setSubCourseList((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSubCourseInputChange = useCallback(
    (index, field, value) => {
      setSubCourseList((prev) =>
        autoFillSubCourseAmounts(
          prev.map((sub, idx) => {
            if (idx !== index) return sub;
            const updated = { ...sub, [field]: value };
            if (field === "sub_course_id") {
              const selected = combinedSubCourseOptions.find(
                (option) => String(option.sub_course_id) === String(value)
              );
              updated.sub_course_name =
                selected?.sub_course_name || sub.sub_course_name || "";
            }
            return updated;
          })
        )
      );
    },
    [autoFillSubCourseAmounts, combinedSubCourseOptions]
  );

  const handleSaveSubCourses = useCallback(async () => {
    if (!leadData) return;
    if (subCourseList.length === 0) {
      showToast({
        icon: "info",
        title: "Add Sub-Course",
        text: "Add at least one sub-course before saving.",
      });
      return;
    }

    const missingRequired = subCourseList.some(
      (sub) =>
        !String(sub.sub_course_id || "").trim() ||
        !String(sub.trainer_id || "").trim()
    );
    if (missingRequired) {
      showToast({
        icon: "warning",
        title: "Validation Error",
        text: "Each sub-course requires both Sub-Course and Trainer selections.",
      });
      return;
    }

    setSavingSubCourses(true);
    const displaySubCourses = autoFillSubCourseAmounts(subCourseList).map(
      (sub, idx) => {
        const selectedSubCourse = combinedSubCourseOptions.find(
          (option) => String(option.sub_course_id) === String(sub.sub_course_id)
        );
        const trainerOption = Array.isArray(trainers)
          ? trainers.find(
            (trainer) =>
              String(trainer.trainer_id || trainer.id || trainer.user_id) ===
              String(sub.trainer_id)
          )
          : null;
        return {
          ...sub,
          sub_course_name:
            selectedSubCourse?.sub_course_name ||
            subCourseList[idx]?.sub_course_name ||
            "",
          trainer_name:
            trainerOption?.trainer_name ||
            trainerOption?.name ||
            trainerOption?.username ||
            "",
        };
      }
    );
    const normalizedSubCourses = displaySubCourses.map((sub) => ({
      sub_course_id: toIntOrNull(sub.sub_course_id),
      trainer_id: toIntOrNull(sub.trainer_id),
      trainer_share: toFloatOrZero(sub.trainer_share),
      trainer_share_amount: toFloatOrZero(sub.trainer_share_amount),
      amount_paid_trainer: toFloatOrZero(sub.amount_paid_trainer),
      pending_amount: toFloatOrZero(sub.pending_amount),
      training_status: normalizeTrainingStatusValue(sub.training_status),
      training_start_date: sub.training_start_date || null,
      training_end_date: sub.training_end_date || null,
    }));

    const payload = {
      ...leadData,
      course_structure: "multiple",
      sub_courses: normalizedSubCourses,
    };

    try {
      const response = await apiClient.put(
        `${endpoints.leads.root}/${leadId}`,
        payload
      );
      const updatedLead = response?.data || {
        ...leadData,
        course_structure: "multiple",
        sub_courses: displaySubCourses,
      };
      setLeadData((prev) => ({
        ...(prev || {}),
        ...updatedLead,
        course_structure: "multiple",
        sub_courses: displaySubCourses,
      }));
      setSubCourseList((prev) =>
        prev.map((sub, idx) => ({
          ...sub,
          sub_course_name: displaySubCourses[idx]?.sub_course_name || sub.sub_course_name,
        }))
      );
      showToast({
        icon: "success",
        title: "Sub-courses updated!",
      });
      notifyLeadUpdated();
    } catch (error) {
      console.error("Error saving sub-courses:", error);
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to save sub-course changes.",
      });
    } finally {
      setSavingSubCourses(false);
    }
  }, [leadData, leadId, subCourseList]);


  // Comment functions

  const exec = (command) => {

    document.execCommand(command, false, null);

  };



  const focusCommentEditor = () => {

    if (editorRef.current) {

      editorRef.current.focus();

    }

  };



  const getCommentId = (c, idx) => {

    return c.comment_id || c.id || idx;

  };



  const handleAddComment = async () => {

    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML.trim();

    if (!html) {

      showToast({
        icon: "error",
        title: "Error",
        text: "Comment cannot be empty",
      });
      return;

    }



    setSavingComment(true);

    try {

      await apiClient.post(endpoints.leads.comments(leadId), {

        comment_text: html,

      });



      // Refresh comments

      const response = await apiClient.get(endpoints.leads.comments(leadId));

      setCommentsList(response.data.comments || []);



      // Clear editor

      editorRef.current.innerHTML = "";

      setCommentTab("all");



      showToast({
        icon: "success",

        title: "Comment Added!",

      });

    } catch (error) {

      console.error("Error adding comment:", error?.message || "Unknown error");

      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to add comment",
      });
    } finally {

      setSavingComment(false);

    }

  };



  const handleSaveCommentEdit = async (id) => {

    if (!editRef.current) return;

    const html = editRef.current.innerHTML.trim();

    if (!html) {

      showToast({
        icon: "error",
        title: "Error",
        text: "Comment cannot be empty",
      });
      return;

    }



    try {

      await apiClient.put(`/comments/${id}`, {

        comment_text: html,

      });



      // Refresh comments

      const response = await apiClient.get(endpoints.leads.comments(leadId));

      setCommentsList(response.data.comments || []);

      setEditingId(null);



      showToast({
        icon: "success",

        title: "Comment Updated!",

      });

    } catch (error) {

      console.error("Error updating comment:", error?.message || "Unknown error");

      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to update comment",
      });
    }

  };



  const handleDeleteComment = async (id) => {

    const result = await Swal.fire({

      title: "Delete Comment?",

      text: "This action cannot be undone",

      icon: "warning",

      showCancelButton: true,

      confirmButtonColor: "#d33",

      cancelButtonColor: "#3085d6",

      confirmButtonText: "Yes, delete it!",

    });



    if (result.isConfirmed) {

      try {

        await apiClient.delete(`/comments/${id}`);



        // Refresh comments

        const response = await apiClient.get(endpoints.leads.comments(leadId));

        setCommentsList(response.data.comments || []);



        showToast({
          icon: "success",

          title: "Deleted!",

        });

      } catch (error) {

        console.error("Error deleting comment:", error?.message || "Unknown error");

        showToast({
          icon: "error",
          title: "Error",
          text: "Failed to delete comment",
        });
      }

    }

  };



  const getRelativeTime = (dateString) => {

    if (!dateString) return "";

    const now = new Date();

    const then = new Date(dateString);

    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;

    if (diff < 3600) {

      const min = Math.floor(diff / 60);

      return `${min} minute${min !== 1 ? "s" : ""} ago`;

    }

    if (diff < 86400) {

      const hr = Math.floor(diff / 3600);

      return `${hr} hour${hr !== 1 ? "s" : ""} ago`;

    }

    const days = Math.floor(diff / 86400);

    return `${days} day${days !== 1 ? "s" : ""} ago`;

  };


  // Get current user (you can get this from auth context or localStorage)
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.username || user.name || "current_user";
      }
    } catch (e) {
      console.warn("Could not get current user", e);
    }
    return "current_user";
  };

  // Handle like toggle
  const handleToggleLike = useCallback((commentId) => {
    setCommentLikes((prev) => {
      const newLikes = { ...prev };
      if (!newLikes[commentId]) {
        newLikes[commentId] = [];
      }
      const userArray = Array.isArray(newLikes[commentId]) ? [...newLikes[commentId]] : [];
      const currentUser = getCurrentUser();

      const userIndex = userArray.indexOf(currentUser);
      if (userIndex > -1) {
        userArray.splice(userIndex, 1);
      } else {
        userArray.push(currentUser);
      }

      newLikes[commentId] = userArray;
      return newLikes;
    });
  }, []);

  // Handle emoji reaction (toggle)
  const handleAddReaction = useCallback((commentId, emoji) => {
    setCommentReactions((prev) => {
      const newReactions = { ...prev };
      if (!newReactions[commentId]) {
        newReactions[commentId] = {};
      }
      const reactions = { ...newReactions[commentId] };
      const currentUser = getCurrentUser();

      // Get users who reacted with this emoji
      const userArray = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

      // Check if current user already reacted
      const userIndex = userArray.indexOf(currentUser);
      if (userIndex > -1) {
        // Remove reaction (toggle off)
        userArray.splice(userIndex, 1);
        if (userArray.length === 0) {
          // Remove emoji entry if no users left
          delete reactions[emoji];
        } else {
          reactions[emoji] = userArray;
        }
      } else {
        // Add reaction (toggle on)
        userArray.push(currentUser);
        reactions[emoji] = userArray;
      }

      newReactions[commentId] = reactions;
      return newReactions;
    });
    setShowEmojiPicker(null);
  }, []);

  // Check if current user liked a comment
  const isLiked = useCallback((commentId) => {
    const likes = commentLikes[commentId];
    if (!likes || !Array.isArray(likes)) return false;
    return likes.includes(getCurrentUser());
  }, [commentLikes]);

  // Get like count
  const getLikeCount = useCallback((commentId) => {
    const likes = commentLikes[commentId];
    return Array.isArray(likes) ? likes.length : 0;
  }, [commentLikes]);

  // Get reactions for a comment (returns { emoji: count })
  const getReactions = useCallback((commentId) => {
    const reactions = commentReactions[commentId] || {};
    // Convert user arrays to counts
    const reactionCounts = {};
    Object.keys(reactions).forEach((emoji) => {
      const users = reactions[emoji];
      if (Array.isArray(users) && users.length > 0) {
        reactionCounts[emoji] = users.length;
      }
    });
    return reactionCounts;
  }, [commentReactions]);

  // Check if current user reacted with specific emoji
  const hasUserReacted = useCallback((commentId, emoji) => {
    const reactions = commentReactions[commentId];
    if (!reactions || !reactions[emoji]) return false;
    const users = reactions[emoji];
    return Array.isArray(users) && users.includes(getCurrentUser());
  }, [commentReactions]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(null);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Common emojis for reactions
  const EMOJI_OPTIONS = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "💯", "😮"];


  const handlePrimaryButtonClick = useCallback(() => {
    if (currentStep === STEPS.length - 1) {
      if (!validateMandatoryFields()) return;
      onSaved && onSaved();
      onClose();
    } else {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  }, [currentStep, onClose, onSaved, validateMandatoryFields, validateStep]);

  const handleStepIndicatorClick = useCallback(
    (targetIdx) => {
      if (targetIdx === currentStep) return;
      if (targetIdx < currentStep) {
        setCurrentStep(targetIdx);
        return;
      }

      for (let idx = currentStep; idx < targetIdx; idx += 1) {
        if (!validateStep(idx)) {
          return;
        }
      }
      setCurrentStep(targetIdx);
    },
    [currentStep, validateStep]
  );

  if (!open) return null;



  return (

    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60 py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[75vw] max-w-3xl max-h-[92vh] overflow-y-auto my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">

          <h2 className="text-base font-semibold text-gray-800">Edit Lead Details</h2>

          <div className="flex items-center gap-2">

            <div className="relative">

              <button

                type="button"

                onClick={() => setOptionsOpen(!optionsOpen)}

                className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"

              >

                <FaEllipsisV />

              </button>

              {optionsOpen && (

                <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-md border bg-white shadow-xl">

                  <MenuBtn

                    label="Delete"

                    onClick={async () => {

                      setOptionsOpen(false);

                      const result = await Swal.fire({

                        title: "Delete Lead?",

                        text: "Are you sure you want to delete this lead?",

                        icon: "warning",

                        showCancelButton: true,

                        confirmButtonColor: "#d33",

                        confirmButtonText: "Yes, delete it!"

                      });

                      if (result.isConfirmed) {

                        try {

                          await apiClient.delete(`/leads/${leadId}`);

                          onSaved && onSaved();

                          onClose();

                          showToast({
                            icon: "success",
                            title: "Lead deleted",
                          });
                        } catch (err) {

                          console.error("Error deleting lead:", err);

                          showToast({
                            icon: "error",
                            title: "Error",
                            text: "Failed to delete lead",
                          });
                        }

                      }

                    }}

                  />

                  <MenuBtn

                    label="Archive"

                    onClick={async () => {

                      setOptionsOpen(false);

                      try {

                        await apiClient.put(`/leads/archive/${leadId}`);

                        showToast({
                          icon: "success",
                          title: "Lead archived",
                        });
                        onSaved && onSaved();

                        onClose();

                      } catch (err) {

                        console.error("Error archiving lead:", err);

                        showToast({
                          icon: "error",
                          title: "Error",
                          text: "Failed to archive lead",
                        });
                      }

                    }}

                  />

                  <MenuBtn

                    label="On Hold"

                    onClick={async () => {

                      setOptionsOpen(false);

                      try {

                        await apiClient.put(`/leads/onhold/${leadId}`);

                        showToast({
                          icon: "success",
                          title: "Lead marked on hold",
                        });
                        onSaved && onSaved();

                        onClose();

                      } catch (err) {

                        console.error("Error putting lead on hold:", err);

                        showToast({
                          icon: "error",
                          title: "Error",
                          text: "Failed to put lead on hold",
                        });
                      }

                    }}

                  />

                </div>

              )}

            </div>

            <button

              onClick={onClose}

              className="text-gray-500 hover:text-gray-700 text-lg leading-none h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"

            >

              ×

            </button>

          </div>

        </div>



        {/* Stepper */}

        <div className="px-6 py-4 border-b bg-gray-50">

          <div className="flex items-center justify-between">

            {STEPS.map((step, idx) => (

              <React.Fragment key={idx}>

                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleStepIndicatorClick(idx)}
                >

                  <div

                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${idx === currentStep

                        ? "bg-blue-600 text-white"

                        : "bg-gray-200 text-gray-600"

                      }`}

                  >

                    {idx + 1}

                  </div>

                  <span

                    className={`ml-1.5 text-xs font-medium ${idx === currentStep ? "text-blue-600" : "text-gray-500"

                      }`}

                  >

                    {step.label}

                  </span>

                </div>

                {idx < STEPS.length - 1 && (

                  <div

                    className={`flex-1 h-0.5 mx-3 ${idx < currentStep ? "bg-blue-600" : "bg-gray-200"

                      }`}

                  />

                )}

              </React.Fragment>

            ))}

          </div>

        </div>



        {/* Form Content */}

        {loading ? (

          <div className="px-6 py-20 text-center text-gray-500">

            Loading lead data...

          </div>

        ) : !leadData ? (

          <div className="px-6 py-20 text-center text-gray-500">

            No lead data available

          </div>

        ) : (

          <div className="px-6 py-5">

            {/* Step 1: Basic Info */}

            {currentStep === 0 && (

              <div className="space-y-4">

                <h3 className="text-sm font-semibold mb-4 text-gray-800">Lead Basic Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Name <span className="text-red-500">*</span>

                    </label>

                    {renderField("name", "Name", "text", null, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Mobile Number <span className="text-red-500">*</span>

                    </label>

                    {renderField("mobile_number", "Mobile Number", "tel", null, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>

                    {renderField("email", "Email", "email")}

                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>

                    {renderField("role_id", "Role", "select", roles)}

                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">College/Company</label>

                    {renderField("college_company", "College/Company")}

                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>

                    {renderField("location", "Location")}

                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Source <span className="text-red-500">*</span>

                    </label>

                    {renderField("source_id", "Source", "select", sources, { required: true })}
                  </div>



                  {isReferralSource && (
                    <div>

                      <label className="block text-xs font-medium text-gray-700 mb-1">Referred By</label>

                      {renderField("referred_by", "Referred By")}

                    </div>

                  )}

                  {isMetaAdsSource && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meta Campaign
                      </label>
                      {renderField("meta_campaign_id", "Meta Campaign", "select", metaCampaigns, { required: true })}
                    </div>
                  )}


                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Status <span className="text-red-500">*</span>

                    </label>

                    {renderField("status", "Status", "select", STATUS_OPTIONS, { required: true })}
                  </div>



                  {showEnrollmentId && (
                    <div>

                      <label className="block text-xs font-medium text-gray-700 mb-1">Enrollment ID</label>

                      {renderReadOnlyField(leadData.enrollment_id)}

                    </div>

                  )}
                </div>

              </div>

            )}



            {/* Step 2: Course Info */}

            {currentStep === 1 && (

              <div className="space-y-4">

                <h3 className="text-sm font-semibold mb-4 text-gray-800">Course Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Course Type <span className="text-red-500">*</span>

                    </label>

                    {renderField("course_type", "Course Type", "select", courseTypes, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Course <span className="text-red-500">*</span>

                    </label>

                    {renderField("course_id", "Course", "select", courses, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>

                    {renderField("batch_id", "Batch", "select", batches)}

                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Assigned To <span className="text-red-500">*</span>

                    </label>

                    {renderField("user_id", "Assigned To", "select", assignees, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Business Unit <span className="text-red-500">*</span>

                    </label>

                    {renderField("unit_id", "Business Unit", "select", units, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Card Type <span className="text-red-500">*</span>

                    </label>

                    {renderField("card_type_id", "Card Type", "select", cardTypes, { required: true })}
                  </div>



                  <div>

                    <label className="block text-xs font-medium text-gray-700 mb-1">

                      Course Structure <span className="text-red-500">*</span>

                    </label>

                    {renderField("course_structure", "Course Structure", "select", [

                      { id: "single", name: "Single Course" },

                      { id: "multiple", name: "Multiple Courses" },

                    ], { required: true })}
                  </div>

                </div>

              </div>

            )}



            {/* Step 3: Payment Info */}

            {currentStep === 2 && (

              <div className="space-y-4">

                <h3 className="text-sm font-semibold mb-4 text-gray-800">Payment Information</h3>



                {(() => {

                  // Determine which fields to show based on card type

                  const selectedCardTypeId = String(leadData.card_type_id || "");

                  const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);

                  const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);

                  const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);



                  const showTraining = isTrainingOnly || isBoth;

                  const showPlacement = isPlacementOnly || isBoth;



                  return (

                    <>

                      {showTraining && (

                        <div>

                          <h4 className="text-xs font-semibold text-gray-700 mb-3">Training Fee Information</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Actual Fee</label>

                              {renderField("actual_fee", "Actual Fee", "number")}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Discounted Fee</label>

                              {renderField("discounted_fee", "Discounted Fee", "number")}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Fee Paid</label>

                              {renderReadOnlyField(formatCurrency(leadData.fee_paid))}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Fee Balance</label>

                              {renderReadOnlyField(formatCurrency(leadData.fee_balance))}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Paid Status</label>

                              {renderField("paid_status", "Paid Status", "select", [

                                { id: "paid", name: "Paid" },

                                { id: "partially paid", name: "Partially Paid" },

                                { id: "not paid", name: "Not Paid" },

                              ])}

                            </div>

                          </div>

                        </div>

                      )}



                      {showPlacement && (

                        <div>

                          {showTraining && <div className="h-px w-full bg-gray-200 my-4" />}

                          <h4 className="text-xs font-semibold text-gray-700 mb-3">Placement Fee Information</h4>



                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Placement Actual Fee</label>

                              {renderField("placement_fee", "Placement Actual Fee", "number")}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Placement Discounted Fee</label>

                              {renderField("placement_discounted_fee", "Placement Discounted Fee", "number")}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Placement Paid</label>

                              {renderReadOnlyField(formatCurrency(leadData.placement_paid))}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Placement Balance</label>

                              {renderReadOnlyField(formatCurrency(leadData.placement_balance))}

                            </div>



                            <div>

                              <label className="block text-xs font-medium text-gray-700 mb-1">Placement Paid Status</label>

                              {renderField("placement_paid_status", "Placement Paid Status", "select", [

                                { id: "paid", name: "Paid" },

                                { id: "partially paid", name: "Partially Paid" },

                                { id: "not paid", name: "Not Paid" },

                              ])}

                            </div>

                          </div>

                        </div>

                      )}



                      {!showTraining && !showPlacement && (

                        <div className="text-center py-8 text-gray-500 text-xs">

                          Please select a card type to view payment information

                        </div>

                      )}

                    </>

                  );

                })()}

              </div>

            )}



            {/* Step 4: Trainer & Training */}

            {currentStep === 3 && (

              <div className="space-y-4">

                <h3 className="text-sm font-semibold mb-4 text-gray-800">Trainer & Training Details</h3>



                {(() => {
                  const isSingle =
                    normalizedCourseStructure === "single" ||
                    normalizedCourseStructure.startsWith("single ");
                  const isMultiple =
                    normalizedCourseStructure === "multiple" ||
                    normalizedCourseStructure === "multi" ||
                    normalizedCourseStructure.startsWith("multiple ");

                  // Single Course Structure */}
                  if (isSingle) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Trainer</label>

                          {renderField("trainer_id", "Trainer", "select", trainers)}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Training Status</label>

                          {renderField("training_status", "Training Status", "select", TRAINING_STATUS_OPTIONS)}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Training Start Date</label>

                          {renderField("training_start_date", "Training Start Date", "date")}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Training End Date</label>

                          {renderField("training_end_date", "Training End Date", "date")}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Share (%)</label>

                          {renderField("trainer_share", "Trainer Share", "number")}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Share Amount</label>

                          {renderReadOnlyField(formatCurrency(leadData.trainer_share_amount), "bg-gray-100 text-gray-500")}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid to Trainer</label>

                          {renderField("amount_paid_trainer", "Amount Paid to Trainer", "number")}

                        </div>



                        <div>

                          <label className="block text-xs font-medium text-gray-700 mb-1">Pending Amount</label>

                          {renderReadOnlyField(formatCurrency(leadData.pending_amount), "bg-gray-100 text-gray-500")}

                        </div>

                      </div>

                    );
                  }


                  // Multiple Course Structure - Sub-courses */}
                  if (isMultiple) {
                    return (
                      <div className="space-y-4">

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-medium text-gray-600">
                              Sub-Courses ({subCourseList.length})
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleAddSubCourseRow}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                              >
                                + Add Sub-Course
                              </button>
                              {subCourseList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSaveSubCourses}
                                  disabled={savingSubCourses}
                                  className="rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                  {savingSubCourses ? "Saving..." : "Save Sub-Courses"}
                                </button>
                              )}
                            </div>
                          </div>
                          {/* <p className="text-[11px] text-gray-500">
                            Update sub-course details below and click “Save Sub-Courses” to apply changes.
                          </p> */}
                        </div>



                        {subCourseList.length === 0 ? (
                          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg bg-white text-xs text-gray-500">
                            No sub-courses added yet. Use “Add Sub-Course” to begin assigning trainers.
                          </div>
                        ) : (
                          subCourseList.map((subCourse, index) => {
                            const inputClasses =
                              "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
                            const trainerOptions = Array.isArray(trainers)
                              ? trainers
                              : [];

                            return (
                              <div
                                key={subCourse.tempId || subCourse.sub_course_id || index}
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-gray-700">
                                    Sub-Course {index + 1}
                                  </h4>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubCourseRow(index)}
                                    className="text-red-500 hover:text-red-700 text-base font-semibold"
                                    aria-label="Remove sub-course"
                                  >
                                    ×
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Sub-Course <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={subCourse.sub_course_id || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "sub_course_id",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      <option value="">Select Sub-Course</option>
                                      {combinedSubCourseOptions.map((option) => (
                                        <option
                                          key={option.sub_course_id}
                                          value={option.sub_course_id}
                                        >
                                          {option.sub_course_name}
                                        </option>
                                      ))}
                                    </select>
                                    {combinedSubCourseOptions.length === 0 && (
                                      <p className="text-[11px] text-amber-600 mt-1">
                                        No sub-courses available for the selected course.
                                      </p>
                                    )}
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Trainer <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={subCourse.trainer_id || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "trainer_id",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      <option value="">Select Trainer</option>
                                      {trainerOptions.map((trainer) => {
                                        const id =
                                          trainer.trainer_id ||
                                          trainer.id ||
                                          trainer.user_id;
                                        const name =
                                          trainer.trainer_name ||
                                          trainer.name ||
                                          trainer.username ||
                                          `Trainer ${id}`;
                                        return (
                                          <option key={id} value={id}>
                                            {name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training Status
                                    </label>
                                    <select
                                      value={subCourse.training_status || "nottaken"}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_status",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      {TRAINING_STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Trainer Share (%)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={subCourse.trainer_share ?? ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "trainer_share",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Share Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subCourse.trainer_share_amount ?? ""}
                                      readOnly
                                      className={`${inputClasses} bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200`}
                                    />
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Amount Paid (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subCourse.amount_paid_trainer ?? ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "amount_paid_trainer",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Pending Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subCourse.pending_amount ?? ""}
                                      readOnly
                                      className={`${inputClasses} bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200`}
                                    />
                                  </div>



                                  <div>

                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training Start Date
                                    </label>
                                    <input
                                      type="date"
                                      value={subCourse.training_start_date || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_start_date",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>


                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training End Date
                                    </label>
                                    <input
                                      type="date"
                                      value={subCourse.training_end_date || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_end_date",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>

                                </div>

                              </div>

                            );
                          })
                        )}

                      </div>

                    );
                  }

                  // Fallback: Show message if course structure is not set or invalid
                  return (
                    <div className="text-center py-8 text-gray-500 text-xs border border-gray-200 rounded-lg p-4 bg-gray-50">
                      Please select a course structure (Single Course or Multiple Courses) in the Course Info step.
                    </div>
                  );
                })()}
              </div>

            )}

          </div>

        )}



        {/* Navigation Buttons */}

        <div className="px-6 py-4 flex justify-end gap-2 bg-white border-t border-b mb-4">

          <button

            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}

            className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"

            disabled={currentStep === 0}

          >

            Previous

          </button>

          <button
            onClick={handlePrimaryButtonClick}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >

            {currentStep === STEPS.length - 1 ? "Save Changes" : "Next"}

          </button>

        </div>



        {/* Comments Section */}

        <div className="px-6 pb-4">

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

                <div className="rounded-lg border bg-white px-3 py-2 text-sm max-h-60 overflow-y-auto">

                  {loadingComments ? (

                    <div className="text-center text-gray-500">

                      Loading comments...

                    </div>

                  ) : commentsList?.length ? (

                    commentsList.map((c, idx) => {

                      const id = getCommentId(c, idx);

                      const text = c.comment_text || c.text || c.html || "";

                      const created = getRelativeTime(c.created_at);

                      const isEditing = editingId === id;

                      const createdByFull = c.created_by_full || c.created_by || c.author || c.username || "";



                      return (

                        <div key={id} className="mb-2 flex items-start gap-2 last:mb-0">

                          {/* Avatar */}

                          <div className="flex-shrink-0">

                            <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[13px] uppercase">

                              {createdByFull ? createdByFull.split(' ').map(w => w[0]).join('').slice(0, 2) : 'U'}

                            </div>

                          </div>

                          {/* Comment Card */}

                          <div className="flex-1">

                            <div className="flex items-center gap-2 mb-0.5">

                              <span className="font-semibold text-gray-900 text-[12px]">{createdByFull}</span>

                              <span className="text-xs text-gray-500">{created}</span>

                            </div>

                            {!isEditing ? (

                              <div className="rounded-xl bg-gray-100 px-2 py-1 text-[13px] text-gray-900" dangerouslySetInnerHTML={{ __html: text }} />

                            ) : (

                              <div className="rounded-md border mt-1">

                                <div className="flex items-center gap-1 border-b bg-white px-2 py-1">

                                  <ToolbarButton onClick={() => document.execCommand("bold")} label="B" bold />

                                  <ToolbarButton onClick={() => document.execCommand("italic")} label="I" italic />

                                  <ToolbarButton onClick={() => document.execCommand("underline")} label="U" underline />

                                  <ToolbarDivider />

                                  <ToolbarButton onClick={() => document.execCommand("insertUnorderedList")} label="•" />

                                  <ToolbarButton onClick={() => document.execCommand("insertOrderedList")} label="1." />

                                  <ToolbarDivider />

                                  <ToolbarButton onClick={() => document.execCommand("strikeThrough")} label="S̶" />

                                </div>

                                <div

                                  ref={editRef}

                                  contentEditable

                                  className="min-h-[90px] w-full bg-white px-3 py-2 text-[13px] outline-none"

                                />

                                <div className="flex justify-end gap-2 p-2">

                                  <button className="rounded-md px-3 py-1.5 text-[12px] bg-gray-200 hover:bg-gray-300" onClick={() => setEditingId(null)}>

                                    Cancel

                                  </button>

                                  <button className="rounded-md px-3 py-1.5 text-[12px] bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleSaveCommentEdit(id)}>

                                    Save

                                  </button>

                                </div>

                              </div>

                            )}

                            {/* Actions */}

                            {!isEditing && (

                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex items-center gap-1">
                                  <button
                                    className={`p-0.5 rounded hover:bg-gray-200 flex items-center gap-1 ${isLiked(id) ? "text-blue-600" : "text-gray-600"
                                      }`}
                                    title="Like"
                                    onClick={() => handleToggleLike(id)}
                                  >
                                    {isLiked(id) ? (
                                      <FaThumbsUp size={14} />
                                    ) : (
                                      <FaRegThumbsUp size={14} />
                                    )}
                                    {getLikeCount(id) > 0 && (
                                      <span className="text-[11px]">{getLikeCount(id)}</span>
                                    )}
                                  </button>
                                  <div className="relative">
                                    <button
                                      className="p-0.5 rounded hover:bg-gray-200 text-gray-600"
                                      title="Add Reaction"
                                      onClick={() => setShowEmojiPicker(showEmojiPicker === id ? null : id)}
                                    >
                                      <FaRegSmile size={14} />
                                    </button>
                                    {showEmojiPicker === id && (
                                      <div
                                        ref={emojiPickerRef}
                                        className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50 flex gap-1"
                                      >
                                        {EMOJI_OPTIONS.map((emoji) => {
                                          const hasReacted = hasUserReacted(id, emoji);
                                          return (
                                            <button
                                              key={emoji}
                                              className={`text-lg hover:scale-125 transition-transform p-1 rounded ${hasReacted
                                                  ? "bg-blue-100 border-2 border-blue-400"
                                                  : "hover:bg-gray-100"
                                                }`}
                                              onClick={() => handleAddReaction(id, emoji)}
                                              title={hasReacted ? `Remove ${emoji}` : `Add ${emoji}`}
                                            >
                                              {emoji}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  {Object.keys(getReactions(id)).length > 0 && (
                                    <div className="flex items-center gap-1 ml-1">
                                      {Object.entries(getReactions(id)).map(([emoji, count]) => (
                                        <span
                                          key={emoji}
                                          className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                          title={`${count} ${emoji}`}
                                        >
                                          <span>{emoji}</span>
                                          <span className="text-[10px] text-gray-600">{count}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button

                                    className="text-xs text-gray-700 hover:underline font-medium px-1"

                                    onClick={() => {

                                      setCommentTab("add");

                                      setTimeout(() => {

                                        if (editorRef.current) {

                                          editorRef.current.innerText = `@${createdByFull} `;

                                          focusCommentEditor();

                                        }

                                      }, 0);

                                    }}

                                  >

                                    Reply

                                  </button>

                                  <button className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full" onClick={() => {

                                    setEditingId(id);

                                    setTimeout(() => {

                                      if (editRef.current) {

                                        editRef.current.innerHTML = text;

                                        editRef.current.focus();

                                      }

                                    }, 0);

                                  }}>

                                    <MdEdit size={14} />

                                  </button>

                                  <button className="text-gray-500 hover:bg-gray-200 p-0.5 rounded-full" onClick={() => handleDeleteComment(id)}>

                                    <MdDelete size={14} />

                                  </button>

                                </div>
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

                    <ToolbarButton onClick={() => exec("bold")} label="B" bold />

                    <ToolbarButton onClick={() => exec("italic")} label="I" italic />

                    <ToolbarButton onClick={() => exec("underline")} label="U" underline />

                    <ToolbarDivider />

                    <ToolbarButton onClick={() => exec("insertUnorderedList")} label="•" />

                    <ToolbarButton onClick={() => exec("insertOrderedList")} label="1." />

                    <ToolbarDivider />

                    <ToolbarButton onClick={() => exec("strikeThrough")} label="S̶" />

                  </div>



                  <div className="px-2 py-2">

                    <div

                      ref={editorRef}

                      contentEditable

                      className="min-h-[130px] w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:border-blue-500 bg-gray-50"

                      data-placeholder="Add a comment..."

                    />

                  </div>



                  <div className="flex justify-start gap-2 px-2 pb-3">

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





      </div>

    </div>

  );

}



// Helper Components for Comments

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



export default EditLeadForm;

