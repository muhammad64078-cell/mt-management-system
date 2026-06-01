import { Search, Bell, ChevronDown, Menu, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchablePages = [
    { title: 'Admin Dashboard', path: '/', role: 'admin' },
    { title: 'Sales Dashboard', path: '/salesdashboard', role: 'sales' },
    { title: 'Production View', path: '/production', role: 'production' },
    { title: 'Leads Management', path: '/leads' },
    { title: 'Projects Track', path: '/projects' },
    { title: 'Activity Log', path: '/activities' },
    { title: 'Targets', path: '/targets' }
  ];

  const searchResults = searchablePages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (!page.role || page.role === user?.role || user?.role === 'admin')
  );

  const handleSearchNavigate = (path) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.path) {
      navigate(notification.path);
    }
    setShowNotifications(false);
  };

  const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`;

  return (
    <div className="h-16 bg-background border-b border-border sticky top-0 z-40 w-full transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="p-2 mr-2 text-muted-foreground hover:text-orange-500 rounded-xl hover:bg-orange-500/10 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search data or pages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm transition-all focus:outline-none focus:bg-card focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 placeholder:text-muted-foreground text-foreground"
            />
            
            {showSearch && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                  Pages & Results
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearchNavigate(result.path)}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-card/5 hover:text-orange-500 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      {result.title}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No matching results found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-6 ml-auto sm:ml-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-muted-foreground hover:text-orange-500 rounded-xl hover:bg-orange-500/10 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute -right-16 sm:right-0 mt-3 w-[90vw] sm:w-80 max-w-[360px] bg-card rounded-2xl border border-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={markAllAsRead}
                      title="Mark all as read"
                      className="p-1.5 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={clearNotifications}
                      title="Clear all"
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-4 hover:bg-card/5 cursor-pointer transition-colors relative border-b border-border last:border-0 ${
                          notification.unread ? 'bg-orange-500/10' : ''
                        }`}
                      >
                        {notification.unread && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                        <p className={`text-sm leading-snug ${notification.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {notification.text}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground/70 mt-1.5">{notification.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <Bell className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs font-medium">No new notifications</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-border">
                  <button 
                    onClick={() => { navigate('/activities'); setShowNotifications(false); }}
                    className="w-full text-center py-1.5 text-xs font-bold text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                  >
                    View Activity Log
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center group p-1 pr-2 rounded-xl hover:bg-card/5 transition-all"
            >
              <div className="relative">
                <img
                  src={userAvatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-card group-hover:ring-orange-500/30 transition-all"
                />
              </div>
              <div className="ml-3 text-left hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-tight">{user?.name}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{user?.role}</p>
              </div>
              <ChevronDown className={`ml-2 w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-card rounded-2xl border border-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account</p>
                </div>
                <button 
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-card/5 hover:text-orange-500 transition-colors"
                >
                  My Profile
                </button>
                <button 
                  onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-card/5 hover:text-orange-500 transition-colors"
                >
                  Settings
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-medium flex items-center gap-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
