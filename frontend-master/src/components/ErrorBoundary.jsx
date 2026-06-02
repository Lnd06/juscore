import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado.</h1>
          <p className="text-gray-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
          <div className="bg-gray-900 text-white p-4 rounded-lg text-left overflow-auto max-w-2xl w-full text-xs font-mono">
            <p className="font-bold text-red-400 mb-2">{this.state.error?.toString()}</p>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Voltar ao Login
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
