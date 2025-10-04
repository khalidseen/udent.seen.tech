import React from 'react';
import { withLazyLoading } from '@/components/ui/lazy-page';

// Lazy load all main pages for better performance
export const LazyPatients = React.lazy(() => import('./Patients'));
export const LazyAppointments = React.lazy(() => import('./Appointments'));
export const LazyMedicalRecords = React.lazy(() => import('./MedicalRecords'));
export const LazyDoctors = React.lazy(() => import('./Doctors'));
export const LazySettings = React.lazy(() => import('./Settings'));
export const LazyInventory = React.lazy(() => import('./Inventory'));
export const LazyInvoices = React.lazy(() => import('./Invoices'));
export const LazyReports = React.lazy(() => import('./Reports'));
export const LazyTreatments = React.lazy(() => import('./Treatments'));
export const LazyMedications = React.lazy(() => import('./Medications'));
export const LazyPrescriptions = React.lazy(() => import('./Prescriptions'));
export const LazyUsers = React.lazy(() => import('./Users'));
export const LazyNotifications = React.lazy(() => import('./Notifications'));
export const LazyAIInsights = React.lazy(() => import('./AIInsights'));
export const LazyAdvanced3DDental = React.lazy(() => import('./Advanced3DDental'));
export const LazyPayments = React.lazy(() => import('./Payments'));
export const LazyProfile = React.lazy(() => import('./Profile'));

// Wrapped versions with loading states
export const PatientsPage = withLazyLoading(LazyPatients);
export const AppointmentsPage = withLazyLoading(LazyAppointments);
export const MedicalRecordsPage = withLazyLoading(LazyMedicalRecords);
export const DoctorsPage = withLazyLoading(LazyDoctors);
export const SettingsPage = withLazyLoading(LazySettings);
export const InventoryPage = withLazyLoading(LazyInventory);
export const InvoicesPage = withLazyLoading(LazyInvoices);
export const ReportsPage = withLazyLoading(LazyReports);
export const TreatmentsPage = withLazyLoading(LazyTreatments);
export const MedicationsPage = withLazyLoading(LazyMedications);
export const PrescriptionsPage = withLazyLoading(LazyPrescriptions);
export const UsersPage = withLazyLoading(LazyUsers);
export const NotificationsPage = withLazyLoading(LazyNotifications);
export const AIInsightsPage = withLazyLoading(LazyAIInsights);
export const Advanced3DDentalPage = withLazyLoading(LazyAdvanced3DDental);
export const PaymentsPage = withLazyLoading(LazyPayments);
export const ProfilePage = withLazyLoading(LazyProfile);