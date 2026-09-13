import { Link, Navigate } from 'react-router-dom';
import { TrendingUp, FileText, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-primary font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
            <span>MedRecords</span>
          </div>
          <div className="space-x-4">
            <Link to="/login" className="text-slate-600 hover:text-primary font-medium">Log in</Link>
            <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">Sign up</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight sm:text-6xl mb-6">
          Take control of your <span className="text-primary">health history</span>
        </h1>
        <p className="mt-4 text-xl text-slate-600 max-w-3xl mb-10">
          Securely store, organize, and analyze your medical records. Automatically extract key health parameters using AI-powered OCR to visualize your health trends over time.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/signup" className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Get Started Free
          </Link>
          <Link to="/login" className="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors">
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Organization</h3>
            <p className="text-slate-600 text-sm">Upload PDFs and images. We automatically extract text and categorize your reports.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Health Trends</h3>
            <p className="text-slate-600 text-sm">Visualize your blood test results over time with beautiful, interactive charts.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Secure & Private</h3>
            <p className="text-slate-600 text-sm">Your medical data is encrypted and securely stored. Only you have access to your records.</p>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm mt-12">
        <p>Disclaimer: This application is for organizing personal records and is not a substitute for professional medical advice.</p>
        <p className="mt-2">&copy; 2026 MedRecords Organiser. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
