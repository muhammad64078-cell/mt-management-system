import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  Activity, 
  Target, 
  UserSquare2, 
  Briefcase,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sales'] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['admin', 'sales'] },
  { name: 'Pipeline', href: '/pipeline', icon: GitBranch, roles: ['admin', 'sales'] },
  { name: 'Activity', href: '/activity', icon: Activity, roles: ['admin', 'sales'] },
  { name: 'Targets', href: '/targets', icon: Target, roles: ['admin', 'sales'] },
  { name: 'Team', href: '/team', icon: UserSquare2, roles: ['admin', 'sales'] },
  { name: 'Production Dashboard', href: '/production', icon: LayoutDashboard, roles: ['production'] },
  { name: 'Production', href: '/production/projects', icon: Briefcase, roles: ['admin', 'production'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        flex flex-col w-64 bg-card border-r border-border h-screen fixed top-0 left-0 z-50 
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <div className="bg-orange-500 p-1.5 rounded-lg mr-3 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">MT Nexus Global</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-orange-500/10 text-orange-500 shadow-[inset_2px_0_0_0_rgba(249,115,22,1)]' 
                    : 'text-muted-foreground hover:bg-card/5 hover:text-foreground'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border bg-black/20">
          <div className="flex items-center p-2 mb-2">
            <div className="relative">
              <img
                src={userAvatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-card ring-1 ring-border"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs font-medium text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
