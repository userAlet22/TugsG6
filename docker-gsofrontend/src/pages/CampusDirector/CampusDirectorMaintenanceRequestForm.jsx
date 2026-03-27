import { useState, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CampusDirectorSidebar } from "../../components/CampusDirectorSidebar";

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    default:
      return state;
  }
};

const CampusDirectorMaintenanceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const DIRECTOR_ID = 10;

  const [currentUser, setCurrentUser] = useState({
    id: "", last_name: "", first_name: "", middle_name: "", suffix: "", role: "",
  });
  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [date_received, setDateReceived] = useState("");
  const [time_received, setTimeReceived] = useState("");
  const [priority_number, setPriorityNumber] = useState("");
  const [comment, setComment] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [approvedBy1, setApprovedBy1] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null); // 'approve' | 'deny' | null

  const [sidebarState, sidebarDispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
  });

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/idfullname`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setCurrentUser({
        id: data.user_id || "",
        last_name: data.last_name || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        suffix: data.suffix || "",
        role: data.role_id || "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentUserDisplayName = () => {
    if (!currentUser.last_name && !currentUser.first_name) return "Unknown User";
    let name = `${currentUser.last_name}, ${currentUser.first_name}`;
    if (currentUser.middle_name) name += ` ${currentUser.middle_name.charAt(0)}.`;
    if (currentUser.suffix) name += ` ${currentUser.suffix}`;
    return name.trim();
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      navigate("/loginpage");
    } else {
      setToken(authToken);
      fetchCurrentUser(authToken);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) { setError("Invalid request ID"); return; }
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/directorpov/${id}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch request details");
        const responseData = data.data || data;
        setRequestDetails(responseData);
        setDateReceived((prev) => prev || responseData.date_received || new Date().toISOString().split("T")[0]);
        setTimeReceived((prev) => prev || responseData.time_received || new Date().toTimeString().slice(0, 5));
        setPriorityNumber(responseData.priority_number || "");
        setApprovedBy1(responseData.approved_by_1 || null);

        const res2 = await fetch(`${API_BASE_URL}/users/idfullname`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const userInfo = await res2.json();
        setApprovedById(userInfo.user_id || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchRequestDetails();
  }, [id, token, API_BASE_URL]);

  const formatTimeTo24Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes}:00`;
  };

  const handleDecision = async (action) => {
    if (action === "deny" && !comment.trim()) {
      setError("Comment is required to deny the request.");
      setShowConfirm(null);
      return;
    }
    if (!approvedBy1) {
      setError("You cannot approve this request until Head 1 has approved it.");
      setShowConfirm(null);
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const endpoint = action === "deny"
        ? `${API_BASE_URL}/maintenance-requests/${id}/disapprove`
        : `${API_BASE_URL}/maintenance-requests/${id}/approve-director`;

      const payload = {
        id,
        date_received,
        time_received: formatTimeTo24Hour(time_received),
        priority_number,
        comment,
        approved_by: approvedById,
        ...(action === "deny" && { status: "denied" }),
      };

      if (approvedById === DIRECTOR_ID && approvedBy1) {
        payload.verified_by_director = approvedById;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request submission failed");
      navigate("/campusdirectorrequests");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setShowConfirm(null);
    }
  };

  const isDirectorVerified = Boolean(requestDetails.verified_by_director);
  const alreadyApproved = approvedById === DIRECTOR_ID && isDirectorVerified;

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      Approved: "bg-green-100 text-green-800 border border-green-300",
      Disapproved: "bg-red-100 text-red-800 border border-red-300",
      Verified: "bg-blue-100 text-blue-800 border border-blue-300",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border border-gray-300";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
        <div className="hidden md:block text-xl font-bold">Campus Director</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <CampusDirectorSidebar
          isSidebarCollapsed={sidebarState.isSidebarCollapsed}
          onToggleSidebar={() => sidebarDispatch({ type: "TOGGLE_SIDEBAR" })}
          onLogout={() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            navigate("/loginpage", { replace: true });
          }}
        />

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6 lg:p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/campusdirectorrequests")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Requests
          </button>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="mt-4 text-gray-600 font-medium">Loading request details...</p>
            </div>
          )}

          {!isLoading && (
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Title + Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Request Approval</h2>
                    <p className="text-sm text-gray-500 mt-1">Request ID: #{id}</p>
                  </div>
                  {requestDetails.status && (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(requestDetails.status)}`}>
                      {requestDetails.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Request Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">
                  Request Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Request Date", value: requestDetails.date_requested ? new Date(requestDetails.date_requested).toLocaleDateString() : "N/A" },
                    { label: "Personnel Name", value: requestDetails.requesting_personnel },
                    { label: "Position", value: requestDetails.position },
                    { label: "Office", value: requestDetails.requesting_office },
                    { label: "Maintenance Type", value: requestDetails.maintenance_type },
                    { label: "Contact Number", value: requestDetails.contact_number },
                    { label: "Priority Number", value: requestDetails.priority_number },
                    { label: "Date Received", value: requestDetails.date_received },
                    { label: "Time Received", value: requestDetails.time_received },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {label}
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm">
                        {value || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm min-h-[80px]">
                    {requestDetails.details || "N/A"}
                  </div>
                </div>
              </div>

              {/* Approval Trail */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">
                  Approval Trail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requestDetails.verified_by && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Verified By</label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-blue-900 text-sm font-medium">
                        ✓ {requestDetails.verified_by}
                      </div>
                    </div>
                  )}
                  {requestDetails.approved_by_1 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved By Head</label>
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-green-900 text-sm font-medium">
                        ✓ {requestDetails.approved_by_1}
                      </div>
                    </div>
                  )}
                  {requestDetails.approved_by_2 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved By Campus Director</label>
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-green-900 text-sm font-medium">
                        ✓ {requestDetails.approved_by_2}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Comments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">
                  Staff Comments
                </h3>
                {Array.isArray(requestDetails.comments) && requestDetails.comments.length > 0 ? (
                  <div className="space-y-3">
                    {requestDetails.comments.map((c) => (
                      <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-800">{c.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By: {c.user} ({c.role}) • {c.date} {c.time}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No comments yet.</p>
                )}
              </div>

              {/* Action Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b">
                  Action Required
                </h3>

                {/* Approving Officer */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Approving Officer
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm font-medium">
                    {getCurrentUserDisplayName()}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Comment <span className="text-red-400">(required when denying)</span>
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your comments here..."
                  />
                </div>

                {/* Waiting for Head */}
                {!approvedBy1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800 text-sm mb-4">
                    ⚠ Waiting for Head approval before Campus Director can act.
                  </div>
                )}

                {/* Buttons */}
                {alreadyApproved ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-center text-blue-800 font-semibold">
                    ✓ You have already approved this request.
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowConfirm("approve")}
                      disabled={!approvedBy1}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirm("deny")}
                      disabled={!approvedBy1}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      ✕ Deny
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              showConfirm === "approve" ? "bg-green-100" : "bg-red-100"
            }`}>
              <span className="text-2xl">{showConfirm === "approve" ? "✓" : "✕"}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {showConfirm === "approve" ? "Approve Request?" : "Deny Request?"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {showConfirm === "approve"
                ? "Are you sure you want to approve this maintenance request?"
                : "Are you sure you want to deny this request? Make sure you've added a comment."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(showConfirm)}
                disabled={isLoading}
                className={`flex-1 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                  showConfirm === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isLoading ? "Processing..." : showConfirm === "approve" ? "Yes, Approve" : "Yes, Deny"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusDirectorMaintenanceRequestForm;