// File: src/components/Navbar.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaCog,
  FaFilter,
  FaSearch,
  FaSignOutAlt,
  FaTh,
  FaWhatsapp,
} from "react-icons/fa";
import { MdRedo, MdUndo } from "react-icons/md";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import FullPageFilterModal from "@features/leads/modals/FullPageFilterModal";
import logoImage from "@assets/logo.png";
import userAvatar from "@assets/user1.jpg";

// Helper function to get user initials
const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
};

const buildEmptyFilters = () => ({
  courseTypes: [],
  courses: [],
  statuses: [],
  timePeriods: [],
  trainers: [],
  paidStatuses: [],
  batches: [],
  sources: [],
  assignees: [],
  businessUnits: [],
  cardTypes: [],
});

export default function Navbar({
  toggleSidebar,
  isSidebarOpen,
  trainers = [],
  courseTypes = [],
  batches = [],
  courses = [],
  sources = [],
  assignees = [],
  units = [],
  cardTypes = [],
  filtersLoading = false,
  filtersError = null,
  onFilterApply = (filters) => {
    console.log("Filters applied:", filters);
  },
  onLogout = () => {
    console.log("[Navbar] Default onLogout called");
  },
  handleUndo,
  handleRedo,
  undoDisabled = false,
  redoDisabled = false,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(buildEmptyFilters);
  const [pendingFilters, setPendingFilters] = useState(buildEmptyFilters);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [username, setUsername] = useState(null);

  // Load user profile image and username from localStorage
  useEffect(() => {
    const storedImage = localStorage.getItem("profile_image");
    const storedUsername = localStorage.getItem("username");
    if (storedImage) {
      setUserProfileImage(storedImage);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    if (filterOpen) {
      setPendingFilters(selectedFilters);
    }
  }, [filterOpen, selectedFilters]);

  const dispatchFiltersApplied = useCallback((filters) => {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("zen:filtersApplied", { detail: filters })
        );
      }
    } catch (error) {
      console.warn("Unable to dispatch filter event", error);
    }
  }, []);

  const filterSections = useMemo(() => {
    const toOptions = (items = [], labelKey = "name", valueKey = "id") =>
      Array.isArray(items)
        ? items.map((item) => {
            if (typeof item === "string") {
              return { value: item, label: item };
            }
            const value = item[valueKey] ?? item.id ?? item._id ?? item;
            const label =
              item[labelKey] ??
              item.name ??
              item.title ??
              item.course_type ??
              value;
            return { value, label };
          })
        : [];

    const statusOptions = [
      "Enquiry",
      "Prospect",
      "Enrollment",
      "Training Progress",
      "Hands on Project",
      "Certification",
      "CV Build",
      "Mock Interviews",
      "Live Interviews",
      "Placement",
      "On Hold",
      "Archived",
    ].map((status) => ({ value: status, label: status }));

    const timePeriodOptions = [
      "All Time",
      "Today",
      "This Week",
      "This Month",
      "This Year",
    ].map((period) => ({
      value: period,
      label: period,
    }));

    const feeStatusOptions = ["Paid", "Not Paid", "Partially Paid"].map(
      (item) => ({ value: item, label: item })
    );

    return [
      {
        key: "courseTypes",
        title: "Course Type",
        options: toOptions(courseTypes, "course_type", "course_type"),
      },
      {
        key: "courses",
        title: "Course",
        options: toOptions(courses, "name", "id"),
      },
      { key: "statuses", title: "Status", options: statusOptions },
      { key: "timePeriods", title: "Time Period", options: timePeriodOptions },
      {
        key: "trainers",
        title: "Trainer",
        options: toOptions(trainers, "name", "name"),
      },
      { key: "paidStatuses", title: "Fee Status", options: feeStatusOptions },
      {
        key: "batches",
        title: "Batch",
        options: toOptions(batches, "batch_name", "batch_name"),
      },
      {
        key: "sources",
        title: "Source",
        options: toOptions(sources, "name", "id"),
      },
      {
        key: "assignees",
        title: "Assignee",
        options: toOptions(assignees, "name", "id"),
      },
      {
        key: "businessUnits",
        title: "Business Unit",
        options: toOptions(units, "name", "name"),
      },
      {
        key: "cardTypes",
        title: "Card Type",
        options: toOptions(cardTypes, "name", "name"),
      },
    ];
  }, [
    courseTypes,
    courses,
    trainers,
    batches,
    sources,
    assignees,
    units,
    cardTypes,
  ]);

  const handleUndoClick = () => {
    if (typeof handleUndo === "function") {
      const result = handleUndo();
      if (result === false) {
        Swal.fire({
          icon: "info",
          title: "Oops!",
          text: "No actions to be reverted.",
          showConfirmButton: false,
          timer: 1400,
          timerProgressBar: true,
          position: "center",
          toast: false,
          showClass: { popup: "swal2-animate swal2-fade-in" },
          hideClass: { popup: "swal2-animate swal2-fade-out" },
        });
      }
    }
  };

  const handleRedoClick = () => {
    if (typeof handleRedo === "function") {
      const result = handleRedo();
      if (result === false) {
        Swal.fire({
          icon: "info",
          title: "Oops!",
          text: "No actions to be reverted.",
          showConfirmButton: false,
          timer: 1400,
          timerProgressBar: true,
          position: "center",
          toast: false,
          showClass: { popup: "swal2-animate swal2-fade-in" },
          hideClass: { popup: "swal2-animate swal2-fade-out" },
        });
      }
    }
  };

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-full items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm">
            <img src={logoImage} alt="Zen Logo" className="mr-2.5 h-5 w-5" />
            <span className="ml-0.5 font-semibold">Zen</span>
          </div>

          <button
            onClick={() => toggleSidebar()}
            className="ml-3 block"
            aria-label="Toggle sidebar"
          >
            <div className="flex flex-col items-center justify-center space-y-0.5">
              <span className="h-0.5 w-4 bg-gray-400" />
              <span className="h-0.5 w-4 bg-gray-400" />
              <span className="h-0.5 w-4 bg-gray-400" />
            </div>
          </button>

          <div className="relative ml-2 hidden w-62 md:flex">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-full border border-gray-200 py-0.5 pl-4 pr-2 text-sm shadow-sm focus:outline-none"
            />
            <FaSearch className="absolute right-2 top-2 text-sm text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <button
            onClick={handleUndoClick}
            title="Undo"
            className="flex h-6 w-6 items-center justify-center rounded shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 active:scale-90"
            style={{ boxShadow: "0 2px 8px 0 rgba(60,60,60,0.07)" }}
            disabled={undoDisabled}
          >
            <MdUndo className="h-3 w-4" />
          </button>
          <button
            onClick={handleRedoClick}
            title="Redo"
            className="flex h-6 w-6 items-center justify-center rounded shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 active:scale-90"
            style={{ boxShadow: "0 2px 8px 0 rgba(60,60,60,0.07)" }}
            disabled={redoDisabled}
          >
            <MdRedo className="h-3 w-4" />
          </button>

          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center justify-center"
            aria-label="Open filters"
            title="Filters"
          >
            <FaFilter className="text-gray-500" size={16} />
          </button>

          <FullPageFilterModal
            isOpen={filterOpen}
            onClose={() => {
              setPendingFilters(selectedFilters);
              setFilterOpen(false);
            }}
            sections={filterSections}
            selected={pendingFilters}
            isLoading={filtersLoading}
            error={filtersError}
            onToggle={(sectionKey, value) => {
              setPendingFilters((prev) => {
                const nextValues = new Set(prev[sectionKey] || []);
                if (nextValues.has(value)) {
                  nextValues.delete(value);
                } else {
                  nextValues.add(value);
                }
                return { ...prev, [sectionKey]: Array.from(nextValues) };
              });
            }}
            onClear={() => {
              const empty = buildEmptyFilters();
              setPendingFilters(empty);
            }}
            onApply={() => {
              const applied = { ...pendingFilters };
              setSelectedFilters(applied);
              onFilterApply(applied);
              dispatchFiltersApplied(applied);
              setFilterOpen(false);
            }}
            onCancel={() => {
              setPendingFilters(selectedFilters);
              setFilterOpen(false);
            }}
          />

          <FaCog className="cursor-pointer" />
          <FaWhatsapp className="cursor-pointer" />
          <FaTh className="cursor-pointer" />

          <div className="relative">
            <FaBell className="cursor-pointer text-pink-600" />
            <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              5
            </span>
          </div>

          <div className="relative">
            {userProfileImage ? (
              <img
                src={`data:image/png;base64,${userProfileImage}`}
                alt={username || "User"}
                className="h-8 w-8 rounded-full border object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`h-8 w-8 rounded-full border-2 border-gray-300 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold ${
                userProfileImage ? 'hidden' : ''
              }`}
              title={username || "User"}
            >
              {getInitials(username)}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 rounded px-2 py-1 text-red-500 transition-colors hover:bg-red-50"
            title="Logout"
          >
            <FaSignOutAlt className="h-4 w-4" />
            <span className="hidden text-xs sm:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
