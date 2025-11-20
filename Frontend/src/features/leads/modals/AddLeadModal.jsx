import React, { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import courseService from "@shared/services/courses/courseService";
import lookupService from "@shared/services/lookups/lookupService";
import leadService from "@shared/services/leads/leadService";

// Add custom styles for smaller alerts
if (typeof document !== "undefined") {
  const styleId = "swal-small-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .swal-small {
        font-size: 0.875rem !important;
      }
      .swal-small-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
      }
      .swal-small-content {
        font-size: 0.875rem !important;
        padding: 0 !important;
      }
      .swal2-popup.swal-small {
        padding: 1rem !important;
      }
      .swal2-popup.swal-small .swal2-icon {
        margin: 0.35rem auto 0.6rem !important;
        transform: scale(0.8);
        transform-origin: center center;
      }
      .swal2-popup.swal-small .swal2-icon .swal2-icon-content {
        font-size: 1.4em !important;
      }
      .swal2-popup.swal-small .swal2-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
      }
      .swal2-popup.swal-small .swal2-html-container {
        font-size: 0.875rem !important;
      }
    `;
    document.head.appendChild(style);
  }
}

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

const AddLeadModal = ({ open, onClose, onSaved }) => {
  // =========================
  // 🔹 Form States
  // =========================
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Basic Info
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [manualCountryCode, setManualCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [college, setCollege] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [status, setStatus] = useState("enquiry");
  const [metaCampaignId, setMetaCampaignId] = useState("");

  // Course Info
  const [courseType, setCourseType] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [assignee, setAssignee] = useState("");
  const [unit, setUnit] = useState("");
  const [cardType, setCardType] = useState("");
  const [courseStructure, setCourseStructure] = useState("");

  // Payment Info
  const [actualFee, setActualFee] = useState("");
  const [discountedFee, setDiscountedFee] = useState("");
  const [paidStatus, setPaidStatus] = useState("");
  const [placementActualFee, setPlacementActualFee] = useState("");
  const [placementDiscountedFee, setPlacementDiscountedFee] = useState("");
  const [placementPaid, setPlacementPaid] = useState("");
  const [placementPending, setPlacementPending] = useState("");
  const [placementPaidStatus, setPlacementPaidStatus] = useState("");

  // Single Course Trainer
  const [trainerIdSingle, setTrainerIdSingle] = useState("");
  const [trainerShare, setTrainerShare] = useState("");
  const [trainerShareAmount, setTrainerShareAmount] = useState("");
  const [amountPaidTrainer, setAmountPaidTrainer] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [trainingStatusSingle, setTrainingStatusSingle] = useState("nottaken");
  const [trainingStartDateSingle, setTrainingStartDateSingle] = useState("");
  const [trainingEndDateSingle, setTrainingEndDateSingle] = useState("");
  const [trainerPaidSingle, setTrainerPaidSingle] = useState(false);

  // Sub-courses
  const [subCourseList, setSubCourseList] = useState([]);

  // Dropdown Data
  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subCourses, setSubCourses] = useState([]);
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

  // Validation
  const [fieldErrors, setFieldErrors] = useState({});

  // Collapsible sections state
  const [feeSectionOpen, setFeeSectionOpen] = useState(false);
  const [placementFeeSectionOpen, setPlacementFeeSectionOpen] = useState(true);

  // =========================
  // 🔹 Filtered Courses by Course Type
  // =========================
  const filteredCourses = useMemo(() => {
    if (!courseType) return courses;
    // Match by course_type field (can be string or object property)
    return courses.filter((c) => {
      const courseTypeValue = c.course_type || c.courseType || c.type || "";
      return String(courseTypeValue) === String(courseType);
    });
  }, [courseType, courses]);

  // =========================
  // 🔹 Check if source is Referral
  // =========================
  const isReferralSource = useMemo(() => {
    const referralSource = sources.find(
      (s) => String(s.name || "").toLowerCase() === "referral"
    );
    return source === String(referralSource?.id);
  }, [source, sources]);

  // =========================
  // 🔹 Check if source is Meta Ads
  // =========================
  const isMetaAdsSource = useMemo(() => {
    const metaAdsSource = sources.find(
      (s) =>
        String(s.name || "").toLowerCase() === "metaad" ||
        String(s.name || "").toLowerCase() === "meta ad" ||
        String(s.name || "").toLowerCase() === "meta ads"
    );
    return source === String(metaAdsSource?.id);
  }, [source, sources]);

  // =========================
  // 🔹 Card Type Visibility Logic
  // =========================
  const cardTypeVisibility = useMemo(() => {
    const selectedCardTypeId = String(cardType);
    const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
    const isPlacementOnly =
      selectedCardTypeId === String(cardTypeIds.PLACEMENT);
    const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);

    return {
      showTraining: isTrainingOnly || isBoth,
      showPlacement: isPlacementOnly || isBoth,
    };
  }, [cardType, cardTypeIds]);

  // =========================
  // 🔹 Fetch All Dropdown Data
  // =========================
  useEffect(() => {
    if (!open) return;

    const fetchAllData = async () => {
      setLoading(true);
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
          // getCourseTypes returns array of strings, normalize to objects
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
          console.log("Course types loaded:", normalizedCourseTypes);
        } else {
          console.error("Failed to load course types:", courseTypesRes?.error);
          setCourseTypes([]);
        }
        if (coursesRes?.success) {
          // Normalize courses data - handle different response structures
          const coursesData = coursesRes.data || [];
          let rawCourses = coursesData;
          
          // Handle if data is wrapped in 'courses' property
          if (coursesData.courses && Array.isArray(coursesData.courses)) {
            rawCourses = coursesData.courses;
          } else if (coursesData.data && Array.isArray(coursesData.data)) {
            rawCourses = coursesData.data;
          }
          
          // Normalize course objects
          const normalizedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map((c) => ({
            course_id: c.course_id || c.id || c._id,
            id: c.course_id || c.id || c._id,
            course_name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            course_type: c.course_type || c.courseType || c.type || "",
            _raw: c,
          }));
          setCourses(normalizedCourses);
          console.log("Courses loaded:", normalizedCourses);
        } else {
          console.error("Failed to load courses:", coursesRes?.error);
          setCourses([]);
        }
        if (trainersRes?.success) {
          setTrainers(trainersRes.data || []);
        }
        if (batchesRes?.success) {
          setBatches(batchesRes.data || []);
        }
        if (assigneesRes?.success) {
          setAssignees(assigneesRes.data || []);
        }
        if (unitsRes?.success) {
          setUnits(unitsRes.data || []);
        }
        if (cardTypesRes?.success) {
          const cardTypesData = cardTypesRes.data || [];
          console.log('CardTypes loaded from API:', cardTypesData);
          console.log('CardTypes sample item:', cardTypesData[0]);
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
          console.log('CardType IDs mapping:', ids);
        } else {
          console.error('Failed to load card types:', cardTypesRes?.error);
          setCardTypes([]);
        }
        if (sourcesRes?.success) {
          setSources(sourcesRes.data || []);
          console.log("Sources loaded:", sourcesRes.data);
        } else {
          console.error("Failed to load sources:", sourcesRes?.error);
          setSources([]);
        }
        if (rolesRes?.success) {
          setRoles(rolesRes.data || []);
          console.log("Roles loaded:", rolesRes.data);
        } else {
          console.error("Failed to load roles:", rolesRes?.error);
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        // Set empty arrays on error to prevent undefined state
        setCourseTypes([]);
        setCourses([]);
        setSources([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [open]);

  // =========================
  // 🔹 Fetch Sub-Courses when Course Changes
  // =========================
  useEffect(() => {
    if (!course) {
      setSubCourses([]);
      return;
    }

    const fetchSubCourses = async () => {
      try {
        const response = await apiClient.get(endpoints.courses.subCourses, {
          params: { course_id: course },
        });
        setSubCourses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching sub-courses:", error);
        setSubCourses([]);
      }
    };

    fetchSubCourses();
  }, [course]);

  // =========================
  // 🔹 Fetch Meta Campaigns when Meta Ads is selected
  // =========================
  useEffect(() => {
    if (!isMetaAdsSource) {
      setMetaCampaigns([]);
      return;
    }

    const fetchMetaCampaigns = async () => {
      try {
        const response = await apiClient.get(endpoints.metaCampaigns.apiRoot);
        setMetaCampaigns(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching meta campaigns:", error);
        setMetaCampaigns([]);
      }
    };

    fetchMetaCampaigns();
  }, [isMetaAdsSource]);

  // =========================
  // 🔹 Auto-calculate Fee Balance
  // =========================
  // =========================
  // 🔹 Auto-calculate Placement Pending
  // =========================
  useEffect(() => {
    const fee =
      parseFloat(placementDiscountedFee) ||
      parseFloat(placementActualFee) ||
      0;
    const paid = parseFloat(placementPaid) || 0;
    const pending = fee - paid;
    setPlacementPending(pending > 0 ? pending.toFixed(2) : "");
  }, [placementActualFee, placementDiscountedFee, placementPaid]);

  // =========================
  // 🔹 Auto-calculate Trainer Share Amount (Single Course)
  // =========================
  useEffect(() => {
    const totalFee =
      parseFloat(discountedFee) ||
      parseFloat(actualFee) ||
      0;
    const sharePercent = parseFloat(trainerShare) || 0;
    const shareAmount =
      totalFee > 0 && sharePercent > 0
        ? ((totalFee * sharePercent) / 100).toFixed(2)
        : "";
    setTrainerShareAmount(shareAmount);

    const paid = parseFloat(amountPaidTrainer) || 0;
    const pending = shareAmount
      ? (parseFloat(shareAmount) - paid).toFixed(2)
      : "";
    setPendingAmount(pending);
  }, [discountedFee, actualFee, trainerShare, amountPaidTrainer]);

  // =========================
  // 🔹 Validation Helpers
  // =========================
  const clearFieldError = useCallback((fieldKey) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[fieldKey]) return prev;
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  }, []);

  const getInputClasses = (field, extra = "w-full") => {
    const base =
      "border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2";
    const errorState =
      "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500";
    const normalState =
      "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    return `${extra} ${base} ${
      fieldErrors[field] ? errorState : normalState
    }`.trim();
  };

  const buildAlertContent = (errors = {}) => {
    const messages = [...new Set(Object.values(errors).filter(Boolean))];
    if (!messages.length) {
      return { title: "Validation Error", text: "Please fill all required fields." };
    }

    const requiredFields = messages
      .map((msg) => {
        const match = msg.match(/^(.+?) is required\.?$/i);
        if (match) return match[1];
        return null;
      })
      .filter(Boolean);

    if (requiredFields.length) {
      const uniqueFields = [...new Set(requiredFields)];
      const isPlural = uniqueFields.length > 1;
      return {
        title: "Missing Fields",
        text: `Please fill the ${isPlural ? "fields" : "field"}: ${uniqueFields.join(", ")}.`,
      };
    }

    if (messages.length === 1) {
      return { title: "Validation Error", text: messages[0] };
    }

    const listItems = messages.map((msg) => `<li>${msg}</li>`).join("");
    return {
      title: "Validation Error",
      html: `<div style="text-align:left;"><p style="margin:0 0 0.35rem 0;">Please fix the following:</p><ul style="margin:0;padding-left:1.25rem;">${listItems}</ul></div>`,
    };
  };

  // =========================
  // 🔹 Sub-Course Handlers
  // =========================
  const handleAddSubCourse = () => {
    setSubCourseList((prev) => [
      ...prev,
      {
        sub_course_id: "",
        trainer_id: "",
        trainer_share: "",
        trainer_share_amount: "",
        amount_paid_to_trainer: "",
        pending_amount: "",
        training_status: "nottaken",
        training_start_date: "",
        training_end_date: "",
        trainer_paid: false,
      },
    ]);
  };

  const handleSubCourseChange = (index, field, value) => {
    setSubCourseList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate trainer share amount and pending
      if (field === "trainer_share" || field === "amount_paid_to_trainer") {
        const discountedFeeVal = parseFloat(discountedFee) || 0;
        const sharePercent = parseFloat(updated[index].trainer_share) || 0;
        const paid = parseFloat(updated[index].amount_paid_to_trainer) || 0;

        const shareAmount =
          discountedFeeVal > 0 && sharePercent > 0
            ? ((discountedFeeVal * sharePercent) / 100).toFixed(2)
            : "";
        updated[index].trainer_share_amount = shareAmount;

        const pending = shareAmount
          ? (parseFloat(shareAmount) - paid).toFixed(2)
          : "";
        updated[index].pending_amount = pending;
      }

      return updated;
    });

    if (field === "sub_course_id") {
      clearFieldError(`subCourse_${index}`);
    }
    if (field === "trainer_id") {
      clearFieldError(`subTrainer_${index}`);
    }
  };

  const handleRemoveSubCourse = (index) => {
    setSubCourseList((prev) => prev.filter((_, i) => i !== index));
    clearFieldError(`subCourse_${index}`);
    clearFieldError(`subTrainer_${index}`);
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 0) {
      // Step 1: Basic Info
      if (!name.trim()) errors.name = "Name is required";
      if (!mobileNumber.trim()) errors.mobile = "Mobile number is required";
      if (!status) errors.status = "Status is required";
      if (!source) errors.source = "Source is required";
      const finalCountryCode =
        countryCode === "manual" ? manualCountryCode : countryCode;
      if (!finalCountryCode.trim()) errors.countryCode = "Country code is required";
    } else if (step === 1) {
      // Step 2: Course Info
      if (!assignee || assignee.toString().trim() === '') errors.assignee = "Assign To is required";
      if (!unit || unit.toString().trim() === '') errors.unit = "Business Unit is required";
      if (!cardType || cardType.toString().trim() === '') errors.cardType = "Card Type is required";
      if (!courseType || courseType.toString().trim() === '') errors.courseType = "Course Type is required";
      
      // Validate course - handle different types
      if (!course) {
        errors.course = "Course is required";
      } else if (typeof course === 'string' && course.trim() === '') {
        errors.course = "Course is required";
      } else if (typeof course === 'object' && course !== null) {
        // If course is an object, check if it has a valid ID
        const courseId = course.course_id || course.id || course._id;
        if (!courseId || (typeof courseId === 'string' && courseId.trim() === '')) {
          errors.course = "Course is required";
        }
      } else if (typeof course === 'number' && (isNaN(course) || course <= 0)) {
        errors.course = "Course is required";
      }
      
      if (!courseStructure) errors.courseStructure = "Course Structure is required";

      // Validate sub-courses if multiple structure
      if (courseStructure === "multiple") {
        subCourseList.forEach((sub, idx) => {
          if (!sub.sub_course_id) {
            errors[`subCourse_${idx}`] = "Sub-course is required";
          }
          if (!sub.trainer_id) {
            errors[`subTrainer_${idx}`] = "Trainer is required";
          }
        });
      }
    } else if (step === 3) {
      // Step 4: Trainer & Training
      if (courseStructure === "single") {
        if (!trainerIdSingle) errors.trainerIdSingle = "Trainer is required";
        if (!trainingStatusSingle) errors.trainingStatusSingle = "Training Status is required";
        if (trainerShare && parseFloat(trainerShare) > 100) {
          errors.trainerShare = "Trainer Share cannot exceed 100%";
        }
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));

      let targetStep = currentStep;
      if (
        errors.trainerIdSingle ||
        errors.trainingStatusSingle ||
        errors.trainerShare ||
        Object.keys(errors).some((key) => key.startsWith("subCourse_") || key.startsWith("subTrainer_"))
      ) {
        targetStep = 3;
      } else if (
        errors.assignee ||
        errors.unit ||
        errors.cardType ||
        errors.courseType ||
        errors.courseStructure ||
        errors.course
      ) {
        targetStep = 1;
      } else if (errors.name || errors.mobile || errors.status || errors.source || errors.countryCode) {
        targetStep = 0;
      }
      if (targetStep !== currentStep) {
        setCurrentStep(targetStep);
      }

      const alertContent = buildAlertContent(errors);
      Swal.fire({
        icon: "error",
        title: alertContent.title || "Validation Error",
        ...(alertContent.text
          ? { text: alertContent.text }
          : { html: alertContent.html }),
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // =========================
  // 🔹 Helper function to parse UUID values (for unit_id, card_type_id, etc.)
  // =========================
  const parseUuidValue = (value, fieldName) => {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      console.log(`${fieldName} is null/undefined/empty:`, value);
      return null;
    }
    
    // Convert to string and trim
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
      console.log(`${fieldName} string value is empty or invalid:`, strValue);
      return null;
    }
    
    // Validate UUID format (8-4-4-4-12 hexadecimal characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(strValue)) {
      console.log(`${fieldName} is not a valid UUID:`, strValue);
      return null;
    }
    
    console.log(`${fieldName} successfully parsed as UUID:`, value, '->', strValue);
    return strValue;
  };

  // =========================
  // 🔹 Helper function to parse ID values (numeric only - for batch_id, etc.)
  // =========================
  const parseIdValue = (value, fieldName) => {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      console.log(`${fieldName} is null/undefined/empty:`, value);
      return null;
    }
    
    // Convert to string and trim
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined' || strValue === '0') {
      console.log(`${fieldName} string value is empty or invalid:`, strValue);
      return null;
    }
    
    // Parse as integer
    const parsed = parseInt(strValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      console.log(`${fieldName} parsed value is invalid:`, parsed, 'from:', strValue);
      return null;
    }
    
    console.log(`${fieldName} successfully parsed:`, value, '->', strValue, '->', parsed);
    return parsed;
  };

  // =========================
  // 🔹 Helper function to parse Course ID (can be string like "CRS-DEV-001" or number)
  // =========================
  const parseCourseId = (value) => {
    if (value === null || value === undefined || value === '') {
      console.log('Course is null/undefined/empty:', value);
      return null;
    }
    
    // Handle object case
    if (typeof value === 'object' && value !== null) {
      const courseId = value.course_id || value.id || value._id;
      if (courseId) {
        return parseCourseId(courseId);
      }
      console.log('Course is object but no ID found:', value);
      return null;
    }
    
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
      console.log('Course string value is empty or invalid:', strValue);
      return null;
    }
    
    // Try to parse as number first
    const parsed = parseInt(strValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log('Course successfully parsed as number:', value, '->', parsed);
      return parsed;
    }
    
    // If not a number, check if it's a valid string ID (like "CRS-DEV-001")
    // Allow alphanumeric strings with hyphens/underscores
    if (/^[A-Za-z0-9_-]+$/.test(strValue) && strValue.length > 0) {
      console.log('Course successfully parsed as string ID:', value, '->', strValue);
      return strValue;
    }
    
    console.log('Course value is invalid (not a number or valid string ID):', strValue);
    return null;
  };

  // =========================
  // 🔹 Helper to normalize training status values for API (handles enum constraints)
  // =========================
  const normalizeTrainingStatusForApi = (value) => {
    if (value === null || value === undefined) return null;

    const raw = String(value).trim().toLowerCase();
    if (!raw) return null;

    const mapping = {
      nottaken: "nottaken",
      "not_taken": "nottaken",
      "not taken": "nottaken",
      scheduled: "scheduled",
      inprogress: "in_progress",
      "in_progress": "in_progress",
      "in progress": "in_progress",
      "in-progress": "in_progress",
      onhold: "onhold",
      "on_hold": "onhold",
      "on hold": "onhold",
      "on-hold": "onhold",
      completed: "completed",
    };

    const normalized = mapping[raw] || raw;
    console.log('normalizeTrainingStatusForApi:', value, '->', normalized);
    return normalized;
  };

  // =========================
  // 🔹 Form Submission
  // =========================
  const handleSubmit = async () => {
    // Validate ALL steps before submission, not just the current step
    const allErrors = {};
    for (let step = 0; step < STEPS.length; step++) {
      const stepErrors = validateStep(step);
      Object.assign(allErrors, stepErrors);
    }
    
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...allErrors }));
      const alertContent = buildAlertContent(allErrors);
      
      Swal.fire({
        icon: "error",
        title: alertContent.title || "Validation Error",
        ...(alertContent.text
          ? { text: alertContent.text }
          : { html: alertContent.html }),
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      return;
    }

    setLoading(true);

    // Debug: Log all state values before building payload
    console.log('=== Form State Values Before Payload ===');
    console.log('course:', course, 'type:', typeof course);
    console.log('unit:', unit, 'type:', typeof unit);
    console.log('cardType:', cardType, 'type:', typeof cardType, 'value:', cardType);
    console.log('cardTypes array:', cardTypes);
    console.log('assignee:', assignee, 'type:', typeof assignee);
    console.log('batch:', batch, 'type:', typeof batch);
    console.log('courseType:', courseType, 'type:', typeof courseType);
    console.log('courseStructure:', courseStructure, 'type:', typeof courseStructure);
    
    // Additional validation check
    if (!cardType || cardType.toString().trim() === '') {
      console.error('❌ CardType is EMPTY at payload building time!');
      console.error('CardType state:', cardType);
      console.error('CardType toString:', cardType?.toString());
    } else {
      console.log('✅ CardType has value:', cardType);
    }

    const finalCountryCode =
      countryCode === "manual" ? manualCountryCode : countryCode;

    // Parse required ID fields and validate they're not null
    // unit_id and card_type_id are UUIDs, not integers
    const parsedUnitId = parseUuidValue(unit, 'Unit');
    const parsedCardTypeId = parseUuidValue(cardType, 'CardType');
    const parsedCourseId = parseCourseId(course);

    // Validate required ID fields before building payload
    if (!parsedCourseId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid course.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }
    
    if (!parsedUnitId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid business unit.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }

    if (!parsedCardTypeId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid card type.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }
    
    // Parse optional UUID fields
    const parsedRoleId = role && role.toString().trim() !== "" ? parseUuidValue(role, 'Role') : null;
    const parsedSourceId = source && source.toString().trim() !== "" ? parseUuidValue(source, 'Source') : null;
    const parsedAssigneeId = assignee && assignee.toString().trim() !== "" ? parseUuidValue(assignee, 'Assignee') : null;

    const payload = {
      name,
      country_code: finalCountryCode,
      mobile_number: mobileNumber,
      email: email || null,
      role_id: parsedRoleId,
      college_company: college || null,
      location: location || null,
      source_id: parsedSourceId,
      referred_by: isReferralSource && referredBy ? referredBy : null,
      course_id: parsedCourseId,
      batch_id: (() => {
        if (!batch || batch.toString().trim() === "") return null;
        const parsed = parseInt(batch.toString().trim(), 10);
        return !isNaN(parsed) ? parsed : null;
      })(),
      status,
      assignee_id: parsedAssigneeId,
      user_id: parsedAssigneeId, // user_id is the same as assignee_id
      unit_id: parsedUnitId,
      card_type_id: parsedCardTypeId,
      course_structure: courseStructure,
      meta_campaign_id: isMetaAdsSource && metaCampaignId && metaCampaignId.toString().trim() !== "" 
        ? parseInt(metaCampaignId, 10) || null 
        : null,
    };

    // Payment fields
    if (cardTypeVisibility.showTraining) {
      payload.actual_fee = actualFee && actualFee.trim() !== "" 
        ? parseFloat(actualFee) || null 
        : null;
      payload.discounted_fee = discountedFee && discountedFee.trim() !== "" 
        ? parseFloat(discountedFee) || null 
        : null;
      payload.paid_status = paidStatus || null;
    }

    if (cardTypeVisibility.showPlacement) {
      const placementActual =
        placementActualFee && placementActualFee.trim() !== ""
          ? parseFloat(placementActualFee) || null
          : null;
      const placementDiscounted =
        placementDiscountedFee && placementDiscountedFee.trim() !== ""
          ? parseFloat(placementDiscountedFee) || null
          : null;

      payload.placement_actual_fee = placementActual;
      payload.placement_fee = placementDiscounted ?? placementActual;
      payload.placement_paid = placementPaid && placementPaid.trim() !== "" 
        ? parseFloat(placementPaid) || null 
        : null;
      payload.placement_pending = placementPending && placementPending.trim() !== "" 
        ? parseFloat(placementPending) || null 
        : null;
      payload.placement_paid_status = placementPaidStatus || null;
    }

    // Single course trainer fields
    if (courseStructure === "single") {
      payload.trainer_id = trainerIdSingle && trainerIdSingle.toString().trim() !== "" 
        ? parseInt(trainerIdSingle, 10) || null 
        : null;
      // Convert to numbers, default to 0 or null
      payload.trainer_share = trainerShare && trainerShare.trim() !== "" 
        ? parseFloat(trainerShare) || 0 
        : 0;
      payload.trainer_share_amount = trainerShareAmount && trainerShareAmount.trim() !== "" 
        ? parseFloat(trainerShareAmount) || 0 
        : 0;
      payload.amount_paid_trainer = amountPaidTrainer && amountPaidTrainer.trim() !== "" 
        ? parseFloat(amountPaidTrainer) || 0 
        : 0;
      payload.pending_amount = pendingAmount && pendingAmount.trim() !== "" 
        ? parseFloat(pendingAmount) || 0 
        : 0;
      payload.training_status = normalizeTrainingStatusForApi(trainingStatusSingle);
      payload.training_start_date = trainingStartDateSingle || null;
      payload.training_end_date = trainingEndDateSingle || null;
      payload.trainer_paid = trainerPaidSingle || false;
    }

    // Sub-courses
    if (courseStructure === "multiple" && subCourseList.length > 0) {
      payload.sub_courses = subCourseList
        .filter((sc) => sc.sub_course_id && sc.trainer_id)
        .map((sc) => ({
          sub_course_id: sc.sub_course_id && sc.sub_course_id.toString().trim() !== "" 
            ? parseInt(sc.sub_course_id, 10) || null 
            : null,
          trainer_id: sc.trainer_id && sc.trainer_id.toString().trim() !== "" 
            ? parseInt(sc.trainer_id, 10) || null 
            : null,
          trainer_share: sc.trainer_share && sc.trainer_share.toString().trim() !== "" 
            ? parseFloat(sc.trainer_share) || 0 
            : 0,
          trainer_share_amount: sc.trainer_share_amount && sc.trainer_share_amount.toString().trim() !== "" 
            ? parseFloat(sc.trainer_share_amount) || 0 
            : 0,
          amount_paid_to_trainer: sc.amount_paid_to_trainer && sc.amount_paid_to_trainer.toString().trim() !== "" 
            ? parseFloat(sc.amount_paid_to_trainer) || 0 
            : 0,
          pending_amount: sc.pending_amount && sc.pending_amount.toString().trim() !== "" 
            ? parseFloat(sc.pending_amount) || 0 
            : 0,
          training_status: normalizeTrainingStatusForApi(sc.training_status) || "nottaken",
          training_start_date: sc.training_start_date || null,
          training_end_date: sc.training_end_date || null,
          trainer_paid: sc.trainer_paid || false,
        }));
    }

    try {
      // Log payload for debugging
      console.log("Submitting lead payload:", payload);
      console.log("Required fields check:", {
        course_id: payload.course_id,
        unit_id: payload.unit_id,
        card_type_id: payload.card_type_id,
        name: payload.name,
        mobile_number: payload.mobile_number,
        status: payload.status
      });
      
      const result = await leadService.createLead(payload);
      if (result?.success || result?.id || result?.lead_id) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Lead added successfully!",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: "swal-small",
            title: "swal-small-title",
            content: "swal-small-content",
          },
          width: "350px",
          padding: "1rem",
        });
        onSaved?.();
        onClose?.();
        // Reset form
        resetForm();
    } else {
      Swal.fire({
        icon: "error",
          title: "Error",
          text: result?.error || "Failed to add lead.",
          customClass: {
            popup: "swal-small",
            title: "swal-small-title",
            content: "swal-small-content",
          },
          width: "350px",
          padding: "1rem",
        });
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to add lead. Please check the console for details.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setName("");
    setMobileNumber("");
    setCountryCode("+91");
    setManualCountryCode("");
    setEmail("");
    setRole("");
    setCollege("");
    setLocation("");
    setSource("");
    setReferredBy("");
    setStatus("enquiry");
    setMetaCampaignId("");
    setCourseType("");
    setCourse("");
    setBatch("");
    setAssignee("");
    setUnit("");
    setCardType("");
    setCourseStructure("");
    setActualFee("");
    setDiscountedFee("");
    setPaidStatus("");
    setPlacementActualFee("");
    setPlacementDiscountedFee("");
    setPlacementPaid("");
    setPlacementPending("");
    setPlacementPaidStatus("");
    setTrainerIdSingle("");
    setTrainerShare("");
    setTrainerShareAmount("");
    setAmountPaidTrainer("");
    setPendingAmount("");
    setTrainingStatusSingle("nottaken");
    setTrainingStartDateSingle("");
    setTrainingEndDateSingle("");
    setTrainerPaidSingle(false);
    setSubCourseList([]);
    setFieldErrors({});
    // Reset collapsible sections
    setFeeSectionOpen(false);
    setPlacementFeeSectionOpen(true);
  };

  // =========================
  // 🔹 Close on ESC
  // =========================
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // =========================
  // 🔹 Reset form when modal opens
  // =========================
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60 py-8">
      <div className="bg-white rounded-lg shadow-2xl w-[75vw] max-w-3xl max-h-[92vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Lead Registration Form</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      idx <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`ml-1.5 text-xs font-medium ${
                      idx <= currentStep ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      idx < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
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
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError("name");
                    }}
                    className={getInputClasses("name")}
                    required
                  />
               </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        clearFieldError("countryCode");
                        if (e.target.value !== "manual") {
                          setManualCountryCode("");
                        }
                      }}
                      className={getInputClasses("countryCode", "w-28")}
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.value} value={cc.value}>
                          {cc.label}
                        </option>
                      ))}
                    </select>
                    {countryCode === "manual" && (
                      <input
                        type="text"
                        value={manualCountryCode}
                        onChange={(e) => {
                          setManualCountryCode(e.target.value);
                          clearFieldError("countryCode");
                        }}
                        placeholder="Enter country code"
                        className={getInputClasses("countryCode", "flex-1")}
                        required
                      />
                    )}
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        clearFieldError("mobile");
                      }}
                      placeholder="Enter mobile number"
                      className={getInputClasses("mobile", "flex-1")}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  <option value="">Select Role</option>
                    {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                        {r.name}
                    </option>
                  ))}
                  </select>
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    College/Company
                  </label>
                  <input
                    type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter College Or Company Name"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter Location"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      clearFieldError("source");
                      setReferredBy("");
                      setMetaCampaignId("");
                    }}
                    className={getInputClasses("source")}
                    required
                  >
                   <option value="">Select Source</option>
                    {sources.map((s) => (
                     <option key={s.id} value={s.id}>
                       {s.name}
                     </option>
                   ))}
                  </select>
               </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lead Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      clearFieldError("status");
                    }}
                    className={getInputClasses("status")}
                    required
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isReferralSource && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Referred By
                    </label>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Enter referrer name"
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {isMetaAdsSource && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Meta Campaign
                    </label>
                    <select
                     value={metaCampaignId}
                     onChange={(e) => setMetaCampaignId(e.target.value)}
                       className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   >
                     <option value="">Select Meta Campaign</option>
                     {metaCampaigns.map((c) => (
                       <option key={c.id || c.campaign_id} value={c.id || c.campaign_id}>
                         {c.name || c.campaign_name || c.id}
                       </option>
                     ))}
                      </select>
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
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => {
                      setAssignee(e.target.value);
                      clearFieldError("assignee");
                    }}
                    className={getInputClasses("assignee")}
                    required
                  >
                    <option value="">Select Assignee</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </select>
             </div>

                <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    clearFieldError("unit");
                  }}
                  className={getInputClasses("unit")}
                  required
                >
                    <option value="">Select Business Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name}
                      </option>
                    ))}
                  </select>
           </div>

                  <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Card Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      console.log('CardType onChange - selected value:', selectedValue);
                      setCardType(selectedValue);
                      clearFieldError("cardType");
                      // Verify it was set
                      setTimeout(() => {
                        console.log('CardType state after set:', selectedValue);
                      }, 0);
                    }}
                    className={getInputClasses("cardType")}
                    required
                  >
                    <option value="">Select Card Type</option>
                    {cardTypes.length === 0 ? (
                      <option value="" disabled>Loading card types...</option>
                    ) : (
                      cardTypes.map((c) => {
                        const cardId = c.id || c.card_type_id;
                        const cardIdStr = cardId != null ? String(cardId) : '';
                        return (
                          <option key={cardIdStr || `card-${c.name || c.card_type_name}`} value={cardIdStr}>
                            {c.name || c.card_type_name}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                  <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                   value={courseType}
                   onChange={(e) => {
                     setCourseType(e.target.value);
                     setCourse("");
                     clearFieldError("courseType");
                     clearFieldError("course");
                   }}
                     className={getInputClasses("courseType")}
                      required
                 >
                   <option value="">Select Course Type</option>
                    {courseTypes.map((ct) => (
                     <option key={ct.id || ct.course_type} value={ct.id || ct.course_type}>
                       {ct.name || ct.course_type}
                     </option>
                   ))}
                  </select>
               </div>

                  <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                   value={course}
                   onChange={(e) => {
                     const selectedValue = e.target.value;
                     // Ensure we store the value as a string (React select values are always strings)
                     setCourse(selectedValue);
                     clearFieldError("course");
                   }}
                     className={getInputClasses("course")}
                      required
                      disabled={!courseType}
                 >
                   <option value="">Select Course</option>
                    {filteredCourses.map((c) => {
                      // Ensure courseId is always a primitive value (string or number)
                      const courseId = c.course_id || c.id;
                      // Convert to string for option value (React requires string values)
                      const courseIdStr = courseId != null ? String(courseId) : '';
                      return (
                        <option key={courseIdStr || `course-${c.course_name || c.name}`} value={courseIdStr}>
                          {c.course_name || c.name}
                        </option>
                      );
                    })}
                  </select>
              </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.id || b.batch_id} value={b.id || b.batch_id}>
                        {b.name || b.batch_name}
                    </option>
                  ))}
                  </select>
              </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Course Structure <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseStructure}
                    onChange={(e) => {
                      setCourseStructure(e.target.value);
                      clearFieldError("courseStructure");
                      if (e.target.value === "single") {
                        setSubCourseList([]);
                      }
                    }}
                    className={getInputClasses("courseStructure")}
                    required
                  >
                    <option value="">Select Course Structure</option>
                    <option value="single">Single Course Training</option>
                    <option value="multiple">Multiple Courses Training</option>
                  </select>
              </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold mb-4 text-gray-800">Payment Information</h3>
              
              {/* Fee Information Section (Collapsible) */}
              {cardTypeVisibility.showTraining && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFeeSectionOpen(!feeSectionOpen)}
                    className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left text-xs font-semibold text-gray-700 border-b transition-colors"
                  >
                    <span>Training Fee Information</span>
                    <span className="text-gray-500 text-lg">
                      {feeSectionOpen ? "−" : "+"}
                    </span>
                  </button>
                  {feeSectionOpen && (
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-gray-600 mb-4">
                        Set the training fee details. Fee payments will be tracked separately.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Training Actual Fee (Original Price)
                          </label>
                          <input
                            type="number"
                            value={actualFee}
                            onChange={(e) => setActualFee(e.target.value)}
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Actual Fee Amount"
                          />
              </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Training Discounted Fee (Final Price)
                          </label>
                          <input
                            type="number"
                            value={discountedFee}
                            onChange={(e) => setDiscountedFee(e.target.value)}
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Discounted Fee Amount"
                          />
                        </div>
                        {/* <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Paid Status
                          </label>
                          <select
                            value={paidStatus}
                            onChange={(e) => setPaidStatus(e.target.value)}
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div> */}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Placement Fee Information Section (Collapsible) */}
              {cardTypeVisibility.showPlacement && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPlacementFeeSectionOpen(!placementFeeSectionOpen)}
                    className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left text-xs font-semibold text-gray-700 border-b transition-colors"
                  >
                    <span>Placement Fee Information</span>
                    <span className="text-gray-500 text-lg">
                      {placementFeeSectionOpen ? "−" : "+"}
                    </span>
                  </button>
                  {placementFeeSectionOpen && (
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-gray-600 mb-4">
                        Set the placement fee. Placement payments will be tracked separately.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Placement Actual Fee (Original Price)
                          </label>
                          <input
                            type="number"
                            value={placementActualFee}
                            onChange={(e) => setPlacementActualFee(e.target.value)}
                            placeholder="Enter Placement Actual Fee"
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Placement Discounted Fee (Final Price)
                          </label>
                          <input
                            type="number"
                            value={placementDiscountedFee}
                            onChange={(e) => setPlacementDiscountedFee(e.target.value)}
                            placeholder="Enter Placement Discounted Fee"
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Trainer & Training */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold mb-4 text-gray-800">Trainer Share & Course Management</h3>
              {courseStructure === "single" ? (
                <div className="space-y-6">
                  {/* Informational Banner */}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <p className="text-xs text-pink-800">
                      Single Course Training: Configure trainer and training details for one course.
                    </p>
                  </div>

                  {/* Main Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Trainer <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={trainerIdSingle}
                        onChange={(e) => {
                          setTrainerIdSingle(e.target.value);
                          clearFieldError("trainerIdSingle");
                        }}
                        className={getInputClasses("trainerIdSingle")}
                        required
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                    </option>
                  ))}
                      </select>
              </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Training Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={trainingStatusSingle}
                        onChange={(e) => {
                          setTrainingStatusSingle(e.target.value);
                          clearFieldError("trainingStatusSingle");
                        }}
                        className={getInputClasses("trainingStatusSingle")}
                        required
                      >
                        {TRAINING_STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                    </option>
                  ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Training Start Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={trainingStartDateSingle}
                          onChange={(e) => setTrainingStartDateSingle(e.target.value)}
                          className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                          📅
                        </span>
              </div>
            </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Training End Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={trainingEndDateSingle}
                          onChange={(e) => setTrainingEndDateSingle(e.target.value)}
                          className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                          📅
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trainer Payment Details Sub-section */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-xs font-semibold text-green-700 mb-4">
                      Trainer Payment Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Trainer Share (%)
                        </label>
                        <input
                          type="number"
                          value={trainerShare}
                          onChange={(e) => {
                            setTrainerShare(e.target.value);
                            clearFieldError("trainerShare");
                          }}
                          placeholder="Enter Trainer Share Percentage"
                          min="0"
                          max="100"
                          className={getInputClasses("trainerShare")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Trainer Share Amount
                        </label>
                        <input
                          type="text"
                          value={trainerShareAmount}
                          placeholder="Auto Calculated"
                          readOnly
                          className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Amount Paid to Trainer
                        </label>
                        <input
                          type="number"
                          value={amountPaidTrainer}
                          onChange={(e) => setAmountPaidTrainer(e.target.value)}
                          placeholder="Enter Amount Paid To Trainer"
                          min="0"
                          step="0.01"
                          className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pending Amount to Pay
                        </label>
                        <input
                          type="text"
                          value={pendingAmount}
                          placeholder="Auto Calculated"
                          readOnly
                          className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={trainerPaidSingle}
                            onChange={(e) => setTrainerPaidSingle(e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Trainer Payment Completed
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-semibold text-gray-700">Sub-Courses</h4>
              <button
                      type="button"
                      onClick={handleAddSubCourse}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-xs font-medium"
              >
                      + Add Sub-Course
              </button>
                  </div>

                  {subCourseList.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">No sub-courses added yet</p>
                      <p className="text-xs text-gray-400">
                        Click 'Add Sub-Course' to begin assigning courses to trainers
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subCourseList.map((sub, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4 bg-gray-50 space-y-4"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-medium text-gray-700">
                              Sub-Course {idx + 1}
                            </h5>
              <button
                              type="button"
                              onClick={() => handleRemoveSubCourse(idx)}
                              className="text-red-600 hover:text-red-800 text-base font-bold"
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
                                value={sub.sub_course_id}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "sub_course_id",
                                    e.target.value
                                  )
                                }
                                className={getInputClasses(`subCourse_${idx}`)}
                                required
                              >
                                <option value="">Select Sub-Course</option>
                                {subCourses.map((sc) => (
                                  <option
                                    key={sc.sub_course_id}
                                    value={sc.sub_course_id}
                                  >
                                    {sc.sub_course_name}
                                  </option>
                                ))}
                              </select>
          </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Trainer <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={sub.trainer_id}
                                onChange={(e) =>
                                  handleSubCourseChange(idx, "trainer_id", e.target.value)
                                }
                                className={getInputClasses(`subTrainer_${idx}`)}
                                required
                              >
                                <option value="">Select Trainer</option>
                                {trainers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
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
                                value={sub.trainer_share}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "trainer_share",
                                    e.target.value
                                  )
                                }
                                min="0"
                                max="100"
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Trainer Share Amount
                              </label>
                              <input
                                type="text"
                                value={sub.trainer_share_amount}
                                readOnly
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                />
              </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Amount Paid to Trainer
                              </label>
                              <input
                                type="number"
                                value={sub.amount_paid_to_trainer}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "amount_paid_to_trainer",
                                    e.target.value
                                  )
                                }
                                min="0"
                                step="0.01"
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Pending Amount
                              </label>
                              <input
                                type="text"
                                value={sub.pending_amount}
                                readOnly
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                />
              </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={sub.training_status}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "training_status",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {TRAINING_STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                    </option>
                  ))}
                              </select>
              </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={sub.training_start_date}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "training_start_date",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={sub.training_end_date}
                                onChange={(e) =>
                                  handleSubCourseChange(
                                    idx,
                                    "training_end_date",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
            </div>

                            <div className="md:col-span-2">
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={sub.trainer_paid}
                                  onChange={(e) =>
                                    handleSubCourseChange(
                                      idx,
                                      "trainer_paid",
                                      e.target.checked
                                    )
                                  }
                                  className="w-3.5 h-3.5"
                                />
                                <span className="text-xs font-medium text-gray-700">
                                  Trainer Payment Status (Check if payment has been completed)
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 mr-3 transition-colors"
              >
                Previous
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs">✓</span>
                    <span>Create Lead</span>
                  </>
                )}
              </button>
            )}
          </div>
          </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
