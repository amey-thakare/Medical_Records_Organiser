import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { localDb } from '../utils/localDb';
import { useAuth } from '../contexts/AuthContext';
import type { MedicalDocument, HealthParameter } from '../types';
import { format } from 'date-fns';
import { 
  ArrowLeft, FileText, Calendar, Tag, AlertTriangle, 
  Loader2, Download, ExternalLink, Activity, FileType
} from 'lucide-react';

const RecordDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  
  const [document, setDocument] = useState<MedicalDocument | null>(null);
  const [parameters, setParameters] = useState<HealthParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!currentUser || !id) return;
      
      try {
        // 1. Fetch document metadata
        const docData = await localDb.getDocument(id);
        
        if (docData && docData.userId === currentUser.uid) {
          setDocument(docData);
          
          // 2. Fetch associated health parameters
          const allParams = await localDb.getHealthParameters(currentUser.uid);
          const docParams = allParams.filter(p => p.documentId === id);
          setParameters(docParams);
        } else {
          setError('Document not found or you do not have permission to view it.');
        }
      } catch (err) {
        console.error("Error fetching record details:", err);
        setError('Failed to load document details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [id, currentUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Loading document details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Record Not Found</h2>
        <p className="text-slate-500 mt-2">{error}</p>
        <Link to="/records" className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
          Back to Records
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link to="/records" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Records
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 break-all">{document.fileName}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                {format(document.uploadDate, 'MMMM d, yyyy h:mm a')}
              </span>
              <span className="flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-slate-400" />
                {document.category || 'General Report'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                document.processingStatus === 'Processed' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {document.processingStatus === 'Processed' ? 'Processed' : 'Processing...'}
              </span>
            </div>
            
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {document.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex shrink-0 gap-3">
            <a 
              href={document.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open Original
            </a>
            <a 
              href={document.fileUrl}
              download={document.fileName}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Data & Parameters */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Health Parameters Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" /> 
                Extracted Health Parameters
              </h2>
              <span className="text-sm font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {parameters.length} found
              </span>
            </div>
            
            {parameters.length === 0 ? (
              <div className="p-10 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-700 font-medium text-lg">No parameters found</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                  Our system couldn't automatically detect standard health parameters in this document. The document might be handwritten, have low contrast, or contain unsupported tests.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Parameter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref. Range</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {parameters.map((param) => {
                      let statusClass = 'bg-slate-100 text-slate-700';
                      
                      if (param.status === 'HIGH') {
                        statusClass = 'bg-red-50 text-red-700 border border-red-200';
                      } else if (param.status === 'LOW') {
                        statusClass = 'bg-orange-50 text-orange-700 border border-orange-200';
                      } else if (param.status === 'NORMAL') {
                        statusClass = 'bg-green-50 text-green-700 border border-green-200';
                      }

                      return (
                        <tr key={param.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {param.parameterName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-bold ${
                              param.status === 'HIGH' ? 'text-red-600' : 
                              param.status === 'LOW' ? 'text-orange-600' : 
                              'text-slate-900'
                            }`}>
                              {param.value}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {param.unit || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {param.referenceMin !== undefined && param.referenceMax !== undefined 
                              ? `${param.referenceMin} - ${param.referenceMax}` 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                              {param.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* OCR Text */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" /> 
                Extracted Text (OCR)
              </h2>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {document.extractedText ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
                  {document.extractedText}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <p>No text could be extracted from this document.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Document Preview */}
        <div className="lg:col-span-5 h-[calc(100vh-200px)] min-h-[600px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Document Preview</h2>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-hidden relative">
              {document.fileType.startsWith('image/') ? (
                <img 
                  src={document.fileUrl} 
                  alt="Document Preview" 
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : document.fileType === 'application/pdf' ? (
                <iframe 
                  src={`${document.fileUrl}#view=FitH`} 
                  className="w-full h-full border-0" 
                  title="PDF Preview"
                />
              ) : (
                <div className="text-slate-500 text-center p-6">
                  <FileType className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Preview not available for this file type.</p>
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;
