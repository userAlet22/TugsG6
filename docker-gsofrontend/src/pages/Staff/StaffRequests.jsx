import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Icon from '../../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Custom Hooks
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// Reducer
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

const MENU_ITEMS = [
  { 
    text: "Dashboard",
    to: "/admindashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
  },
  {
    text: "Notifications",
    to: "/adminnotifications",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
  },
  {
    text: "Schedules",
    to: "/adminschedules",
    icon: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M3 10h18 M8 2v4 M17 14h-6 M13 18H7 M7 14h.01 M17 18h.01"
  },
  { text: "Requests", to: "/requests", icon: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 11h4 M12 16h4 M8 11h.01 M8 16h.01"},
  { text: "Reports", to: "/report", icon: "M13 17V9 M18 17V5 M3 3v16a2 2 0 0 0 2 2h16 M8 17v-3"},
  {
    text: "Settings",
    to: "/settings",
    icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
  },
  {
    text: "Logout",
    to: "/loginpage",
    icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
  }
];

const Header = memo(({ 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  onCloseMobileMenu 
}) => {
  const mobileMenuRef = useRef(null);
  
  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">
        ManageIT 
      </span>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {MENU_ITEMS.map((item) => (
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
  );
});

const DashboardContent = memo(({ onCardClick, requests }) => (
  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 border-b mb-4 md:mb-6 pb-3 md:pb-4">
      Requests
    </h2>

    <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
      {/* Mobile/Tablet View (Stacked Cards) */}
      <div className="lg:hidden space-y-4 p-2 sm:p-4">
        {requests.map((request, index) => (
          <div key={index} className="border-2 border-gray-100 rounded-lg p-4 space-y-3 divide-y divide-gray-100">
            {/* Existing fields */}
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm font-semibold">Date Requested:</span>
              <span className="text-sm text-gray-900 font-medium">{request.date_requested}</span>
            </div>
            <div className="flex justify-between items-center pt-2 pb-2">
              <span className="text-sm font-semibold">Requesting Office:</span>
              <span className="text-sm text-gray-900 font-medium">{request.requesting_office}</span>
            </div>
            <div className="flex justify-between items-center pt-2 pb-2">
              <span className="text-sm font-semibold">Requesting Personnel:</span>
              <span className="text-sm text-gray-900 font-medium">{request.requesting_personnel}</span>
            </div>
            <div className="flex justify-between items-center pt-2 pb-2">
              <span className="text-sm font-semibold">Type:</span>
              <span className="text-sm text-gray-900 font-medium">{request.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 pb-2">
              <span className="text-sm font-semibold">Status:</span>
              <span className={`bg-${request.status === 'Pending' ? 'red' : 'green'}-500 text-white px-3 py-1 text-xs rounded-full font-medium shadow-sm`}>
                {request.status}
              </span>
            </div>
            {/* New Requests Slip section */}
            <div className="pt-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Requests Slip:</span>
                <button 
                  onClick={() => onCardClick(request.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg text-center transition-colors"
                >
                  View/Process Request
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <table className="hidden lg:table w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            {/* Existing headers */}
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
              Date Requested
            </th>
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
              Requesting Office
            </th>
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
              Requesting Personnel
            </th>
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
              Type
            </th>
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900 border-r border-gray-700">
              Status
            </th>
            {/* New Requests Slip header */}
            <th className="text-sm md:text-base p-3 text-left font-semibold text-gray-900">
              Requests Slip
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request, index) => (
            <tr 
              key={index} 
              className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400"
            >
              {/* Existing cells */}
              <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">{request.date_requested}</td>
              <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">{request.requesting_office}</td>
              <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">{request.requesting_personnel}</td>
              <td className="text-sm p-3 font-medium text-gray-900 border-r border-gray-700">{request.type || 'N/A'}</td>
              <td className="text-sm p-3 text-center border-r border-gray-700">
                <span className={`inline-block bg-${request.status === 'Pending' ? 'red' : 'green'}-500 text-white px-1 py-2 text-sm rounded-lg font-medium shadow-sm`}>
                  {request.status}
                </span>
              </td>
              {/* New Requests Slip cell */}
              <td className="text-sm p-3 text-center">
                <button
                  onClick={() => onCardClick(request.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-1 rounded-lg inline-block transition-colors"
                >
                  Open Form
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </main>
));
const MaintenanceRequestsList = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/maintenance-requests?status=Pending`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setRequests(data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      });
  }, [token]);

  const handleRequestClick = (id) => {
    fetch(`${API_BASE_URL}/maintenance-requests/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setSelectedRequest(data.data);
      })
      .catch(error => {
        console.error("Error fetching request details:", error);
      });
  };

  if (loading) return <p>Loading...</p>;
  if (!requests.length) return <p>No pending requests found.</p>;

  return (
    <div>
      <h2>Pending User Requests</h2>
      <ul>
        {requests.map(request => (
          <li key={request.id} onClick={() => handleRequestClick(request.id)}>
            <strong>{request.details}</strong> - {request.status}
            <br /> Requested by {request.requesting_personnel} on {request.date_requested}
          </li>
        ))}
      </ul>
      {selectedRequest && (
        <div>
          <h3>Request Details</h3>
          <p><strong>ID:</strong> {selectedRequest.id}</p>
          <p><strong>Details:</strong> {selectedRequest.details}</p>
          <p><strong>Status:</strong> {selectedRequest.status}</p>
          <p><strong>Requested by:</strong> {selectedRequest.requesting_personnel}</p>
          <p><strong>Date Requested:</strong> {selectedRequest.date_requested}</p>
        </div>
      )}
    </div>
  );
};

const StaffRequests = ({ token }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch(`${API_BASE_URL}/maintenance-requests?status=Pending`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setRequests(data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      });
  }, [token]);

  const handleRequestClick = useCallback((id) => {
    // Store the request ID in localStorage or state management
    localStorage.setItem('currentRequestId', id);
    navigate(`/admincarpentryform/${id}`);
  }, [navigate]);

  if (loading) return <p>Loading...</p>;
  if (!requests.length) return <p>No pending requests found.</p>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          title="ADMIN"
        />
        
        <DashboardContent onCardClick={handleRequestClick} requests={requests} />
      </div>
    </div>
  );
};


export default StaffRequests;