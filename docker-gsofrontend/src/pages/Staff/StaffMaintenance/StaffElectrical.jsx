import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { StaffSidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from "../../../components/StaffSidebar";
import Icon from "../../../components/Icon";

// Reducer for sidebar state
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

const StaffElectrical = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });
  const mobileMenuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
      dispatch({ type: "CLOSE_MOBILE_MENU" });
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Form input states
  const [formData, setFormData] = useState({
    date_requested: "",              
    details: "",                     
    requesting_personnel: "",       
    position_id: "",                 
    requesting_office: "",         
    contact_number: "",              
  });

  const [userIds, setUserIds] = useState({
    user_id: "",
    position_id: "",
    requesting_office: "",
  });

  const [displayName, setDisplayName] = useState("");

  // UI state management
  const [status, setStatus] = useState({
    isLoading: false,
    isFetchingUserDetails: true,
    error: "",
    success: "",
    touched: {}, // Track which fields have been touched for validation
    isSubmitting: false,
    showConfirmation: false,
    fieldErrors: {}, // Track specific field errors
  });

  const [token, setToken] = useState("");

  // Update form data with a single function
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Mark field as touched for validation
    if (!status.touched[field]) {
      setStatus(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: true }
      }));
    }
    
    // Clear field error if value is valid
    if (status.fieldErrors[field]) {
      if ((field === 'details' && value.length >= 10) || 
          (field !== 'details' && value)) {
        setStatus(prev => ({
          ...prev,
          fieldErrors: {
            ...prev.fieldErrors,
            [field]: ""
          }
        }));
      }
    }
  };

  const markAllFieldsTouched = () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setStatus(prev => ({
      ...prev,
      touched: allTouched
    }));
  };

  // Check form validity
  const validateForm = () => {
    const fieldErrors = {};
    
    if (!formData.date_requested) fieldErrors.date_requested = "Date is required";
    
    if (!formData.details) fieldErrors.details = "Details are required";
    else if (formData.details.length < 10) {
      fieldErrors.details = "Please provide more detailed information (at least 10 characters)";
    }
    
    // Update the field errors in state
    setStatus(prev => ({
      ...prev,
      fieldErrors
    }));
    
    return {
      isValid: Object.keys(fieldErrors).length === 0,
      fieldErrors
    };
  };

  // Authentication check and token retrieval
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    if (!authToken) {
      setStatus(prev => ({
        ...prev,
        error: "Unauthorized: Please log in to continue",
        isFetchingUserDetails: false
      }));
      
      // Show error briefly before redirecting
      const timer = setTimeout(() => navigate("/loginpage"), 2000);
      return () => clearTimeout(timer);
    }
    
    setToken(authToken);
  }, [navigate]);

  // Fetch user details
  useEffect(() => {
    if (!token) return;
    
    const fetchUserDetails = async () => {
      try {
        setStatus(prev => ({ ...prev, isFetchingUserDetails: true }));
        
        const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user details");
        }

        // Store IDs for backend
        setUserIds({
          user_id: data.user_id || "",
          position_id: typeof data.position_id === "object" && data.position_id !== null
            ? data.position_id.id || ""
            : data.position_id || "",
          requesting_office: typeof data.office_id === "object" && data.office_id !== null
            ? data.office_id.id || ""
            : data.office_id || "",
        });

        // Store display values for UI
        setFormData(prev => ({
          ...prev,
          requesting_personnel: [
            data.last_name,
            data.first_name,
            data.middle_name,
            data.suffix
          ].filter(Boolean).join(", "),
          position: typeof data.position_id === "object" && data.position_id !== null
            ? data.position_id.name || ""
            : data.position_id || "",
          requesting_office: typeof data.office_id === "object" && data.office_id !== null
            ? data.office_id.name || ""
            : data.office_id || "",
          contact_number: data.contact_number || "",
        }));

        // Store display name for UI
        setDisplayName(
          [data.last_name, data.first_name, data.middle_name, data.suffix]
            .filter(Boolean)
            .join(", ")
        );
      } catch (err) {
        console.error("Error fetching user details:", err);
        setStatus(prev => ({
          ...prev,
          error: err.message || "Failed to fetch user details"
        }));
      } finally {
        setStatus(prev => ({ ...prev, isFetchingUserDetails: false }));
      }
    };

    fetchUserDetails();
  }, [token, API_BASE_URL]);

  // Set current date when component mounts
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, date_requested: currentDate }));
  }, []);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (status.error) {
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, error: "" }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.error]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    markAllFieldsTouched();
    
    // Validate form
    const { isValid, fieldErrors } = validateForm();
    if (!isValid) {
      // Display the first error in the general error message
      setStatus(prev => ({
        ...prev,
        error: Object.values(fieldErrors)[0]
      }));
      return;
    }

    // Show confirmation
    setStatus(prev => ({ ...prev, showConfirmation: true }));
  };

  // Submit the form after confirmation
  const handleConfirmedSubmit = useCallback(async () => {
    if (!token) {
      setStatus(prev => ({
        ...prev,
        error: "Unauthorized: Please log in",
        showConfirmation: false
      }));
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }

    try {
      setStatus(prev => ({
        ...prev,
        isSubmitting: true,
        error: "",
        success: ""
      }));

      // Prepare request data for backend
      const requestData = {
        date_requested: formData.date_requested,
        details: formData.details,
        requesting_personnel: parseInt(userIds.user_id, 10),
        position_id: parseInt(userIds.position_id, 10),
        requesting_office: parseInt(userIds.requesting_office, 10), // ✅ MUST be included
        contact_number: formData.contact_number,
        maintenance_type_id: 3, // Electrical maintenance type ID
      };

      // 👇 Log the requestData before sending to the backend
      console.log("Submitting electrical request:", requestData);
      console.log('Submitting requestData:', requestData);

      const response = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in");
        } else {
          throw new Error(data.message || "Request submission failed");
        }
      }

      // Success!
      setStatus(prev => ({
        ...prev,
        success: "Request submitted successfully!",
        showConfirmation: false
      }));

      const timer = setTimeout(() => {
        navigate("/staffdashboard");
      }, 3000);
      return () => clearTimeout(timer);

    } catch (err) {
      setStatus(prev => ({
        ...prev,
        error: err.message || "An error occurred during submission",
        showConfirmation: false
      }));
    } finally {
      setStatus(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [token, formData, userIds, navigate, API_BASE_URL]);

  // Form input feedback indicators - now considers fieldErrors
  const getInputClasses = (field) => {
    const baseClasses = "w-full border rounded-lg px-4 py-2 md:py-3 transition-all";
    
    // Show error state if field has a specific error
    if (status.fieldErrors[field]) {
      return `${baseClasses} border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-red-50`;
    }
    
    // Otherwise show normal validation state
    const touchedClasses = status.touched[field] ? 
      (field === 'details' && formData[field].length < 10) || !formData[field] ? 
        "border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400" : 
        "border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" : 
      "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    
    return `${baseClasses} ${touchedClasses}`;
  };

  // Render loading state
  if (status.isFetchingUserDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
        <div className="hidden md:block text-xl font-bold text-white">Staff</div>
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => dispatch({ type: "TOGGLE_MOBILE_MENU" })}
            className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
            aria-label="Toggle menu"
            aria-expanded={state.isMobileMenuOpen}
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
          </button>
        </div>
        <div
          ref={mobileMenuRef}
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-2">
            {SIDEBAR_MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <StaffSidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={SIDEBAR_MENU_ITEMS}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-3 md:p-4 lg:p-5 shadow-lg rounded-lg w-full max-w-sm md:max-w-md lg:max-w-xl transition-all duration-300">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
                User Request Slip <br className="hidden sm:block" />
                (Electrical Section)
              </h2>

              {/* Feedback Messages */}
              {status.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{status.error}</span>
                </div>
              )}

              {status.success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{status.success}</span>
                </div>
              )}

              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                {/* Date Requested */}
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Date Requested:
                    {status.fieldErrors.date_requested && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className={getInputClasses('date_requested')}
                      value={formData.date_requested}
                      onChange={(e) => updateFormData('date_requested', e.target.value)}
                    />
                    {status.fieldErrors.date_requested && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {status.fieldErrors.date_requested && (
                    <p className="text-sm text-red-500 mt-1">
                      {status.fieldErrors.date_requested}
                    </p>
                  )}
                </div>

                {/* Specific Details */}
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                    Specific Details (Situations/Condition/Circumstances):
                    {status.fieldErrors.details && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      className={getInputClasses('details')}
                      rows="3"
                      value={formData.details}
                      onChange={(e) => updateFormData('details', e.target.value)}
                      placeholder="Please provide detailed information about your electrical service request"
                    ></textarea>
                    {status.fieldErrors.details && (
                      <div className="absolute right-3 top-3 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {status.fieldErrors.details ? (
                    <p className="text-sm text-red-500 mt-1">
                      {status.fieldErrors.details}
                    </p>
                  ) : status.touched.details && formData.details.length < 10 ? (
                    <p className="text-sm text-red-500 mt-1">
                      Please provide more detailed information ({formData.details.length}/10 characters minimum)
                    </p>
                  ) : null}
                </div>

                {/* User Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3">User Information</h3>
                  
                  {/* Requesting Personnel */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requesting Personnel:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                      value={displayName}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                        value={formData.position}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                        value={formData.contact_number}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  {/* Requesting Office */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requesting Office:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 text-gray-700"
                      value={formData.requesting_office}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between mt-6">
                  <button
                    type="button"
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    onClick={() => navigate("/staffdashboard")}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    disabled={status.isSubmitting}
                  >
                    {status.isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Confirmation Modal */}
            {status.showConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full animate-fadeIn">
                  <h3 className="text-lg font-bold mb-4">Confirm Submission</h3>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to submit this electrical service request?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <p className="text-sm font-medium">Request Details:</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Date:</span> {formData.date_requested}</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Description:</span> {formData.details}</p>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setStatus(prev => ({ ...prev, showConfirmation: false }))}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                      disabled={status.isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      onClick={handleConfirmedSubmit}
                      disabled={status.isSubmitting}
                    >
                      {status.isSubmitting ? "Submitting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffElectrical;