import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HeadSidebar, HEAD_MENU_ITEMS } from "../../components/HeadSidebar";

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    default:
      return state;
  }
};

const HeadViewMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [sidebarState, sidebarDispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const authToken =
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) {
        setError("Invalid request ID");
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/headpov/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to fetch request details");
        setRequestDetails(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchRequestDetails();
  }, [id, token, API_BASE_URL]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">
          ManageIT
        </span>
        <div className="hidden md:block text-xl font-bold">Head</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <HeadSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => sidebarDispatch({ type: "TOGGLE_SIDEBAR" })}
          menuItems={HEAD_MENU_ITEMS}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />

        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-2xl">

              {/* Title */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigate("/headrequests")}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to Requests
                </button>
                <h2 className="text-2xl font-bold text-center">
                  Request Details
                </h2>
                <div />
              </div>

              {/* Status Badge */}
              {!isLoading && requestDetails.status && (
                <div className="flex justify-center mb-6">
                  <span className={`px-6 py-2 rounded-full text-sm font-bold ${
                    requestDetails.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : requestDetails.status === "Disapproved"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {requestDetails.status}
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  <p className="mt-2 text-gray-600">Loading request details...</p>
                </div>
              )}

              {/* Request Details */}
              {!isLoading && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Request Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Request Date:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.date_requested
                          ? new Date(requestDetails.date_requested).toLocaleDateString()
                          : "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Personnel Name:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.requesting_personnel || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Position:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.position || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Office:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.requesting_office || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Maintenance Type:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.maintenance_type || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contact Number:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.contact_number || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Date Received:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.date_received || "N/A"}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Time Received:
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        value={requestDetails.time_received || "N/A"}
                        disabled
                      />
                    </div>

                    {/* Verified By */}
                    {requestDetails.verified_by && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Verified By:
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          value={requestDetails.verified_by}
                          disabled
                        />
                      </div>
                    )}

                    {/* Approved By Head */}
                    {requestDetails.approved_by_1 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Approved By Head:
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          value={requestDetails.approved_by_1}
                          disabled
                        />
                      </div>
                    )}

                    {/* Approved By Campus Director */}
                    {requestDetails.approved_by_2 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Approved By Campus Director:
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                          value={requestDetails.approved_by_2}
                          disabled
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Description:
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                      rows="4"
                      value={requestDetails.details || "N/A"}
                      disabled
                    />
                  </div>

                  {/* Staff Comments */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Staff Comments:
                    </label>
                    {Array.isArray(requestDetails.comments) &&
                    requestDetails.comments.length > 0 ? (
                      <div className="space-y-2">
                        {requestDetails.comments.map((c) => (
                          <div key={c.id} className="p-2 bg-gray-100 rounded">
                            <div className="text-sm text-gray-800">{c.comment}</div>
                            <div className="text-xs text-gray-500">
                              By: {c.user} ({c.role}) on {c.date} {c.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                        rows="2"
                        value="No comments"
                        disabled
                      />
                    )}
                  </div>

                  {/* Back Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => navigate("/headrequests")}
                      className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 font-semibold transition-colors"
                    >
                      Back to Requests
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HeadViewMaintenanceRequestForm;
```

---

## How to add this file:

### Step 1 — Create new file
In VS Code Explorer:
```
src/pages/Head/
```
Right-click → **New File** → name it:
```
HeadViewMaintenanceRequestForm.jsx