import React from 'react';
import EditLeadForm from './EditLeadForm';

class EditLeadFormWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Safe error logging - convert to JSON to avoid object issues
    const errorDetails = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack'
    };
    console.error('EditLeadForm Error:', JSON.stringify(errorDetails, null, 2));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Error Loading Form</h2>
            <p className="text-sm text-gray-700 mb-4">
              There was an error loading the edit form. Please try again.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onClose?.();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return <EditLeadForm {...this.props} />;
  }
}

export default EditLeadFormWrapper;
