import { useReducer, useEffect, useState, memo } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';
import { CampusDirectorSidebar, MENU_ITEMS as CAMPUS_DIRECTOR_MENU_ITEMS, CampusDirectorNotificationProvider } from '../../components/CampusDirectorSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => (
  <header className="bg-black text-white p-4 flex justify-between items-center relative">
    <span className="text-xl md:text-2xl font-extrabold tracking-tight">
      ManageIT
    </span>
    <div className="hidden md:block text-xl font-bold text-white">
      Campus Director
    </div>
    <div className="flex items-center gap-4 md:hidden">
      <button
        onClick={onToggleMobileMenu}
        className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
      </button>
    </div>
    <div
      className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
        isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <nav className="py-2">
        {CAMPUS_DIRECTOR_MENU_ITEMS.map((item) => (
          <NavLink
            key={item.text}
            to={item.to}
            className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
            onClick={onCloseMobileMenu}
          >
            <Icon path={item.icon} className="w-5 h-5 mr-3" />
            {item.text}
          </NavLink>
        ))}
      </nav>
      <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
        Created By Bantilan & Friends
      </div>
    </div>
  </header>
));

const DashboardContent = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    fetch(`${API_BASE_URL}/notifications/markAllAsRead`, {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    }).catch(() => {});

    fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        "Accept": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleNotificationClick = (notif) => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );
    fetch(`${API_BASE_URL}/notifications/markAsRead/${notif.id}`, {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    }).catch(() => {});
    setSelectedNotif(notif);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
          Notifications
        </h2>
        <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No notifications found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between
                    cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors duration-150
                    ${!notif.is_read ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}
                  `}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 hover:underline">
                      {notif.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <span className="text-xs text-blue-500"></span>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium shadow-sm ${
                      notif.is_read ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {notif.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Centered Modal - outside <main> */}
      {selectedNotif && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-800 font-medium">{selectedNotif.message}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{new Date(selectedNotif.created_at).toLocaleString()}</span>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  selectedNotif.is_read ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedNotif.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNotif(null)}
              className="mt-6 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const CampusDirectorNotifications = () => {
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  return (
    <CampusDirectorNotificationProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header
          isMobileMenuOpen={state.isMobileMenuOpen}
          onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
          onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        />
        <div className="flex flex-1 overflow-hidden">
          <CampusDirectorSidebar
            isSidebarCollapsed={state.isSidebarCollapsed}
            onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            menuItems={CAMPUS_DIRECTOR_MENU_ITEMS}
          />
          <DashboardContent />
        </div>
      </div>
    </CampusDirectorNotificationProvider>
  );
};

export default CampusDirectorNotifications;