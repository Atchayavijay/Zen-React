import { useEffect, useRef, useState } from 'react'
import FilterDropdown from '@features/leads/components/FilterDropdown'

export default function NavItems({
  trainers = [],
  courseTypes = [],
  courses = [],
  batches = [],
  sources = [],
  assignees = [],
  units = [],
  cardTypes = [],
  onFilterApply,
  onOpenRightSidebar,
  onOpenWhatsapp,
  notificationsCount = 5,
}) {
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [isAppsOpen, setAppsOpen] = useState(false)
  const [isAlertsOpen, setAlertsOpen] = useState(false)

  const appsRef = useRef(null)
  const alertsRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (appsRef.current && !appsRef.current.contains(e.target)) setAppsOpen(false)
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <li>
        <button
          onClick={() => setFilterOpen(true)}
          title="Filters"
          aria-label="Open filters"
          className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${
            isFilterOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          style={{ width: 32, height: 32 }}
        >
          <i className="fas fa-filter text-sm" />
          <i className="zmdi zmdi-filter-list text-sm" style={{ display: 'none' }} />
          <span style={{ display: 'none', fontSize: '14px' }}>⚪</span>
          <span style={{ display: 'none', fontSize: '10px', fontWeight: 'bold' }}>FLT</span>
        </button>
      </li>

      <li>
        <button
          id="open_right_sidebar"
          onClick={onOpenRightSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <i className="zmdi zmdi-settings top-nav-icon" />
        </button>
      </li>

      <li>
        <button
          onClick={onOpenWhatsapp}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-green-600 transition-colors hover:bg-gray-100"
        >
          <i className="fab fa-whatsapp top-nav-icon" />
        </button>
      </li>

      <li ref={appsRef} className="app-drp dropdown relative">
        <button
          className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          onClick={() => setAppsOpen((open) => !open)}
        >
          <i className="zmdi zmdi-apps top-nav-icon" />
        </button>
        {isAppsOpen && (
          <ul className="app-dropdown absolute right-0 top-full z-50 mt-2 rounded border bg-white shadow-lg">
            <li>
              <div className="app-nicescroll-bar">
                <ul className="app-icon-wrap p-4">
                  <li>
                    <a href="https://mail.google.com/" className="connection-item flex items-center rounded p-2 hover:bg-gray-100">
                      <i className="zmdi zmdi-email-open txt-success mr-2" />
                      <span className="block">e-mail</span>
                    </a>
                  </li>
                  <li>
                    <a href="calendar.html" className="connection-item flex items-center rounded p-2 hover:bg-gray-100">
                      <i className="zmdi zmdi-calendar-check txt-primary mr-2" />
                      <span className="block">calendar</span>
                    </a>
                  </li>
                  <li>
                    <a href="contact-card.html" className="connection-item flex items-center rounded p-2 hover:bg-gray-100">
                      <i className="zmdi zmdi-assignment-account mr-2" />
                      <span className="block">contact</span>
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <div className="app-box-">
                <hr className="light-grey-hr ma-0" />
                <button className="read-all block w-full py-2 text-center hover:bg-gray-100" onClick={(e) => e.preventDefault()}>
                  more
                </button>
              </div>
            </li>
          </ul>
        )}
      </li>

      <li ref={alertsRef} className="alert-drp dropdown relative">
        <button
          className="dropdown-toggle relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          onClick={() => setAlertsOpen((open) => !open)}
        >
          <i className="zmdi zmdi-notifications top-nav-icon" />
          {notificationsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {notificationsCount > 9 ? '9+' : notificationsCount}
            </span>
          )}
        </button>
        {isAlertsOpen && (
          <ul className="alert-dropdown absolute right-0 top-full z-50 mt-2 w-80 rounded border bg-white shadow-lg">
            <li>
              <div className="notification-box-head-wrap flex items-center justify-between border-b p-3">
                <span className="notification-box-head font-semibold">Notifications</span>
                <button className="txt-danger text-sm text-red-600 hover:text-red-800" onClick={(e) => e.preventDefault()}>
                  clear all
                </button>
              </div>
            </li>
            <li>
              <div className="message-nicescroll-bar streamline p-3">
                <div className="sl-item">
                  <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center rounded p-2 hover:bg-gray-50">
                    <div className="mr-3 rounded-full bg-green-500 p-2">
                      <i className="zmdi zmdi-flag text-sm text-white" />
                    </div>
                    <div>
                      <span className="block text-sm">New milestone reached</span>
                      <span className="text-xs text-gray-500">2 minutes ago</span>
                    </div>
                  </a>
                </div>
              </div>
            </li>
          </ul>
        )}
      </li>

      <FilterDropdown
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filters) => {
          onFilterApply?.(filters)
          setFilterOpen(false)
        }}
        trainers={trainers}
        courseTypes={courseTypes}
        courses={courses}
        batches={batches}
        sources={sources}
        assignees={assignees}
        units={units}
        cardTypes={cardTypes}
      />
    </>
  )
}