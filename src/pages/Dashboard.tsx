import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { localDb } from '../utils/localDb';
import { useAuth } from '../contexts/AuthContext';
import type { MedicalDocument, HealthParameter } from '../types';
import { FileText, Activity, Clock, ChevronRight, UploadCloud, FileType, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalParams: 0,
    latestUpload: null as number | null,
  });
  
  const [recentDocs, setRecentDocs] = useState<MedicalDocument[]>([]);
  const [latestParams, setLatestParams] = useState<HealthParameter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        const docs = await localDb.getDocuments(currentUser.uid);
        setRecentDocs(docs.slice(0, 5));

        const params = await localDb.getHealthParameters(currentUser.uid);
        
        // Deduplicate parameter names (keep only the most recent for each name)
        const uniqueParams = params.reduce((acc, curr) => {
          if (!acc.find(p => p.parameterName === curr.parameterName)) {
            acc.push(curr);
          }
          return acc;
        }, [] as HealthParameter[]);
        
        setLatestParams(uniqueParams.slice(0, 4));

        setStats({
          totalDocs: docs.length,
          totalParams: params.length,
          latestUpload: docs.length > 0 ? docs[0].uploadDate : null
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userProfile?.fullName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 mt-1">Here is a summary of your medical records and health status.</p>
        </div>
        <Link 
          to="/upload" 
          className="flex items-center px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0 w-fit"
        >
          <UploadCloud className="w-5 h-5 mr-2" />
          Upload New Record
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Documents</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalDocs}</h3>
            <Link to="/records" className="text-sm text-primary hover:underline mt-2 inline-block">View all records</Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl mr-4">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Extracted Parameters</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalParams}</h3>
            <Link to="/trends" className="text-sm text-primary hover:underline mt-2 inline-block">View health trends</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Last Upload</p>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {stats.latestUpload ? format(stats.latestUpload, 'MMM d, yyyy') : 'No uploads yet'}
            </h3>
            {stats.latestUpload && (
              <p className="text-sm text-slate-500 mt-1">{format(stats.latestUpload, 'h:mm a')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Records */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Records</h2>
            <Link to="/records" className="text-sm font-medium text-primary flex items-center hover:underline">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {recentDocs.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No records found</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Upload your first medical report to start tracking your health history.</p>
                <Link to="/upload" className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                  Upload Record
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDocs.map(doc => (
                  <Link 
                    key={doc.id} 
                    to={`/records/${doc.id}`}
                    className="flex items-center p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shrink-0">
                      <FileType className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                        {doc.fileName}
                      </h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <span className="truncate">{doc.category || 'General'}</span>
                        <span className="mx-2">•</span>
                        <span>{format(doc.uploadDate, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      {doc.processingStatus === 'Processed' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Processed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Health Parameters */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Latest Vitals</h2>
            <Link to="/trends" className="text-sm font-medium text-primary flex items-center hover:underline">
              Details <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-1">
            {latestParams.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Activity className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Upload reports to see extracted parameters here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {latestParams.map((param, index) => {
                  let statusColor = 'bg-slate-100 text-slate-700';
                  let statusIcon = null;
                  
                  if (param.status === 'HIGH') {
                    statusColor = 'bg-red-50 text-red-700 border-red-200';
                    statusIcon = <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />;
                  } else if (param.status === 'LOW') {
                    statusColor = 'bg-orange-50 text-orange-700 border-orange-200';
                    statusIcon = <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />;
                  } else if (param.status === 'NORMAL') {
                    statusColor = 'bg-green-50 text-green-700 border-green-200';
                    statusIcon = <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
                  }

                  return (
                    <div key={index} className="flex flex-col p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700">{param.parameterName}</span>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                          {statusIcon}
                          {param.status}
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-slate-900 mr-1">{param.value}</span>
                        <span className="text-xs text-slate-500 font-medium">{param.unit}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {format(param.testDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
