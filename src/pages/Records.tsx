import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { localDb } from '../utils/localDb';
import { useAuth } from '../contexts/AuthContext';
import type { MedicalDocument } from '../types';
import { format } from 'date-fns';
import { Search, Filter, FileType, CheckCircle, ChevronRight, Loader2, Tag } from 'lucide-react';

const Records = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) return;
      
      try {
        const data = await localDb.getDocuments(currentUser.uid);
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentUser]);

  // Extract unique categories and tags for filter dropdowns
  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [documents]);

  const tags = useMemo(() => {
    const allTags = new Set<string>();
    documents.forEach(d => {
      if (d.tags) d.tags.forEach(t => allTags.add(t));
    });
    return ['All', ...Array.from(allTags)];
  }, [documents]);

  // Filter and search logic
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategory === 'All' || (doc.category || 'General') === selectedCategory;
      const matchesTag = selectedTag === 'All' || (doc.tags && doc.tags.includes(selectedTag));
      
      if (!searchQuery) return matchesCategory && matchesTag;
      
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.fileName.toLowerCase().includes(queryLower) ||
        (doc.category || '').toLowerCase().includes(queryLower) ||
        (doc.tags && doc.tags.some(t => t.toLowerCase().includes(queryLower))) ||
        (doc.extractedText && doc.extractedText.toLowerCase().includes(queryLower));

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [documents, searchQuery, selectedCategory, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-500 mt-1">Browse, search, and manage all your uploaded documents.</p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
          Total: {filteredDocuments.length} records
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search records, extracted text, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm bg-white appearance-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="block w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm bg-white appearance-none"
            >
              {tags.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Tags' : t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500 font-medium">Loading your records...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No records found</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              {searchQuery || selectedCategory !== 'All' || selectedTag !== 'All' 
                ? "Try adjusting your search query or filters to find what you're looking for."
                : "You haven't uploaded any medical records yet. Go to the Upload section to get started."}
            </p>
            {(searchQuery || selectedCategory !== 'All' || selectedTag !== 'All') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedTag('All');
                }}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Upload Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-4 text-right">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <FileType className="h-5 w-5" />
                        </div>
                        <div className="ml-4 max-w-[200px] sm:max-w-xs md:max-w-sm">
                          <div className="text-sm font-semibold text-slate-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </div>
                          <div className="text-xs text-slate-500 truncate sm:hidden mt-0.5">
                            {doc.category || 'General'}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 hidden md:flex">
                            {doc.tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {tag}
                              </span>
                            ))}
                            {(doc.tags?.length || 0) > 3 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                +{(doc.tags?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-slate-700 font-medium">
                        {doc.category || 'General'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-700">
                        {format(doc.uploadDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(doc.uploadDate, 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.processingStatus === 'Processed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Processed
                        </span>
                      ) : doc.processingStatus === 'Failed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/records/${doc.id}`} className="inline-flex items-center text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
