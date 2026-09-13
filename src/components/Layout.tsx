import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userProfile, currentUser } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="font-bold text-primary">MedRecords</div>
          
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
             {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                (userProfile?.fullName || currentUser?.email || '?')[0].toUpperCase()
             )}
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
