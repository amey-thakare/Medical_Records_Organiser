import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  UserCircle, 
  LogOut,
  Upload,
  X
} from 'lucide-react';
import { localDb } from '../utils/localDb';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {

  const location = useLocation();

  const handleLogout = async () => {
    try {
      await localDb.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Medical Records', path: '/records', icon: FileText },
    { name: 'Health Trends', path: '/trends', icon: TrendingUp },
    { name: 'Upload Record', path: '/upload', icon: Upload },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center space-x-2 text-primary font-bold text-xl">
            <TrendingUp className="w-6 h-6" />
            <span>MedRecords</span>
          </Link>
          <button 
            className="md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-64px)] justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
