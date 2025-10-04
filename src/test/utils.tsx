/**
 * دوال مساعدة للاختبارات
 * Test Utilities & Helpers
 * 
 * توفر دوال مساعدة لجعل كتابة الاختبارات أسهل وأكثر فعالية
 */

import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';

// ====================================================================
// Query Client للاختبارات
// ====================================================================

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // تجاهل أخطاء الاختبار
    },
  });
}

// ====================================================================
// Wrapper للمكونات مع جميع Providers
// ====================================================================

interface AllTheProvidersProps {
  children: ReactNode;
}

export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <PermissionsProvider>
              {children}
            </PermissionsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// ====================================================================
// دالة Render المخصصة
// ====================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { initialRoute = '/', queryClient, ...renderOptions } = options || {};

  // تعيين المسار الأولي
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  // Wrapper مخصص إذا تم توفير QueryClient
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const client = queryClient || createTestQueryClient();
    
    return (
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <PermissionsProvider>
                {children}
              </PermissionsProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

// ====================================================================
// Mock Data Generators
// ====================================================================

export const mockPatient = (overrides = {}) => ({
  id: 'patient-123',
  name: 'محمد أحمد',
  phone: '0501234567',
  email: 'ahmed@example.com',
  date_of_birth: '1990-01-01',
  gender: 'male',
  national_id: '1012345678',
  clinic_id: 'clinic-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockAppointment = (overrides = {}) => ({
  id: 'appointment-123',
  patient_id: 'patient-123',
  doctor_id: 'doctor-123',
  clinic_id: 'clinic-123',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '10:00',
  duration: 30,
  status: 'scheduled',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockInvoice = (overrides = {}) => ({
  id: 'invoice-123',
  patient_id: 'patient-123',
  clinic_id: 'clinic-123',
  invoice_number: 'INV-001',
  subtotal: 1000,
  tax_rate: 15,
  tax_amount: 150,
  discount_amount: 0,
  total_amount: 1150,
  paid_amount: 0,
  status: 'pending',
  items: [
    {
      description: 'فحص عام',
      quantity: 1,
      unit_price: 1000,
      total: 1000,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockTreatment = (overrides = {}) => ({
  id: 'treatment-123',
  patient_id: 'patient-123',
  doctor_id: 'doctor-123',
  clinic_id: 'clinic-123',
  tooth_number: 11,
  treatment_type: 'filling',
  description: 'حشو سن أمامي',
  cost: 500,
  status: 'completed',
  treatment_date: new Date().toISOString().split('T')[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockDoctor = (overrides = {}) => ({
  id: 'doctor-123',
  name: 'د. أحمد محمد',
  phone: '0501234567',
  email: 'doctor@clinic.com',
  specialization: 'General Dentist',
  license_number: 'LIC-12345',
  clinic_id: 'clinic-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockClinic = (overrides = {}) => ({
  id: 'clinic-123',
  name: 'عيادة الأسنان الحديثة',
  phone: '0501234567',
  email: 'info@clinic.com',
  address: 'الرياض، السعودية',
  license_number: 'CLINIC-123',
  tax_number: 'TAX-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ====================================================================
// دوال مساعدة للـ Async Testing
// ====================================================================

/**
 * انتظار حتى تظهر رسالة Toast
 */
export async function waitForToast(text: string) {
  const { findByText } = await import('@testing-library/react');
  return findByText(text);
}

/**
 * انتظار حتى يختفي عنصر Loading
 */
export async function waitForLoadingToFinish() {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');
  const loadingElements = screen.queryAllByText(/loading|تحميل/i);
  
  if (loadingElements.length > 0) {
    await waitForElementToBeRemoved(() => 
      screen.queryAllByText(/loading|تحميل/i)
    );
  }
}

/**
 * محاكاة تأخير الشبكة
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ====================================================================
// دوال مساعدة للـ Event Testing
// ====================================================================

/**
 * محاكاة إدخال نص في حقل
 */
export async function typeIntoField(element: HTMLElement, text: string) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, text);
}

/**
 * محاكاة النقر على عنصر
 */
export async function clickElement(element: HTMLElement) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.click(element);
}

/**
 * محاكاة اختيار من قائمة منسدلة
 */
export async function selectOption(element: HTMLElement, option: string) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.selectOptions(element, option);
}

// ====================================================================
// دوال مساعدة للـ API Mocking
// ====================================================================

/**
 * إنشاء استجابة API ناجحة
 */
export function mockSuccessResponse<T>(data: T) {
  return {
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  };
}

/**
 * إنشاء استجابة API فاشلة
 */
export function mockErrorResponse(message: string, code = 400) {
  return {
    data: null,
    error: {
      message,
      code,
    },
    status: code,
    statusText: 'Error',
  };
}

// ====================================================================
// تصدير جميع الدوال
// ====================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// استخدام render المخصص كـ default
export { renderWithProviders as render };
