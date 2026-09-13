import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { VendorsPage } from '../pages/VendorsPage.jsx';
import { VendorDetailPage } from '../pages/VendorDetailPage.jsx';
import { ResidentsPage } from '../pages/ResidentsPage.jsx';
import { ResidentDetailPage } from '../pages/ResidentDetailPage.jsx';
import { CategoriesPage } from '../pages/CategoriesPage.jsx';
import { RatingsPage } from '../pages/RatingsPage.jsx';
import { AlertsPage } from '../pages/AlertsPage.jsx';
import { ActivityPage } from '../pages/ActivityPage.jsx';
import { PilotReportPage } from '../pages/PilotReportPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/register',
    element: (
      <ProtectedRoute>
        <RegisterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
      { path: 'vendors', element: <VendorsPage />, handle: { title: 'Vendors' } },
      { path: 'vendors/:vendorId', element: <VendorDetailPage />, handle: { title: 'Vendor Detail' } },
      { path: 'residents', element: <ResidentsPage />, handle: { title: 'Residents' } },
      { path: 'residents/:residentId', element: <ResidentDetailPage />, handle: { title: 'Resident Detail' } },
      { path: 'categories', element: <CategoriesPage />, handle: { title: 'Categories' } },
      { path: 'ratings', element: <RatingsPage />, handle: { title: 'Feedback' } },
      { path: 'alerts', element: <AlertsPage />, handle: { title: 'Alerts' } },
      { path: 'activity', element: <ActivityPage />, handle: { title: 'Activity Log' } },
      { path: 'pilot-report', element: <PilotReportPage />, handle: { title: 'Pilot Report' } },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
