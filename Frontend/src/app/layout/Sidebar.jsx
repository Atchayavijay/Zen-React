// File: src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom'
import {
  MdArchive,
  MdBarChart,
  MdCalendarToday,
  MdCampaign,
  MdCheckCircle,
  MdCollectionsBookmark,
  MdDashboard,
  MdGroups,
  MdInsights,
  MdNotificationsActive,
  MdPeople,
  MdReceipt,
  MdSettings,
  MdShare,
  MdStar,
  MdTextFields,
  MdUpload,
} from 'react-icons/md'

const menuItems = [
  { icon: <MdDashboard style={{ color: '#0d6efd' }} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <MdUpload style={{ color: '#dc3545' }} />, label: 'Lead Bulk Upload', path: '/lead-bulk-upload' },
  { icon: <MdCalendarToday style={{ color: '#6f42c1' }} />, label: 'Batch Management', path: '/batches' },
  { icon: <MdCollectionsBookmark style={{ color: '#e83e8c' }} />, label: 'Course Management', path: '/courses' },
  { icon: <MdGroups style={{ color: '#fd7e14' }} />, label: 'Trainer Management', path: '/trainers' },
  { icon: <MdPeople style={{ color: '#000000' }} />, label: 'Users Management', path: '/users' },
  { icon: <MdCampaign style={{ color: '#1976d2' }} />, label: 'Meta Campaigns', path: '/meta-campaigns' },
  { icon: <MdCheckCircle style={{ color: '#28a745' }} />, label: 'Attendance Tracking', path: '/attendance' },
  { icon: <MdInsights style={{ color: '#0d6efd' }} />, label: 'Payment Insights', path: '/payments' },
  { icon: <MdReceipt style={{ color: '#17a2b8' }} />, label: 'Payments & Invoices', path: '/invoices' },
  { icon: <MdShare style={{ color: '#fd7e14' }} />, label: 'Trainer Share', path: '/share' },
  { icon: <MdTextFields style={{ color: '#ff69b4' }} />, label: 'Certification Portal', path: '/certifications' },
  { icon: <MdNotificationsActive style={{ color: '#8a2be2' }} />, label: 'Announcements', path: '/announcements' },
  { icon: <MdBarChart style={{ color: '#0d6efd' }} />, label: 'Reports & Analytics', path: '/reports' },
  { icon: <MdArchive style={{ color: '#343a40' }} />, label: 'Archived Leads', path: '/archived' },
  { icon: <MdStar style={{ color: '#ffc107' }} />, label: 'Hall Of Fame', path: '/hall-of-fame' },
  { icon: <MdSettings style={{ color: '#6c757d' }} />, label: 'System & Settings', path: '/settings' },
]

export default function Sidebar({ isOpen }) {
  const location = useLocation()

  return (
    <aside
      className={`fixed top-0 left-0 z-40 flex h-screen flex-col overflow-y-auto overflow-x-hidden border-r bg-white px-1.5 pb-0.5 pt-14 text-xs shadow-xs transition-all duration-300 ${
        isOpen ? 'w-58' : 'w-16'
      }`}
      style={{ minHeight: '100vh', height: '100vh' }}
    >
      {isOpen && (
        <div className="mb-3">
          <h2 className="px-1 text-[9px] font-semibold uppercase tracking-wider text-red-500">Main</h2>
        </div>
      )}

      <ul className="flex flex-1 flex-col justify-evenly text-xs font-semibold text-gray-700">
        {menuItems.map(({ icon, label, path }) => {
          const isActive =
            location.pathname === path ||
            (path === '/dashboard' && location.pathname === '/')
          return (
            <li key={path} className="flex">
              <Link
                to={path}
                title={!isOpen ? label : ''}
                className={`flex w-full items-center gap-2 rounded px-2 py-2 transition-colors duration-150 ${
                  isActive ? 'bg-gray-200 font-semibold text-primary' : 'hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : ''}`}
                style={{ minHeight: 36 }}
              >
                <span className="flex-shrink-0 text-[17px]">{icon}</span>
                {isOpen && <span className="truncate text-xs leading-5">{label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
