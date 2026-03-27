import { useState, useEffect, useReducer, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from '../../components/Icon';
import { AdminSidebar, MENU_ITEMS as ADMIN_MENU_ITEMS } from '../../components/AdminSidebar';

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

function AdminUserRequestsForm() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  // Get the user_id from URL parameters
  const { user_id } = useParams();
  
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });

  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [token, setToken] = useState("");

  // New state for lookup data
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [offices, setOffices] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  // Track loading state for each data type
  const [dataLoadingState, setDataLoadingState] = useState({
    userData: true,
    lookupData: true
  });

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      if (!token) {
        throw new Error("No token found");
      }

      console.log("Calling logout API with token:", token);

      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      navigate("/loginpage", { replace: true });
    } catch (err) {
      console.error(err.message || "An error occurred during logout");
    }
  };

  // Retrieve token from storage
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage"); // Redirect to login if token is missing
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  // Update overall loading state whenever any loading state changes
  useEffect(() => {
    const isStillLoading = Object.values(dataLoadingState).some(state => state === true);
    setIsLoading(isStillLoading);
  }, [dataLoadingState]);

  // Fetch lookup data (roles, positions, offices, statuses)
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        if (!token) return;

        // Fetch all lookup data in one request
        const response = await fetch(`${API_BASE_URL}/common-datas`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        const data = await response.json();

        setRoles([
          { label: "Select Role", value: "", disabled: true },
          ...data.roles.map(role => ({ label: role.role_name || role.name || role.label, value: role.id }))
        ]);
        setPositions([
          { label: "Select Position", value: "", disabled: true },
          ...data.positions.map(position => ({ label: position.name, value: position.id }))
        ]);
        setOffices([
          { label: "Select Office", value: "", disabled: true },
          ...data.offices.map(office => ({ label: office.name, value: office.id }))
        ]);
        setStatuses([
          { label: "Select Status", value: "", disabled: true },
          ...data.statuses.map(status => ({ label: status.name || status.label, value: status.id }))
        ]);

        // Update loading state for lookup data
        setDataLoadingState(prev => ({ ...prev, lookupData: false }));
      } catch (err) {
        setError("Failed to load lookup data. Please refresh the page.");
        console.error("Error fetching lookup data:", err);
        // Even on error, mark lookup data as loaded to prevent infinite loading state
        setDataLoadingState(prev => ({ ...prev, lookupData: false }));
      }
    };

    if (token) {
      fetchLookupData();
    }
  }, [token, API_BASE_URL]);

  // Fetch user data for the specific user_id
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token || !user_id) return;

      try {
        // Fetch all users from /users-list
        const response = await fetch(`${API_BASE_URL}/users-list`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch users list");

        const allUsersData = await response.json();

        // Extract users array depending on API response structure
        const usersArray = Array.isArray(allUsersData) ? allUsersData :
          Array.isArray(allUsersData.data) ? allUsersData.data : [];

        // Find the specific user by user_id
        const userFound = usersArray.find(
          user => user.user_id === parseInt(user_id) || user.user_id === user_id
        );

        if (userFound) {
          setUserData(userFound);
        } else {
          throw new Error("User not found");
        }

        setDataLoadingState(prev => ({ ...prev, userData: false }));
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to fetch user data");
        setDataLoadingState(prev => ({ ...prev, userData: false }));
      }
    };

    if (token && user_id) {
      fetchUserData();
    }
  }, [token, API_BASE_URL, user_id]);

  // Function to get label from lookup object, with fallback
  const getLabelFromLookup = (lookupObj, id, fallback = "Unknown") => {
    return lookupObj.find(item => item.value === id)?.label || fallback;
  };

  // Function to update account status
  const updateAccountStatus = async (statusId) => {
    if (!userData || !user_id) return;

    try {
      // Make sure statusId is a number
      const numericStatusId = parseInt(statusId);

      // Validate we have a proper status ID
      if (isNaN(numericStatusId)) {
        throw new Error("Invalid status ID");
      }

      let endpoint = `${API_BASE_URL}/users/${user_id}/updateAccountStatus`;
      if (numericStatusId === 3) {
        endpoint = `${API_BASE_URL}/users/${user_id}/dissaproveAccountStatus`;
      }

      console.log(`Sending status update with status_id: ${numericStatusId} to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status_id: numericStatusId
        }),
      });

      const result = await response.json();
      console.log(`Updated Status to ${numericStatusId}:`, result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status");
      }

      // Get the status label for display
      const statusLabel = getLabelFromLookup(statuses, numericStatusId, `Status ${numericStatusId}`);
      setStatusMessage(`User status updated to ${statusLabel}`);

      // Update local user data with new status
      setUserData({ ...userData, account_status: numericStatusId });

      setTimeout(() => {
        navigate('/adminuserrequests');
      }, 2000);
    } catch (err) {
      console.error("Error updating status:", err);
      setStatusMessage(`Failed to update status: ${err.message}`);
    }
  };

  // Function to go back to the user requests list
  const handleGoBack = () => {
    navigate('/adminuserrequests');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex justify-between items-center relative shadow-md">
        <div className="flex items-center">
          <span className="text-xl md:text-2xl font-extrabold tracking-tight">
            ManageIT
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-blue-800 hover:bg-blue-700 p-2 rounded-full transition-colors cursor-pointer">
              <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-5 h-5" />
            </div>
            <div className="flex items-center text-sm">
              <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">A</div>
              <span className="hidden lg:inline">Admin User</span>
            </div>
          </div>
          
          <button 
            onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
            className="md:hidden p-2 hover:bg-blue-800 rounded-lg border border-blue-400 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={state.isMobileMenuOpen}
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={ADMIN_MENU_ITEMS}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
          <div className="flex items-center mb-6">
            <button 
              onClick={handleGoBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4"
            >
              <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-5 h-5 mr-1" />
              Back to Requests
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Request Details</h1>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex">
                <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {statusMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex">
                <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-2" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
              <p className="text-indigo-700 font-medium">Loading user information...</p>
            </div>
          ) : userData ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center">
                  <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-medium mr-4 shadow-md">
                    {userData.username ? userData.username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{userData.full_name || userData.username}</h2>
                    <p className="text-sm text-indigo-600 flex items-center">
                      <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-4 h-4 mr-1 inline-block" />
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-800 mb-4 border-b border-indigo-100 pb-2">User Information</h3>
                    <div className="space-y-5">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Username</h4>
                        <p className="font-medium text-gray-900">{userData.username}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Email</h4>
                        <p className="font-medium text-gray-900">{userData.email}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Contact Number</h4>
                        <p className="font-medium text-gray-900">{userData.contact_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-800 mb-4 border-b border-indigo-100 pb-2">Work Information</h3>
                    <div className="space-y-5">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Office</h4>
                        <p className="font-medium text-gray-900">
                          {getLabelFromLookup(offices, userData.office_id, 'Not specified')}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Position</h4>
                        <p className="font-medium text-gray-900">
                          {getLabelFromLookup(positions, userData.position_id, 'Not specified')}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Role</h4>
                        <p className="font-medium text-gray-900">
                          {getLabelFromLookup(roles, userData.role_id, `Role ${userData.role_id}` || 'Not specified')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-lg font-medium text-sm
                        ${userData.status_id === 2 ? 'bg-green-100 text-green-800' : 
                          userData.status_id === 3 ? 'bg-red-100 text-red-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        Current Status: {getLabelFromLookup(statuses, userData.status_id, userData.status || 'Pending')}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <span className="mr-1">Registered on:</span>
                        <span className="font-medium">
                          {userData.created_at ? new Date(userData.created_at).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Only show buttons if status is Pending */}
                    {(userData.status_id === 1 || userData.status === 'Pending') && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => updateAccountStatus(3)}
                          className="flex items-center px-5 py-2.5 bg-white border-2 border-red-400 text-red-600 hover:bg-red-50 rounded-lg shadow-sm transition-all duration-200 font-medium"
                        >
                          <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 mr-2" />
                          Reject Request
                        </button>
                        <button
                          onClick={() => updateAccountStatus(2)}
                          className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all duration-200 font-medium"
                        >
                          <Icon path="M5 13l4 4L19 7" className="w-5 h-5 mr-2" />
                          Approve Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon path="M12 4v16m8-8H4" className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No User Data Found</h3>
              <p className="text-gray-600 mb-6">The user might not exist or you don't have permission to view this data.</p>
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
              >
                <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-5 h-5 mr-2" />
                Return to User Requests
              </button>
            </div>  
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminUserRequestsForm;