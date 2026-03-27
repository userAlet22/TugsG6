import { useState, useReducer, useEffect, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Icon from "../../components/Icon";
import { HeadSidebar, HEAD_MENU_ITEMS } from "../../components/HeadSidebar"; 

const getStatusColor = (statusName, isBadge = false) => {
  const name = (statusName || "").toLowerCase();
  if (["approved", "completed", "done"].includes(name)) {
    return isBadge ? "bg-green-100 text-green-800" : "bg-green-500 text-white";
  }
  if (["urgent", "onhold", "on hold"].includes(name)) {
    return isBadge ? "bg-orange-100 text-orange-800" : "bg-orange-500 text-white";
  }
  if (["disapproved", "rejected", "canceled"].includes(name)) {
    return isBadge ? "bg-red-100 text-red-800" : "bg-red-500 text-white";
  }
  return isBadge ? "bg-yellow-100 text-yellow-800" : "bg-yellow-500 text-white";
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// sidebar reducer
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case "TOGGLE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case "CLOSE_MOBILE_MENU":
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const RequestsTable = ({ onRowClick, requests, showActions }) => (
  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
    <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="p-3 text-left font-semibold">Date Requested</th>
            <th className="p-3 text-left font-semibold">Personnel Name</th>
            <th className="p-3 text-left font-semibold">Position</th>
            <th className="p-3 text-left font-semibold">Office</th>
            <th className="p-3 text-left font-semibold">Maintenance Type</th>
            <th className="p-3 text-left font-semibold">Status</th>
            <th className="p-3 text-left font-semibold">Contact Number</th>
            {showActions && <th className="p-3 text-left font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <tr key={request.request_id} className="hover:bg-gray-50 even:bg-gray-50 border-b border-gray-400">
                <td>{request.date_requested}</td>
<td>{request.requesting_personnel}</td>
<td>{request.position}</td>
<td>{request.requesting_office}</td>
<td>{request.maintenance_type}</td>
<td>
  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status || "pending", true)}`}>
    {request.status}
  </span>
</td>
<td>{request.contact_number}</td>
                {showActions && (
                  <td className="p-3">
                    <button
                      onClick={() => onRowClick(request.request_id, request.status)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Review
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showActions ? 8 : 7} className="p-3 text-center">
                No maintenance requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </main>
);

const HeadRequests = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [statuses, setStatuses] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Fetch statuses for tabs (dynamic)
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    fetchStatuses();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/users-list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = await res.json();
        const map = {};
        (Array.isArray(users.data) ? users.data : users).forEach(user => {
          map[user.user_id] = user;
        });
        setUsersMap(map);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/loginpage");
      return;
    }
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/maintenance-requests/list-with-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    if (usersMap) {
      fetchRequests();
    }
  }, [token, navigate, usersMap]);

  const handleRowClick = useCallback(
    (id, status) => {
      const isPending =
        status === "Pending" ||
        status === 1 ||
        status?.toLowerCase() === "urgent" ||
        status?.toLowerCase() === "onhold" ||
        status?.toLowerCase() === "on hold" ||
        status?.toLowerCase() === "verified";
      if (isPending) {
        navigate(`/headmaintenancerequestform/${id}`);
      } else {
        navigate(`/headviewmaintenancerequestform/${id}`);
      }
    },
    [navigate]
  );

  // Dynamic tab logic based on backend statuses
  const filtered = requests.filter((r) => {
    if (selectedTab === "Pending") {
      return (
        r.status === "Pending" &&
        r.verified_by !== null && r.verified_by !== undefined &&
        (r.approved_by_1 === null || r.approved_by_1 === undefined)
      );
    }

    if (selectedTab.toLowerCase() === "onhold" || selectedTab.toLowerCase() === "on hold") {
      return r.status?.toLowerCase() === "onhold" || r.status?.toLowerCase() === "on hold";
    }

    return r.status?.toLowerCase() === selectedTab.toLowerCase();
  });

  const showActions = true;

  if (loading) return <div className="p-4">Loading requests...</div>;
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Head</div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white"
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-2">
            {HEAD_MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700"
                onClick={() => dispatch({ type: "CLOSE_MOBILE_MENU" })}
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

      <div className="flex flex-1 overflow-auto">
        <HeadSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 border-b mb-4 pb-3">
            Maintenance Requests
          </h2>
          {/* Dynamic Tabs */}
          <div className="flex space-x-4 mb-6">
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedTab(status.name)}
                className={`relative px-4 py-2 font-semibold rounded-md ${
                  selectedTab === status.name
                    ? getStatusColor(status.name, false)
                    : "bg-transparent text-gray-700"
                }`}
              >
                {status.name}
              </button>
            ))}
          </div>
          <RequestsTable
            onRowClick={handleRowClick}
            requests={filtered}
            showActions={showActions}
          />
        </main>
      </div>
    </div>
  );
};

export default HeadRequests;
