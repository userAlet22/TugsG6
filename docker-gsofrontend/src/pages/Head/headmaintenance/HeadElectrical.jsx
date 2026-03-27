import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HeadElectrical = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // State for form inputs
  const [date_requested, setDateRequested] = useState("");
  const [details, setSpecificDetails] = useState("");
  const [requesting_personnel, setRequestingPersonnel] = useState("");
  const [position, setPosition] = useState("");
  const [requesting_office, setRequestingOffice] = useState("");
  const [contact_number, setContactNumber] = useState("");

  // State for handling errors and loading
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUserDetails, setIsFetchingUserDetails] = useState(true); // New state for user details loading

  // State for success message
  const [successMessage, setSuccessMessage] = useState("");

  // State for token
  const [token, setToken] = useState("");

  // Retrieve token and fetch user details
  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      setError("Unauthorized: Please log in.");
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }
    setToken(authToken);

    // Fetch user details
    const fetchUserDetails = async () => {
      try {
        setIsFetchingUserDetails(true); // Start loading user details
        const response = await fetch(`${API_BASE_URL}/users/reqInfo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user details");
        }

        // Autofill fields with user details
        setRequestingPersonnel(data.full_name || "Unknown User");
        setPosition(data.position || "Unknown Position");
        setRequestingOffice(data.office || "Unknown Office");
        setContactNumber(data.contact_number || "Unknown Contact");
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(err.message || "Failed to fetch user details");
      } finally {
        setIsFetchingUserDetails(false); // Stop loading user details
      }
    };

    fetchUserDetails();
  }, [API_BASE_URL, navigate]);

  // Autofill the date_requested field with the current date
  useEffect(() => {
    if (!date_requested) {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setDateRequested(currentDate);
    }
  }, [date_requested]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Unauthorized: Please log in.");
      setTimeout(() => navigate("/loginpage"), 2000);
      return;
    }

    // Form validation
    if (!date_requested || !details || !requesting_personnel || !position || !requesting_office || !contact_number) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      // Make API request to your backend
      const response = await fetch(`${API_BASE_URL}/maintenance-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date_requested,
          details,
          requesting_personnel,
          position,
          requesting_office,
          contact_number,
          maintenance_type_id: 3, // Electrical maintenance type ID
        }),
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized: Please log in.");
        } else {
          throw new Error(data.message || "Request submission failed");
        }
        return;
      }

      // Show success message
      setSuccessMessage("Request submitted successfully!");

      // Navigate back to maintenance page after a short delay
      setTimeout(() => {
        navigate("/headmaintenance");
      }, 3000); // 3 seconds delay
    } catch (err) {
      setError(err.message || "An error occurred during request submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 md:p-8 lg:p-10 shadow-lg rounded-lg w-full max-w-md md:max-w-xl lg:max-w-2xl transition-all duration-300">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY <br className="hidden sm:block" />
          GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
        </h2>
        <p className="text-sm md:text-base text-center mb-6 md:mb-8">
          User Request Slip (Electrical Section) <br className="hidden sm:block" />
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 text-green-500 p-3 rounded-lg mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {/* Loading User Details */}
        {isFetchingUserDetails ? (
          <p className="text-center text-gray-500">Loading user details...</p>
        ) : (
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {/* Date Requested */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Date Requested:
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={date_requested}
                onChange={(e) => setDateRequested(e.target.value)}
              />
            </div>

            {/* Specific Details */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Specific Details (Situations/Condition/Circumstances):
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows="3"
                value={details}
                onChange={(e) => setSpecificDetails(e.target.value)}
              ></textarea>
            </div>

            {/* Requesting Personnel */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Requesting Personnel (Fullname):
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={requesting_personnel}
                onChange={(e) => setRequestingPersonnel(e.target.value)}
                disabled
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Position:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled
              />
            </div>

            {/* Requesting Office */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Requesting Office (College/Department/Unit):
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={requesting_office}
                onChange={(e) => setRequestingOffice(e.target.value)}
                disabled
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                Contact Number:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={contact_number}
                onChange={(e) => setContactNumber(e.target.value)}
                disabled
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
              <button
                type="button"
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
                onClick={() => navigate("/headmaintenance")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HeadElectrical;