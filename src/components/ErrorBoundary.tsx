import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[300px] p-6 bg-rose-50/90 backdrop-blur-xs rounded-2xl border border-rose-200 text-center space-y-4 m-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">เกิดข้อผิดพลาดในการแสดงผล</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'ระบบรีโหลดชั่วคราว กดปุ่มด้านล่างเพื่อกลับสู่หน้าหลัก'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            โหลดข้อมูลหน้าหลักใหม่
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}




