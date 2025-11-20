import React, { useEffect, useMemo, useState } from "react";

/**
 * Reusable full-page filter modal.
 *
 * Props:
 * - isOpen: boolean – controls visibility.
 * - onClose: function – called when close button pressed.
 * - title: string – main heading.
 * - subtitle: string (optional) – secondary heading text.
 * - sections: Array<{ key, title, options: Array<{ value, label }> }>
 * - selected: Record<sectionKey, Array<string>>
 * - onToggle: (sectionKey, value) => void
 * - onClear: () => void
 * - onApply: () => void
 */
export default function FullPageFilterModal({
  isOpen,
  onClose,
  title = "Filters",
  sections = [],
  selected = {},
  onToggle,
  onClear,
  onApply,
  onCancel,
  isLoading = false,
  error = null,
}) {
  useBodyScrollLock(isOpen);
  const [searchQueries, setSearchQueries] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setSearchQueries({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen select-none flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 md:px-8 md:py-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 md:h-10 md:w-10"
          aria-label="Close filters"
        >
          <span className="text-xl leading-none md:text-2xl">×</span>
        </button>
      </header>

      <main className="flex-1 overflow-hidden px-4 pb-5 pt-3 md:px-8 md:pb-6 md:pt-4">
        {error && (
          <div className="mx-1 mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 md:text-sm">
            {error}
          </div>
        )}
        <div className="relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-white/60 px-3 py-3 md:px-5 md:py-4">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs font-medium text-slate-500 md:text-sm">
                Loading filters…
              </p>
            </div>
          )}
          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 ${
              isLoading ? "pointer-events-none blur-[1px]" : ""
            }`}
          >
            {sections.map((section) => {
              const searchValue = searchQueries[section.key] || "";
              const options = Array.isArray(section.options)
                ? section.options.filter((option) =>
                    searchValue
                      ? String(option.label || "")
                          .toLowerCase()
                          .includes(searchValue.toLowerCase())
                      : true
                  )
                : [];

              return (
                <FilterSection
                  key={section.key}
                  title={section.title}
                  options={options}
                  searchValue={searchValue}
                  selectedValues={selected[section.key] || []}
                  disabled={isLoading}
                  onSearch={(value) =>
                    setSearchQueries((prev) => ({
                      ...prev,
                      [section.key]: value,
                    }))
                  }
                  onToggle={(value) => onToggle?.(section.key, value)}
                />
              );
            })}
          </div>
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4 md:px-10 md:py-5">
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-blue-600 transition hover:text-blue-800 md:text-sm"
        >
          Clear All
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
          onClick={onCancel || onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:px-6 md:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-700 md:px-7 md:text-sm"
          >
            Apply Filters
          </button>
        </div>
      </footer>
    </div>
  );
}

function FilterSection({
  title,
  options = [],
  selectedValues = [],
  searchValue = "",
  onSearch,
  onToggle,
  disabled = false,
}) {
  return (
    <section className="flex h-[240px] flex-col rounded-lg border border-slate-200 bg-white/60 p-3 shadow-sm transition hover:border-blue-200 hover:bg-white md:h-[260px]">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-900 md:text-xs">
          {title}
        </h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-600 md:text-[10px]">
          {selectedValues.length}/{options.length}
        </span>
      </div>
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 shadow-inner transition placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 md:text-xs"
          disabled={disabled}
          value={searchValue}
          onChange={(event) => onSearch?.(event.target.value)}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 md:h-3.5 md:w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            />
          </svg>
        </span>
      </div>
      <div className="filter-scroll flex-1 overscroll-contain pr-1 text-[11px] text-slate-700 md:text-xs">
        {options.length === 0 ? (
          <p className="text-[11px] text-slate-400">No options available.</p>
        ) : (
          <ul className="space-y-1.5">
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <li key={option.value}>
                  <label className="flex cursor-pointer select-none items-center gap-2 rounded-md border border-transparent px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 md:h-3.5 md:w-3.5"
                      disabled={disabled}
                      checked={checked}
                      onChange={() => onToggle?.(option.value)}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function useBodyScrollLock(lock) {
  useEffect(() => {
    if (typeof document === "undefined" || !lock) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [lock]);
}

// ---------------------------------------------------------------------------
// Usage example
// ---------------------------------------------------------------------------
export function FullPageFilterModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState({
    statuses: ["Enquiry"],
    assignees: [],
  });

  const sections = useMemo(
    () => [
      {
        key: "statuses",
        title: "Status",
        options: [
          { value: "enquiry", label: "Enquiry" },
          { value: "prospect", label: "Prospect" },
          { value: "enrollment", label: "Enrollment" },
          { value: "training", label: "Training Progress" },
        ],
      },
      {
        key: "assignees",
        title: "Assignee",
        options: [
          { value: "ajith", label: "Ajith Kumar" },
          { value: "anu", label: "Anoushka" },
          { value: "balaji", label: "Balaji" },
        ],
      },
    ],
    []
  );

  const handleToggle = (sectionKey, value) => {
    setSelected((prev) => {
      const nextValues = new Set(prev[sectionKey] || []);
      if (nextValues.has(value)) {
        nextValues.delete(value);
      } else {
        nextValues.add(value);
      }
      return { ...prev, [sectionKey]: Array.from(nextValues) };
    });
  };

  const handleClear = () => setSelected({});
  const handleApply = () => {
    console.log("Applied filters:", selected);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
      >
        Open Filters
      </button>

      <FullPageFilterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        sections={sections}
        selected={selected}
        onToggle={handleToggle}
        onClear={handleClear}
        onApply={handleApply}
        subtitle="Choose multiple filters to refine the dashboard results."
      />
    </div>
  );
}


