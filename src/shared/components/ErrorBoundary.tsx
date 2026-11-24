import { Component, type ErrorInfo, type ReactNode } from "react";
import { formatError } from "../lib/errorMessage";

const TEXT = {
  title: "界面异常",
  body: "复制记录已保留。\n重新加载后可继续使用。",
  reload: "重新加载",
};

interface State {
  error: unknown;
}

/** Keeps a render error in one component from blanking the whole window. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("UI crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const text = TEXT;
    return (
      <div className="error-boundary" role="alert">
        <h2 className="error-boundary-title">{text.title}</h2>
        <p className="error-boundary-body">{text.body}</p>
        <p className="error-boundary-detail">{formatError(this.state.error, undefined, 160)}</p>
        <button type="button" className="modal-button primary" onClick={() => window.location.reload()}>
          {text.reload}
        </button>
      </div>
    );
  }
}
