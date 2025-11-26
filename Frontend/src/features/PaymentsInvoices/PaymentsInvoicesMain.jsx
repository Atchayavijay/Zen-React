import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@shared/api/client";
import { getPageColors } from "@shared/utils/pageColors";
import {
  BsCalendarEvent,
  BsCashCoin,
  BsCashStack,
  BsChatLeftText,
  BsClockHistory,
  BsCreditCard,
  BsCurrencyRupee,
  BsDownload,
  BsPersonBadge,
  BsTable,
  BsWallet2,
} from "react-icons/bs";
import { FiX } from "react-icons/fi";
import { BiSearch, BiFilterAlt } from "react-icons/bi";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import PaymentFilterModal from "./PaymentFilterModal";
import "./PaymentsInvoicesMain.css";

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];
const todayISO = () => new Date().toISOString().slice(0, 10);

// const Toast = Swal.mixin({
//   toast: true,
//   position: 'top-end',
//   zIndex: 99999,
//   showConfirmButton: false,
//   timer: 3000,
//   timerProgressBar: true,
//   didOpen: (toast) => {
//     toast.addEventListener('mouseenter', Swal.stopTimer)
//     toast.addEventListener('mouseleave', Swal.resumeTimer)
//   }
// });



const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    container: 'my-toast-zindex'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});


const initialFeeSummary = {
  actual_fee: 0,
  discounted_fee: 0,
  fee_paid: 0,
  fee_balance: 0,
  installment_number: 1,
  institute_percentage: 100,
  trainers: [],
};

export default function PaymentInvoicesMain() {
  const location = useLocation();
  const colors = getPageColors(location.pathname);
  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState("");
  const [sort, setSort] = useState({ key: "payment_date", direction: "desc" });
  
  // Filter states - changed to arrays for multiple selection
  const [filters, setFilters] = useState({
    courses: [],
    batches: [],
    trainers: [],
    paymentModes: [],
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allLeads, setAllLeads] = useState([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadOptionsOpen, setLeadOptionsOpen] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [feeSummary, setFeeSummary] = useState(initialFeeSummary);
  const [leadDetails, setLeadDetails] = useState(null);
  const [coursePayments, setCoursePayments] = useState([]);
  const [placementPayments, setPlacementPayments] = useState([]);

  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [mode, setMode] = useState("");
  const [remarks, setRemarks] = useState("");

  const [shareRows, setShareRows] = useState([]);
  const [feeTab, setFeeTab] = useState("course");
  const [hasRecordedPayment, setHasRecordedPayment] = useState(false);

  const [allTrainers, setAllTrainers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  const request = useCallback(
    async (path, options = {}) => {
      const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...authHeader,
        ...(options.headers || {}),
      };
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
      if (!res.ok) {
        let message = "Request failed";
        try {
          const data = await res.json();
          message = data.error || data.message || message;
        } catch (_) {
          // ignore
        }
        throw new Error(message);
      }
      return res.json();
    },
    [authHeader]
  );

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await request("leads/all-installments");
      const rows = data?.installments || data?.data || [];
      setLogs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Failed to load payment logs:", err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [request]);

  const loadFilters = useCallback(async () => {
    try {
      const [trainersRes, batchesRes] = await Promise.all([
        request("api/trainers"),
        request("leads/batches")
      ]);
      
      if (trainersRes?.success && Array.isArray(trainersRes.trainers)) {
        setAllTrainers(trainersRes.trainers);
      }
      
      // getBatches returns the array directly
      if (Array.isArray(batchesRes)) {
        setAllBatches(batchesRes);
      } else if (batchesRes?.success && Array.isArray(batchesRes.batches)) {
        // Fallback in case backend changes
        setAllBatches(batchesRes.batches);
      }
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  }, [request]);

  useEffect(() => {
    loadLogs();
    loadFilters();
  }, [loadLogs, loadFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (leadOptionsOpen && !event.target.closest('.search-container')) {
        setLeadOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [leadOptionsOpen]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const courses = new Set();
    
    logs.forEach((log) => {
      if (log.course_name) courses.add(log.course_name);
    });

    return {
      courses: Array.from(courses).sort(),
      batches: allBatches.map(b => b.batch_name).filter(Boolean).sort(),
      trainers: allTrainers.map(t => t.trainer_name).filter(Boolean).sort(),
      paymentModes: PAYMENT_MODES,
    };
  }, [logs, allBatches, allTrainers]);

  const filteredLogs = useMemo(() => {
    const search = logsFilter.trim().toLowerCase();
    let rows = [...logs];
    
    // Apply text search filter
    if (search) {
      rows = rows.filter((log) => {
        const haystack = [
          log.student_name,
          log.mobile,
          log.course_name,
          log.batch_name,
          log.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
    }
    
    // Apply dropdown filters (now supporting multiple selections)
    if (filters.courses && filters.courses.length > 0) {
      rows = rows.filter((log) => filters.courses.includes(log.course_name));
    }
    if (filters.batches && filters.batches.length > 0) {
      rows = rows.filter((log) => filters.batches.includes(log.batch_name));
    }
    if (filters.trainers && filters.trainers.length > 0) {
      rows = rows.filter((log) => filters.trainers.includes(log.trainer_name));
    }
    if (filters.paymentModes && filters.paymentModes.length > 0) {
      rows = rows.filter((log) => filters.paymentModes.includes(log.payment_mode));
    }
    
    // Apply date filters
    if (dateFrom) {
      rows = rows.filter((log) => {
        if (!log.payment_date) return false;
        const logDate = new Date(log.payment_date);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        return logDate >= fromDate;
      });
    }
    if (dateTo) {
      rows = rows.filter((log) => {
        if (!log.payment_date) return false;
        const logDate = new Date(log.payment_date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return logDate <= toDate;
      });
    }
    
    if (sort.key) {
      rows.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];
        if (aVal === bVal) return 0;
        const order = sort.direction === "asc" ? 1 : -1;
        if (aVal == null) return 1 * order;
        if (bVal == null) return -1 * order;
        if (sort.key === "payment_date") {
          return (new Date(aVal) - new Date(bVal)) * order;
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }
    return rows;
  }, [logs, logsFilter, sort, filters, dateFrom, dateTo]);

  const changeSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleToggleFilter = (sectionKey, value) => {
    setFilters((prev) => {
      const currentValues = prev[sectionKey] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [sectionKey]: nextValues };
    });
  };

  const handleClearFilters = () => {
    setFilters({
      courses: [],
      batches: [],
      trainers: [],
      paymentModes: [],
    });
    setDateFrom("");
    setDateTo("");
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  // Convert filterOptions to modal format
  const toOptions = (items) => items.map((item) => ({ value: item, label: item }));

  const filterSections = useMemo(() => [
    {
      key: "courses",
      title: "Course",
      options: toOptions(filterOptions.courses),
    },
    {
      key: "batches",
      title: "Batch",
      options: toOptions(filterOptions.batches),
    },
    {
      key: "trainers",
      title: "Trainer",
      options: toOptions(filterOptions.trainers),
    },
    {
      key: "paymentModes",
      title: "Payment Mode",
      options: toOptions(filterOptions.paymentModes),
    },
  ], [filterOptions]);

  const exportLogs = () => {
    if (!filteredLogs.length) {
      Toast.fire({
        icon: 'info',
        title: 'No rows to export.'
      });
      return;
    }
    const headers = [
      "Date",
      "Student",
      "Mobile",
      "Course",
      "Batch",
      "Amount",
      "Mode",
      "Installment",
      "Remarks",
    ];
    const rows = filteredLogs.map((log) => [
      log.payment_date,
      log.student_name,
      log.mobile,
      log.course_name,
      log.batch_name,
      log.amount,
      log.payment_mode,
      log.installment_count,
      log.remarks,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-logs-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetModalState = () => {
    setLeadSearch("");
    setSelectedLead(null);
    setFeeSummary(initialFeeSummary);
    setLeadDetails(null);
    setCoursePayments([]);
    setPlacementPayments([]);
    setAmount("");
    setPayDate(todayISO());
    setMode("");
    setRemarks("");
    setShareRows([]);
    setFeeTab("course");
    setHasRecordedPayment(false);
  };

  const openModal = () => {
    setModalOpen(true);
    resetModalState();
    loadAllLeads();
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const loadAllLeads = async () => {
    setLeadsLoading(true);
    try {
      const data = await request("leads");
      const list = Array.isArray(data)
        ? data.map((lead) => ({
            id: lead.lead_id,
            name: lead.name,
            mobile: lead.mobile_number,
            email: lead.email,
            course: lead.course_name || "—",
          }))
        : [];
      setAllLeads(list);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setAllLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const filteredLeadOptions = useMemo(() => {
    const query = leadSearch.trim().toLowerCase();
    if (!query) return [];
    return allLeads
      .filter((lead) => {
        return (
          lead.name?.toLowerCase().includes(query) ||
          lead.mobile?.toLowerCase().includes(query) ||
          String(lead.id).includes(query)
        );
      })
      .slice(0, 10);
  }, [leadSearch, allLeads]);

  const selectLead = async (lead) => {
    setSelectedLead(lead);
    setLeadSearch(lead.name);
    setLeadOptionsOpen(false);
    setCoursePayments([]);
    setPlacementPayments([]);
    setHasRecordedPayment(false);
    setLeadDetails(null);
    setFeeSummary(initialFeeSummary);
    setShareRows([]);
    try {
      const [fee, details, installments, placementInfo] = await Promise.all([
        request(`leads/${lead.id}/payment-info`),
        request(`leads/${lead.id}`),
        request(`leads/${lead.id}/installments`),
        request(`leads/${lead.id}/placement-payments`).catch((err) => {
          console.error("Failed to load placement payments:", err);
          return null;
        }),
      ]);

      setFeeSummary({
        actual_fee: fee.actual_fee ?? 0,
        discounted_fee: fee.discounted_fee ?? 0,
        fee_paid: fee.fee_paid ?? 0,
        fee_balance: fee.fee_balance ?? 0,
        installment_number: fee.installment_number ?? 1,
        institute_percentage:
          fee.institute_percentage ??
          Math.max(
            0,
            100 -
              (Array.isArray(fee.trainers)
                ? fee.trainers.reduce(
                    (sum, t) => sum + Number(t.share_percentage || 0),
                    0
                  )
                : 0)
          ),
        trainers: Array.isArray(fee.trainers) ? fee.trainers : [],
      });
      const mergedDetails = { ...(details || {}), ...(placementInfo?.lead_info || {}) };
      setLeadDetails(Object.keys(mergedDetails).length ? mergedDetails : null);
      setCoursePayments(
        Array.isArray(installments?.installments)
          ? installments.installments
          : []
      );
      setPlacementPayments(
        Array.isArray(placementInfo?.installments)
          ? placementInfo.installments
          : []
      );

      // Set initial tab based on card type
      const cardTypeName = String(mergedDetails.card_type_name || "").toLowerCase();
      const isPlacementOnly = cardTypeName.includes("placement") && !cardTypeName.includes("training");
      
      if (isPlacementOnly) {
        setFeeTab("placement");
      } else {
        setFeeTab("course");
      }
    } catch (err) {
      console.error("Failed to load lead context:", err);
    }
  };

  useEffect(() => {
    if (feeTab !== "course" || !amount) {
      setShareRows([]);
      return;
    }
    const amt = Number(amount) || 0;
    const trainerRows =
      feeSummary.trainers?.map((trainer) => {
        const pct = Number(trainer.share_percentage || 0);
        return {
          label: trainer.trainer_name || "Trainer",
          pct,
          amount: Number(((amt * pct) / 100).toFixed(2)),
        };
      }) || [];
    const trainerPctTotal = trainerRows.reduce((sum, row) => sum + row.pct, 0);
    const institutePct =
      feeSummary.institute_percentage ?? Math.max(0, 100 - trainerPctTotal);
    const instituteRow = {
      label: "Institute",
      pct: institutePct,
      amount: Number(((amt * institutePct) / 100).toFixed(2)),
    };
    setShareRows([...trainerRows, instituteRow]);
  }, [amount, feeSummary, feeTab]);

  const recordPayment = async () => {
    if (!selectedLead?.id) {
      Toast.fire({
        icon: 'warning',
        title: 'Please choose a student.'
      });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Toast.fire({
        icon: 'warning',
        title: 'Please enter a valid amount.'
      });
      return;
    }
    setSaving(true);
    const isPlacement = feeTab === "placement";
    try {
      await request(
        isPlacement
          ? `leads/${selectedLead.id}/placement-payments`
          : `leads/${selectedLead.id}/installments`,
        {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          payment_date: payDate,
          payment_mode: mode,
          remarks: remarks || null,
        }),
        }
      );
      Toast.fire({
        icon: 'success',
        title: isPlacement
          ? "Placement payment recorded successfully."
          : "Course payment recorded successfully."
      });
      await Promise.all([selectLead(selectedLead), loadLogs()]);
      setAmount("");
      setMode("");
      setRemarks("");
      setPayDate(todayISO());
      setHasRecordedPayment(true);
    } catch (err) {
      console.error("Failed to save payment:", err);
      Toast.fire({
        icon: 'error',
        title: err.message || "Failed to save payment."
      });
    } finally {
      setSaving(false);
    }
  };
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!hasRecordedPayment) {
      Toast.fire({
        icon: 'warning',
        title: 'Please record a payment before saving.'
      });
      return;
    }
    closeModal();
  };

  const renderCourseFeeContent = () => {
    const leftFields = [
      {
        label: "Original Fee:",
        value: `₹${Number(feeSummary.actual_fee || 0).toLocaleString("en-IN")}`,
      },
      {
        label: "Discounted Fee:",
        value: `₹${Number(feeSummary.discounted_fee || 0).toLocaleString("en-IN")}`,
      },
      {
        label: "Paid So Far:",
        value: (
          <span className="text-success">
              ₹{Number(feeSummary.fee_paid || 0).toLocaleString("en-IN")}
            </span>
        ),
      },
    ];

    const rightFields = [
      {
        label: "Remaining Balance:",
        value: (
          <span className="text-danger">
              ₹{Number(feeSummary.fee_balance || 0).toLocaleString("en-IN")}
            </span>
        ),
      },
      {
        label: "Next Installment No.:",
        value: (
          <span className="badge badge-installment">
                #{feeSummary.installment_number || 1}
              </span>
        ),
      },
    ];

    return (
      <div className="fee-summary-columns">
        <div className="fee-column fee-column-left">
          {leftFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
          </div>
          ))}
        </div>
        <div className="fee-column-divider" />
        <div className="fee-column fee-column-right">
          {rightFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
  };

  const renderPlacementFeeContent = () => {
    const placementActualFee = Number(leadDetails?.placement_fee || 0);
    const placementDiscountedFee = Number(leadDetails?.placement_discounted_fee || 0);
    const placementPaid = Number(leadDetails?.placement_paid || 0);
    // Calculate balance based on discounted fee if available, otherwise use actual fee
    const feeForBalance = placementDiscountedFee || placementActualFee;
    const placementBalance = feeForBalance - placementPaid;
    
    if (!placementActualFee) {
      return <p className="text-muted mb-0">No placement fee has been configured for this lead.</p>;
    }
    
    const leftFields = [
      {
        label: "Placement Actual Fee:",
        value: `₹${placementActualFee.toLocaleString("en-IN")}`,
      },
      {
        label: "Placement Discounted Fee:",
        value: `₹${placementDiscountedFee.toLocaleString("en-IN")}`,
      },
      {
        label: "Paid So Far:",
        value: (
          <span className="text-success">
            ₹{placementPaid.toLocaleString("en-IN")}
          </span>
        ),
      },
    ];

    const rightFields = [
      {
        label: "Remaining Balance:",
        value: (
          <span className="text-danger">
            ₹{Math.max(placementBalance, 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        label: "Status:",
        value: leadDetails?.placement_paid_status || "—",
      },
    ];

    return (
      <div className="fee-summary-columns">
        <div className="fee-column fee-column-left">
          {leftFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
        </div>
          ))}
        </div>
        <div className="fee-column-divider" />
        <div className="fee-column fee-column-right">
          {rightFields.map((field) => (
            <div className="info-row" key={field.label}>
              <span className="info-label">{field.label}</span>
              <span className="info-value">{field.value}</span>
      </div>
          ))}
      </div>
    </div>
  );
  };


  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
      <div className="payment-page max-w-[1500px] mx-auto space-y-6">
      <div className="payment-header bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 p-4 md:p-6 flex flex-col items-start gap-4">
        <div>
          <h4 className="text-xl font-semibold text-slate-900">Payment Records &amp; Invoices</h4>
        </div>
        <button className="record-btn" onClick={openModal}>
          <BsCashCoin /> Record Student Payment
        </button>
      </div>

      <div className="records-card bg-white border border-slate-200 rounded-2xl shadow-sm">
        <header>
          <div className="row align-items-center mb-3 no-gutter-row">
            <div className="col-md-6">
              <h5>
                <BsTable /> All Payment Logs
            </h5>
            </div>
            <div className="col-md-6 actions">
              <button
                className="btn-filter"
                onClick={() => setShowFilters(true)}
                type="button"
                title="Open Filters"
              >
                <BiFilterAlt /> Filters
              </button>
              <button className="btn-export" onClick={exportLogs} type="button">
                <BsDownload /> Export to Excel
              </button>
            </div>
          </div>
          
          <div className="search-row">
          <input
            type="text"
              value={logsFilter}
              onChange={(e) => setLogsFilter(e.target.value)}
            placeholder="Search by student name, mobile, course, batch, or remarks..."
          />
        </div>
        </header>
        <div className="table-wrapper rounded-[24px] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table
            className="min-w-full text-sm text-slate-800"
            id="paymentLogsTable"
            style={{ borderCollapse: "separate", borderSpacing: "0 10px" }}
          >
            <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                {[
                  ["#", null],
                  ["Date", "payment_date"],
                  ["Student Name", "student_name"],
                  ["Mobile", "mobile"],
                  ["Course", "course_name"],
                  ["Batch", "batch_name"],
                  ["Amount (₹)", "amount"],
                  ["Mode", "payment_mode"],
                  ["Installment", "installment_count"],
                  ["Remarks", "remarks"],
                ].map(([label, key]) => (
                  <th
                    key={label}
                    className={`px-4 py-3 font-semibold text-left ${key ? "cursor-pointer select-none" : ""}`}
                    onClick={() => key && changeSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && sort.key === key && (
                        <span className="text-[10px]">
                          {sort.direction === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-slate-500">
                    Loading payment logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-slate-500">
                    No payment logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log.installment_id || idx}
                    className="bg-white shadow-sm border border-slate-200 rounded-xl"
                  >
                    <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-900 border-e border-slate-100">
                      {log.payment_date ? new Date(log.payment_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-900 border-e border-slate-100">{log.student_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.mobile || "—"}</td>
                    <td className="px-4 py-3 text-slate-900 border-e border-slate-100">{log.course_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.batch_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-900 border-e border-slate-100">
                      ₹{Number(log.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.payment_mode || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 border-e border-slate-100">{log.installment_count || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div className="payment-overlay">
          <div className="payment-modal">
            <header style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDark})` }}>
              <h5>
                <BsCurrencyRupee /> Record Payment
              </h5>
              <button type="button" onClick={closeModal}>
                <FiX />
              </button>
            </header>
            <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
              {/* Student Search - Always Visible */}
              <div className="form-row">
                <div className="form-group col-md-12">
                  <label htmlFor="studentSearch">
                    <BiSearch className="mr-2" />Student/Lead Search
                  </label>
                  <div className="search-container">
                  <input
                      className="form-control"
                        id="studentSearch"
                      placeholder="Search by ID, Mobile Number, or Name..."
                      autoComplete="off"
                      value={
                        selectedLead ? `${selectedLead.name} (${selectedLead.mobile})` : leadSearch
                      }
                        onChange={(e) => {
                        if (selectedLead) {
                          setSelectedLead(null);
                          setLeadDetails(null);
                          setCoursePayments([]);
                          setPlacementPayments([]);
                          setFeeSummary(initialFeeSummary);
                        }
                          setLeadSearch(e.target.value);
                          setLeadOptionsOpen(true);
                        }}
                      onFocus={() => {
                        if (!selectedLead) {
                          setLeadOptionsOpen(true);
                        }
                      }}
                    />
                    {leadOptionsOpen && !selectedLead && (
                      <div
                        id="studentSearchList"
                        className="dropdown-menu w-100 search-dropdown-menu"
                      >
                          {leadsLoading ? (
                          <div className="px-3 py-2 text-muted">Searching leads...</div>
                          ) : filteredLeadOptions.length === 0 ? (
                          <div className="px-3 py-2 text-muted">No matches found</div>
                        ) : (
                          <table className="table table-sm mb-0 lead-results-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Email</th>
                                <th>Course</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLeadOptions.map((lead) => (
                                <tr
                                key={lead.id}
                                onClick={() => selectLead(lead)}
                                  className="lead-result-row"
                                >
                                  <td>{lead.id}</td>
                                  <td className="lead-result-name">{lead.name}</td>
                                  <td>{lead.mobile}</td>
                                  <td>{lead.email || "—"}</td>
                                  <td>{lead.course || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      )}
                    </div>
                  )}
 </div>
                    </div>
                  </div>
              <input type="hidden" id="selectedLeadId" name="lead_id" value={selectedLead?.id || ""} />

              {/* Student Details - Shown after selection */}
              {leadDetails && (
                <div id="leadDetailsBox" className="info-card lead-details">
                  <h5 className="payment-section-header">
                    <BsPersonBadge className="mr-2" />Student Details
                  </h5>
                  <div className="student-details-grid">
                    {[
                      [
                        { label: "Name:", value: leadDetails.name || "—" },
                        { label: "College/Company:", value: leadDetails.college_company || "N/A" },
                      ],
                      [
                        { label: "Mobile:", value: leadDetails.mobile_number || "—" },
                        { label: "Location:", value: leadDetails.location || "N/A" },
                      ],
                      [
                        { label: "Email:", value: leadDetails.email || "N/A" },
                        {
                          label: "Status:",
                          value: leadDetails.status ? (
                            <span className="badge badge-status badge-status-blue">
                              {leadDetails.status}
                            </span>
                          ) : (
                            "—"
                          ),
                        },
                      ],
                      [
                        { label: "Course:", value: leadDetails.course_name || "—" },
                        { label: "Assignee:", value: leadDetails.assignee_name || "—" },
                      ],
                      [
                        { label: "Batch:", value: leadDetails.batch_name || "N/A" },
                        { label: "Meta Campaign:", value: leadDetails.meta_campaign_name || "N/A" },
                      ],
                      [
                        { label: "Trainer:", value: leadDetails.trainer_name || "—" },
                        {
                          label: "Paid Status:",
                          value: leadDetails.paid_status ? (
                            <span className="badge badge-status badge-status-green">
                              {leadDetails.paid_status}
                            </span>
                          ) : (
                            "—"
                          ),
                        },
                      ],
                    ].map((pair, idx) => (
                      <div className="student-detail-row" key={`detail-pair-${idx}`}>
                        {pair.map((field) => (
                          <div className="info-row" key={field.label}>
                            <span className="info-label">{field.label}</span>
                            <span className="info-value">{field.value}</span>
                </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Tabs */}
              {selectedLead && (() => {
                const cardTypeName = String(leadDetails?.card_type_name || "").toLowerCase();
                const showTraining = !leadDetails?.card_type_id || cardTypeName.includes("training");
                const showPlacement = !leadDetails?.card_type_id || cardTypeName.includes("placement");

                if (!showTraining && !showPlacement) return null;

                return (
                  <div className="info-card tab-switcher tab-switcher-card">
                    <div className="tab-group">
                      {showTraining && (
                        <button
                          type="button"
                          className={`tab-btn ${feeTab === "course" ? "active" : ""}`}
                          onClick={() => setFeeTab("course")}
                        >
                          Course Fees
                        </button>
                      )}
                      {showPlacement && (
                        <button
                          type="button"
                          className={`tab-btn ${feeTab === "placement" ? "active" : ""}`}
                          onClick={() => setFeeTab("placement")}
                        >
                          Placement Fees
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Fee Summary */}
              <div id="feeInfoBox" className="info-card fee-summary">
                <h5 className="payment-section-header mb-3">
                  <BsCashStack className="mr-2" />Fee Summary
                </h5>
                {selectedLead ? (
                  feeTab === "course" ? renderCourseFeeContent() : renderPlacementFeeContent()
                ) : (
                  <div className="empty-state-panel">
                    Select a student to view {feeTab === "course" ? "course" : "placement"} fee information.
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div id="prevPaymentsBox" className="info-card payment-history">
                  <h5 className="payment-section-header">
                  <BsClockHistory className="mr-2" />
                  {feeTab === "course"
                    ? "Course Payment History"
                    : "Placement Payment History"}
                  </h5>
                {!selectedLead ? (
                  <div className="empty-state-panel">
                    Select a student to view payment history.
                          </div>
                ) : (feeTab === "course" ? coursePayments : placementPayments).length >
                  0 ? (
                  <div className="payment-history-table-wrapper">
                    <table className="payment-history-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Amount (₹)</th>
                          <th>Payment Mode</th>
                          <th>Installment</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(feeTab === "course" ? coursePayments : placementPayments)
                          .slice()
                          .reverse()
                          .map((payment, idx, arr) => {
                            const key =
                              payment.installment_id ||
                              payment.placement_installment_id ||
                              idx;
                            return (
                              <tr key={key}>
                                <td>{arr.length - idx}</td>
                                <td>
                                  {payment.payment_date
                                    ? new Date(payment.payment_date).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td>
                                  ₹
                                  {Number(payment.amount || 0).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>{payment.payment_mode || "—"}</td>
                                <td>
                                  <span className="installment-badge">
                                    #{payment.installment_count || "—"}
                                  </span>
                                </td>
                                <td className="remarks-cell">{payment.remarks || "—"}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                        </div>
                ) : (
                  <div className="empty-state-panel">
                    No {feeTab === "course" ? "course" : "placement"} payments recorded yet.
                </div>
                )}
              </div>

              {/* Payment Details - Always visible after selection */}
              {selectedLead && (
                <div className="info-card payment-details-card">
                  <div className="payment-details-header">
                    <button type="button" className="payment-link">
                      <BsCreditCard /> {feeTab === "course" ? "Add Course Payment" : "Add Placement Payment"}
                    </button>
                  </div>
                  <div className="payment-details-grid">
                    <div className="form-group">
                      <label htmlFor="amount">
                        <BsCurrencyRupee /> Amount Paid (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        name="amount"
                        min="1"
                        placeholder="Enter Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="paymentDate">
                        <BsCalendarEvent /> Payment Date
                      </label>
                      <div className="input-icon-wrapper">
                        <input
                          type="date"
                          className="form-control input-has-icon"
                          id="paymentDate"
                          name="payment_date"
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          required
                        />
                        <BsCalendarEvent className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="paymentMode">
                        <BsWallet2 /> Payment Mode
                      </label>
                      <select
                        className="form-control"
                        id="paymentMode"
                        name="payment_mode"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        required
                      >
                        <option value="">Select Mode</option>
                        {PAYMENT_MODES.map((pm) => (
                          <option key={pm} value={pm}>
                            {pm}
                          </option>
                        ))}
                      </select>
                  </div>
                </div>
                  <div className="form-group mb-0">
                    <label htmlFor="remarks">
                      <BsChatLeftText /> Remarks
                    </label>
                    <textarea
                      className="form-control"
                      id="remarks"
                      name="remarks"
                      rows={2}
                      placeholder="Enter Any Additional Notes (Optional)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <div className="payment-actions">
                <button
                  type="button"
                      className="btn-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                      type="button"
                      className="btn-placement"
                  disabled={saving || !selectedLead?.id}
                      onClick={recordPayment}
                    >
                      {saving
                        ? "Recording..."
                        : feeTab === "placement"
                        ? "Record Placement Payment"
                        : "Record Course Payment"}
                </button>
              </div>
                </div>
              )}

              {/* Trainer Share Breakdown - Shown when amount entered */}
              {feeTab === "course" && shareRows.length > 0 && (
                <div id="shareBreakdown" className="info-card mt-4">
                  <h5 className="payment-section-header">
                    <BsCashStack className="mr-2" />Share Breakdown
                  </h5>
                  <div className="share-grid">
                    {shareRows.map((row) => (
                      <div key={row.label} className="share-card">
                        <div>
                          <div className="label">{row.label}</div>
                          <div className="student-label">
                            {row.pct}% share
                          </div>
                        </div>
                        <div className="value">
                          ₹{row.amount.toLocaleString("en-IN")}
                </div>
              </div>
                    ))}
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Filter Modal with Date Range */}
      <PaymentFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Payment Filters"
        sections={filterSections}
        selected={filters}
        onToggle={handleToggleFilter}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
        onCancel={() => setShowFilters(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
    </div>
    </div>
  );
}
