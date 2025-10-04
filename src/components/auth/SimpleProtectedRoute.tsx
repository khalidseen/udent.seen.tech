import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface SimpleProtectedRouteProps {
  children: ReactNode;
}

export const SimpleProtectedRoute = ({ children }: SimpleProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();

  console.log('🔐 Protected Route State:', {
    user: user ? '✅ ' + user.email : '❌ None',
    loading,
    initialized
  });

  if (!initialized || loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto' />
          <p className='text-lg font-medium text-gray-700 dark:text-gray-300'>
            جارٍ التحقق من الحساب...
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            الرجاء الانتظار قليلاً
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log(' No user - redirecting to /auth');
    return <Navigate to='/auth' replace />;
  }

  console.log(' Rendering protected content for user:', user.email);
  return <>{children}</>;
};
