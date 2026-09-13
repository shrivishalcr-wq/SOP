import { Component } from 'react';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('error-boundary');

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error('Unhandled render error', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>An unexpected error occurred</h2>
          <p className="vc-text-secondary" style={{ marginTop: 8 }}>
            The error has been logged. Please refresh the page and try again.
          </p>
          <button type="button" className="vc-btn vc-btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
