// Central icon map for EditLeadModal (react-icons)
import {
  FaUser,
  FaBook,
  FaUserTie,
  FaUniversity,
  FaTags,
  FaInfoCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaBuilding,
  FaMapMarkerAlt,
  FaLink,
  FaEllipsisV,
  FaTimes,
  FaRupeeSign,
  FaPercent,
  FaCheckCircle,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBalanceScale,
  FaClipboardCheck,
  FaLayerGroup,
  FaChalkboardTeacher,
  FaHistory,
  FaCopy,
} from 'react-icons/fa';

export const sectionIcons = {
  personal: FaUser,
  course: FaBook,
  subCourses: FaLayerGroup,
  trainer: FaChalkboardTeacher,
  assignee: FaUserTie,
  financial: FaUniversity,
  classification: FaTags,
  status: FaHistory,
};

export const stripIcons = {
  // Personal Info
  name: FaUser,
  mobile_number: FaPhoneAlt,
  email: FaEnvelope,
  role_id: FaUserTie,
  college_company: FaBuilding,
  location: FaMapMarkerAlt,
  source_id: FaLink,
  // Assignee Info
  assignee_mobile: FaPhoneAlt,
  assignee_phone: FaPhoneAlt,
  user_mobile: FaPhoneAlt,
  assignee_email: FaEnvelope,
  user_email: FaEnvelope,
  referred_by: FaUserTie,
  // Course Details
  course_type_id: FaBook,
  course_id: FaBook,
  batch_id: FaBook,
  trainer_id: FaUserTie,
  training_status: FaInfoCircle,
  training_start_date: FaCalendarAlt,
  training_end_date: FaCalendarAlt,
  unit_id: FaBuilding,
  card_type_id: FaTags,
  // Financial Info
  actual_fee: FaRupeeSign,         // Actual Fee: Rupee icon
  discounted_fee: FaPercent,       // Discounted Fee: Percent icon
  fee_paid: FaCheckCircle,         // Fee Paid: Check Circle icon
  fee_balance: FaBalanceScale,
  paid_status: FaClipboardCheck,
  placement_fee: FaBriefcase,      // Placement Fee: Briefcase icon
  placement_paid: FaMoneyBillWave, // Placement Fee Paid: Money Bill Wave icon
  placement_balance: FaBalanceScale,
  placement_paid_status: FaClipboardCheck,
  trainer_name: FaChalkboardTeacher,
  trainer_mobile: FaPhoneAlt,
  trainer_email: FaEnvelope,
  trainer_share: FaPercent,
  trainer_share_amount: FaRupeeSign,
  amount_paid_trainer: FaMoneyBillWave,
  pending_amount: FaBalanceScale,
  trainer_paid: FaClipboardCheck,
  created_at: FaCalendarAlt,
  updated_at: FaCalendarAlt,
  enrollment_id: FaCopy,
  // Classification
  business_unit: FaBuilding,
  // Status Info
  status: FaInfoCircle,
};

export const FaEllipsisVIcon = FaEllipsisV;
export const FaTimesIcon = FaTimes;
