'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
              <p className="mb-4 text-muted-foreground">
                An error occurred while rendering this component
              </p>
              <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
