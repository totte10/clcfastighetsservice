import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "Något gick fel.",
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Okänt fel",
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="glass-card w-full max-w-md p-6 text-center text-foreground">
            <p className="text-sm text-muted-foreground">Appfel</p>
            <h1 className="mt-2 text-xl font-semibold">Vi kunde inte visa sidan</h1>
            <p className="mt-3 text-sm text-muted-foreground">{this.state.message || "Ett oväntat fel uppstod."}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ladda om appen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
