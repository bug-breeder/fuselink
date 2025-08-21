import React from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-0">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-danger">Something went wrong</h1>
            <p className="text-small text-default-500">
              An unexpected error occurred in the application
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              color="primary" 
              variant="solid"
              onPress={resetError}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button 
              color="default" 
              variant="bordered"
              onPress={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
          <div className="mt-4 text-xs text-default-400">
            If this problem persists, please report it to the development team.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Hook for functional components to use error boundaries
export function useErrorHandler() {
  return (error: Error) => {
    // This will trigger the nearest error boundary
    throw error;
  };
}