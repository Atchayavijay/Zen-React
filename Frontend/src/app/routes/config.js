import { lazy } from 'react'

const DashboardMain = lazy(() => import('@features/Dashboard/DashboardMain'))
const LeadBulkUploadMain = lazy(() => import('@features/LeadBulkUpload/LeadBulkUploadMain'))
const CourseManagementMain = lazy(() => import('@features/CourseManagement/CourseManagementMain'))
const MetaCampaignsMain = lazy(() => import('@features/MetaCampaigns/MetaCampaignsMain'))
const BatchManagementMain = lazy(() => import('@features/BatchManagement/BatchManagementMain'))
const TrainerManagementMain = lazy(() => import('@features/TrainerManagement/TrainerManagementMain'))
const UsersManagementMain = lazy(() => import('@features/UsersManagement/UsersManagementMain'))
const AttendanceTrackingMain = lazy(() => import('@features/AttendanceTracking/AttendanceTrackingMain'))
const PaymentInsightsMain = lazy(() => import('@features/PaymentInsights/PaymentInsightsMain'))
const PaymentsInvoicesMain = lazy(() => import('@features/PaymentsInvoices/PaymentsInvoicesMain'))
const TrainerShareMain = lazy(() => import('@features/TrainerShare/TrainerShareMain'))
const CertificationPortalMain = lazy(() => import('@features/CertificationPortal/CertificationPortalMain'))
const AnnouncementsMain = lazy(() => import('@features/Announcements/AnnouncementsMain'))
const ReportsAnalyticsMain = lazy(() => import('@features/ReportsAnalytics/ReportsAnalyticsMain'))
const ArchivedLeadsMain = lazy(() => import('@features/ArchivedLeads/ArchivedLeadsMain'))
const HallOfFameMain = lazy(() => import('@features/HallOfFame/HallOfFameMain'))
const SystemSettingsMain = lazy(() => import('@features/SystemSettings/SystemSettingsMain'))
const LoginPage = lazy(() => import('@features/auth/components/LoginPage'))

const routes = [
  {
    path: '/login',
    component: LoginPage,
    isPublic: true,
  },
  {
    path: '/dashboard',
    component: DashboardMain,
  },
  {
    path: '/lead-bulk-upload',
    component: LeadBulkUploadMain,
  },
  {
    path: '/courses',
    component: CourseManagementMain,
  },
  {
    path: '/batches',
    component: BatchManagementMain,
  },
  {
    path: '/trainers',
    component: TrainerManagementMain,
  },
  {
    path: '/users',
    component: UsersManagementMain,
  },
  {
    path: '/attendance',
    component: AttendanceTrackingMain,
  },
  {
    path: '/payments',
    component: PaymentInsightsMain,
  },
  {
    path: '/invoices',
    component: PaymentsInvoicesMain,
  },
  {
    path: '/share',
    component: TrainerShareMain,
  },
  {
    path: '/certifications',
    component: CertificationPortalMain,
  },
  {
    path: '/announcements',
    component: AnnouncementsMain,
  },
  {
    path: '/meta-campaigns',
    component: MetaCampaignsMain,
  },
  {
    path: '/reports',
    component: ReportsAnalyticsMain,
  },
  {
    path: '/archived',
    component: ArchivedLeadsMain,
  },
  {
    path: '/hall-of-fame',
    component: HallOfFameMain,
  },
  {
    path: '/settings',
    component: SystemSettingsMain,
  },
  {
    path: '/',
    component: DashboardMain,
  },
]

export default routes

