import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import Navbar from "@app/layout/Navbar";
import Sidebar from "@app/layout/Sidebar";
import lookupService from "@shared/services/lookups/lookupService";

function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navbarProps, setNavbarProps] = useState({});
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterData, setFilterData] = useState({
    trainers: [],
    courseTypes: [],
    courses: [],
    batches: [],
    sources: [],
    assignees: [],
    units: [],
    cardTypes: [],
  });
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  const handleUndo = () => {
    if (history.length === 0) return false;
    setHistory((currentHistory) => {
      if (currentHistory.length === 0) return currentHistory;
      setRedoStack((currentRedo) => [columns, ...currentRedo]);
      const previous = currentHistory[currentHistory.length - 1];
      setColumns(previous);
      return currentHistory.slice(0, -1);
    });
    return true;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return false;
    setRedoStack((currentRedo) => {
      if (currentRedo.length === 0) return currentRedo;
      setHistory((currentHistory) => [...currentHistory, columns]);
      const next = currentRedo[0];
      setColumns(next);
      return currentRedo.slice(1);
    });
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchFilters() {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const [
          coursesRes,
          courseTypesRes,
          batchesRes,
          trainersRes,
          assigneesRes,
          unitsRes,
          cardTypesRes,
          sourcesRes,
        ] = await Promise.all([
          lookupService.getCourses(),
          lookupService.getCourseTypes(),
          lookupService.getBatches(),
          lookupService.getTrainers(),
          lookupService.getAssignees(),
          lookupService.getUnits(),
          lookupService.getCardTypes(),
          lookupService.getSources(),
        ]);

        if (cancelled) return;

        setFilterData({
          trainers: trainersRes.success ? trainersRes.data : [],
          courseTypes: courseTypesRes.success ? courseTypesRes.data : [],
          courses: coursesRes.success ? coursesRes.data : [],
          batches: batchesRes.success ? batchesRes.data : [],
          sources: sourcesRes.success ? sourcesRes.data : [],
          assignees: assigneesRes.success ? assigneesRes.data : [],
          units: unitsRes.success ? unitsRes.data : [],
          cardTypes: cardTypesRes.success ? cardTypesRes.data : [],
        });

        const failedCalls = [
          { label: "courses", res: coursesRes },
          { label: "course types", res: courseTypesRes },
          { label: "batches", res: batchesRes },
          { label: "trainers", res: trainersRes },
          { label: "assignees", res: assigneesRes },
          { label: "business units", res: unitsRes },
          { label: "card types", res: cardTypesRes },
          { label: "sources", res: sourcesRes },
        ]
          .filter((item) => item.res && item.res.success === false)
          .map((item) => item.label);

        if (failedCalls.length > 0) {
          setFiltersError(
            `Some filter data failed to load: ${failedCalls.join(", ")}`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setFiltersError(
            error?.message || "Unable to load filter data from the server."
          );
        }
      } finally {
        if (!cancelled) {
          setFiltersLoading(false);
        }
      }
    }

    fetchFilters();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterApply = (filters) => {
    console.log("Filters applied:", filters);
  };

  const childrenWithProps = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child, { setNavbarProps });
    }
    return child;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "md:ml-44" : "md:ml-11"
        }`}
      >
        <Navbar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          trainers={filterData.trainers}
          courseTypes={filterData.courseTypes}
          courses={filterData.courses}
          batches={filterData.batches}
          sources={filterData.sources}
          assignees={filterData.assignees}
          units={filterData.units}
          cardTypes={filterData.cardTypes}
          filtersLoading={filtersLoading}
          filtersError={filtersError}
          onFilterApply={handleFilterApply}
          onLogout={onLogout}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          undoDisabled={history.length === 0}
          redoDisabled={redoStack.length === 0}
          {...navbarProps}
        />

        <main className="overflow-auto px-4 pt-14">{childrenWithProps}</main>
      </div>
    </div>
  );
}

export default Layout;
