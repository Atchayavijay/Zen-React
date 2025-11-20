// Central icon map for Sidebar (react-icons)
import { FaTachometerAlt, FaUpload, FaBoxes, FaBook, FaChalkboardTeacher, FaUsers, FaBullhorn, FaChartBar, FaFolderOpen, FaStar, FaCog, FaUserGraduate, FaHandshake, FaCheckCircle, FaCreditCard, FaFileInvoice, FaBullseye, FaChartPie } from 'react-icons/fa';
import { MdCampaign, MdAnnouncement } from 'react-icons/md';
import { HiOutlineClipboardList } from 'react-icons/hi';
import { BsFillBarChartFill } from 'react-icons/bs';

export const sidebarIcons = {
  dashboard: FaTachometerAlt,
  leadBulkUpload: FaUpload,
  batchManagement: FaBoxes,
  courseManagement: FaBook,
  trainerManagement: FaChalkboardTeacher,
  usersManagement: FaUsers,
  metaCampaigns: MdCampaign,
  attendanceTracking: FaCheckCircle,
  paymentInsights: FaCreditCard,
  paymentsInvoices: FaFileInvoice,
  trainerShare: FaHandshake,
  certificationPortal: FaUserGraduate,
  announcements: MdAnnouncement,
  reportsAnalytics: BsFillBarChartFill,
  archivedLeads: FaFolderOpen,
  hallOfFame: FaStar,
  systemSettings: FaCog,
};
