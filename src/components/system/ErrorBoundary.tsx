/**
 * Error Boundary Component
 * 
 * مكون لالتقاط الأخطاء في React وعرض واجهة بديلة
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureError, showReportDialog } from '@/services/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary لالتقاط الأخطاء في مكونات React
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('❌ Error Boundary caught an error:', error, errorInfo);

    // تسجيل الخطأ في Sentry
    const eventId = captureError(error, {
      level: 'error',
      tags: {
        component: 'ErrorBoundary',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({
      errorInfo,
      eventId,
    });

    // استدعاء callback إذا كان موجود
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReportError = (): void => {
    if (this.state.eventId) {
      showReportDialog(this.state.eventId);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // إذا كان هناك fallback مخصص
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // عرض واجهة الخطأ الافتراضية
      return (
        <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/10 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <Card className="shadow-2xl border-destructive/20">
              <CardHeader className="text-center pb-4 border-b border-destructive/10">
                <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <CardTitle className="text-3xl mb-2">حدث خطأ غير متوقع</CardTitle>
                <CardDescription className="text-base">
                  نعتذر عن الإزعاج. فريقنا التقني تم إشعاره تلقائياً بالمشكلة.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* معلومات الخطأ */}
                <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/10">
                  <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    تفاصيل الخطأ
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm font-mono text-muted-foreground break-all">
                      {this.state.error?.message || 'خطأ غير معروف'}
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Stack Trace (للمطورين)
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>

                {/* Event ID */}
                {this.state.eventId && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>رقم التتبع: <code className="text-xs bg-muted px-2 py-1 rounded">{this.state.eventId}</code></p>
                    <p className="mt-1">يمكنك استخدام هذا الرقم عند التواصل مع الدعم الفني</p>
                  </div>
                )}

                {/* الإجراءات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    المحاولة مرة أخرى
                  </Button>

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    إعادة تحميل الصفحة
                  </Button>

                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 ml-2" />
                    العودة للصفحة الرئيسية
                  </Button>

                  {this.state.eventId && (
                    <Button
                      onClick={this.handleReportError}
                      variant="outline"
                      className="w-full"
                    >
                      <Bug className="w-4 h-4 ml-2" />
                      إبلاغ عن المشكلة
                    </Button>
                  )}
                </div>

                {/* نصائح */}
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <h4 className="font-medium">💡 نصائح للحل:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>جرب إعادة تحميل الصفحة</li>
                    <li>تأكد من اتصالك بالإنترنت</li>
                    <li>امسح ذاكرة التخزين المؤقت للمتصفح</li>
                    <li>إذا استمرت المشكلة، تواصل مع الدعم الفني</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* معلومات إضافية للمطورين */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Card className="mt-4 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600 dark:text-yellow-500">
                    معلومات المطورين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <details>
                    <summary className="cursor-pointer font-medium mb-2">
                      Component Stack
                    </summary>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC لإضافة Error Boundary لأي مكون
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

/**
 * Error Boundary خفيف للمكونات الصغيرة
 */
export const LightErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return fallback || (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">حدث خطأ في هذا المكون</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => setHasError(false)}
        >
          <RefreshCw className="w-3 h-3 ml-1" />
          المحاولة مرة أخرى
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

// تصدير مع Sentry Integration
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            حدث خطأ
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetError} className="w-full">
            المحاولة مرة أخرى
          </Button>
        </CardContent>
      </Card>
    </div>
  ),
});

export default ErrorBoundary;
