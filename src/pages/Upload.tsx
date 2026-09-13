import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { localDb } from '../utils/localDb';
import { useAuth } from '../contexts/AuthContext';
import { performOCR } from '../utils/ocrService';
import { extractHealthParameters, categorizeDocument } from '../utils/parameterExtractor';
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';


const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  
  // States: 'idle', 'uploading', 'processing', 'success', 'error'
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrProgress, setOcrProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Basic validation
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File is too large. Maximum size is 10MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setStatus('idle');
    }
  };

  const processUpload = async () => {
    if (!file || !currentUser) return;

    setStatus('uploading');
    setError('');
    
    try {
      setUploadProgress(30);
      const fileUrl = await localDb.uploadFile(file, '');
      setUploadProgress(70);
      
      setStatus('processing');
      let extractedText = '';
      let extractedParams: any[] = [];
      
      if (file.type.startsWith('image/')) {
        extractedText = await performOCR(file, (p) => setOcrProgress(p));
        extractedParams = extractHealthParameters(extractedText);
      } else {
        extractedText = 'PDF parsing is limited. Please use image formats for automatic parameter extraction.';
      }

      const { category, tags } = categorizeDocument(extractedText, extractedParams);

      const docId = await localDb.addDocument({
        userId: currentUser.uid,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type,
        size: file.size,
        uploadDate: Date.now(),
        category: category,
        tags: tags,
        processingStatus: 'Processed'
      });
      
      if (extractedParams.length > 0) {
        const paramsToSave = extractedParams.map(p => ({
          ...p,
          userId: currentUser.uid,
          documentId: docId,
          testDate: Date.now()
        }));
        
        await localDb.addHealthParameters(paramsToSave);
      }
      
      setStatus('success');
      setTimeout(() => {
        navigate('/records');
      }, 2000);

    } catch (err) {
      console.error("Processing error:", err);
      setStatus('error');
      setError('File uploaded, but failed to process OCR or save parameters.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Medical Record</h1>
        <p className="text-slate-500 mt-1">Upload your lab reports, prescriptions, or scans to analyze and store them securely.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center justify-center flex-col py-8 border border-green-100">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-bold text-green-900">Upload Successful!</h3>
            <p className="text-sm text-green-700 mt-2">Your document has been processed and stored securely.</p>
            <p className="text-sm text-green-600 mt-1">Redirecting to your records...</p>
          </div>
        )}

        {status === 'idle' && (
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              file ? 'border-primary/50 bg-primary/5' : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400 bg-slate-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,application/pdf" 
              className="hidden" 
            />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white shadow-sm rounded-xl flex items-center justify-center mb-4 text-primary">
                  <FileType className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">{file.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Click to upload or drag and drop</h3>
                <p className="text-sm text-slate-500 mt-2">JPG, PNG or PDF (max. 10MB)</p>
                <p className="text-xs text-primary/80 mt-4 font-medium bg-primary/10 px-3 py-1 rounded-full">
                  Images work best for automatic data extraction
                </p>
              </div>
            )}
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Uploading Document...</h3>
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5 mt-2">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-sm text-slate-500 mt-2">{uploadProgress}% complete</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Analyzing Document...</h3>
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5 mt-2">
              <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Extracting health parameters ({ocrProgress}%)</p>
            <p className="text-xs text-slate-400 mt-4 text-center max-w-sm">This involves AI processing and may take up to a minute depending on document length and clarity.</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={processUpload}
              disabled={!file}
              className="flex items-center px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Upload & Analyze
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Upload;
