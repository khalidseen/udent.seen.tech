import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring in production
    if (!import.meta.env.DEV) {
      // Could integrate with error tracking service here
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private hardRefresh = () => {
    // Clear all caches and force complete reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cache storage
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Force reload with cache bust
    const url = new URL(window.location.href);
    url.searchParams.set('_refresh', Date.now().toString());
    window.location.href = url.toString();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>حدث خطأ غير متوقع</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>عذراً، حدث خطأ في تحميل هذا المكون.</p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs bg-muted p-2 rounded">
                  <summary>تفاصيل الخطأ</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                </details>
              )}
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={this.handleRetry} 
                  size="sm" 
                  variant="outline"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  إعادة المحاولة
                </Button>
                <Button 
                  onClick={this.hardRefresh} 
                  size="sm" 
                  variant="destructive"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  إعادة تشغيل كاملة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};