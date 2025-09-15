import { useState, useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [username, setUsername] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    date: "",
    type: "",
    impact: "",
    file: null,
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 5;

  const navigate = useNavigate();
  const incidentsRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // ✅ Real functions with your actual API calls
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/profile");
      setUserProfile(res.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  }, [handleLogout]);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/incidents");
      setIncidents(res.data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const handlePopState = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);

        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired");
          handleLogout();
          return;
        }

        setUsername(decoded.username || decoded.name || "User");
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        fetchUserProfile();
        fetchIncidents();
      } catch (error) {
        console.error("Invalid token:", error);
        handleLogout();
      }
    } else {
      navigate("/login");
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, fetchUserProfile, fetchIncidents, handleLogout]);

  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("File size must be less than 1.5MB");
      return;
    }

    setUploadingProfilePic(true);

    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await axios.put(
        "http://localhost:5000/api/users/profile-pic",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUserProfile(res.data.user);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture");
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      const res = await axios.delete(
        "http://localhost:5000/api/users/profile-pic"
      );
      setUserProfile(res.data.user);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert("Error removing profile picture");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("description", formData.description);
      data.append("date", formData.date);
      data.append("type", formData.type);
      data.append("impact", formData.impact);
      data.append("timestamp", new Date().toISOString());
      if (formData.file) {
        data.append("file", formData.file);
      }

      let res;
      if (editingIndex !== null) {
        const incidentId = incidents[editingIndex]._id;
        res = await axios.put(
          `http://localhost:5000/api/incidents/${incidentId}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const updatedIncidents = [...incidents];
        updatedIncidents[editingIndex] = res.data;
        setIncidents(updatedIncidents);
        setEditingIndex(null);
      } else {
        res = await axios.post("http://localhost:5000/api/incidents", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setIncidents([res.data, ...incidents]);
      }

      setFormData({
        description: "",
        date: "",
        type: "",
        impact: "",
        file: null,
      });
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error saving incident:", error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        alert("Error saving incident. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (index) => {
    const actualIndex = indexOfFirst + index;
    setFormData(incidents[actualIndex]);
    setEditingIndex(actualIndex);
    incidentsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async () => {
    try {
      const incidentId = incidents[deleteIndex]._id;
      await axios.delete(`http://localhost:5000/api/incidents/${incidentId}`);

      const updatedIncidents = incidents.filter((_, i) => i !== deleteIndex);
      setIncidents(updatedIncidents);

      setShowDeleteModal(false);
      setDeleteIndex(null);

      if (
        updatedIncidents.length <= (currentPage - 1) * incidentsPerPage &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting incident:", error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        alert("Error deleting incident. Please try again.");
      }
    }
  };

  const impactColors = {
    Low: "bg-gradient-to-r from-green-500 to-green-600",
    Medium: "bg-gradient-to-r from-yellow-500 to-orange-500",
    High: "bg-gradient-to-r from-orange-500 to-red-500",
    Critical: "bg-gradient-to-r from-red-600 to-red-700",
  };

  const typeIcons = {
    Injury: "🏥",
    "Near Miss": "⚠️",
    Hazard: "⚡",
    Environmental: "🌍",
    "Equipment Failure": "🔧",
  };

  const scrollToIncidents = () => {
    incidentsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // pagination logic
  const indexOfLast = currentPage * incidentsPerPage;
  const indexOfFirst = indexOfLast - incidentsPerPage;
  const currentIncidents = incidents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(incidents.length / incidentsPerPage);

  return (
    // ✅ Changed: Main background to light gray
    <div className="flex h-screen bg-gray-100 text-gray-800 overflow-hidden">
      {/* ✨ Enhanced Collapsible Sidebar */}
      {/* ✅ Changed: Sidebar background to white */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-80"
        } transition-all duration-300 ease-in-out bg-white shadow-lg border-r border-gray-200 flex flex-col relative`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 z-10"
        >
          {sidebarCollapsed ? (
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          )}
        </button>

        {/* Header Section */}
        {!sidebarCollapsed && (
          // ✅ Changed: Border and text colors
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">HSE Logger</h1>
                <p className="text-xs text-gray-500">Incident Management</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className={`${sidebarCollapsed ? "p-4 pt-16" : "p-6"}`}>
          <div className="flex flex-col items-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => !sidebarCollapsed && setShowProfileModal(true)}
            >
              <div
                className={`${
                  sidebarCollapsed ? "w-12 h-12" : "w-16 h-16"
                } rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                {/* ✅ Changed: Inner background to light gray for contrast */}
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img
                      src={`http://localhost:5000${userProfile.profilePic}`}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span
                      className={`font-bold text-gray-600 ${
                        sidebarCollapsed ? "text-lg" : "text-xl"
                      }`}
                    >
                      {username?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
              {!sidebarCollapsed && (
                // ✅ Changed: Border color to match new background
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white">
                  <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              // ✅ Changed: Text colors for light background
              <div className="text-center mt-3">
                <h3 className="font-semibold text-gray-800">
                  {userProfile?.name || username}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {userProfile?.email}
                </p>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                  {incidents.length} Reports
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 ${sidebarCollapsed ? "px-2" : "px-6"}`}>
          <nav className="space-y-2">
            {/* ✅ Changed: Text colors for light mode */}
            <button
              onClick={scrollToIncidents}
              className={`w-full flex items-center ${
                sidebarCollapsed ? "justify-center py-3" : "px-4 py-3"
              } rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200 group text-gray-600 font-medium`}
            >
              <svg
                className={`${
                  sidebarCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
                } group-hover:scale-110 transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">My Incidents</div>
                  <div className="text-xs text-gray-500">View reports</div>
                </div>
              )}
            </button>

            <button
              onClick={() => fetchIncidents()}
              className={`w-full flex items-center ${
                sidebarCollapsed ? "justify-center py-3" : "px-4 py-3"
              } rounded-lg hover:bg-gray-100 hover:text-green-600 transition-colors duration-200 group text-gray-600 font-medium`}
            >
              <svg
                className={`${
                  sidebarCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
                } group-hover:rotate-180 transition-transform duration-300`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Refresh</div>
                  <div className="text-xs text-gray-500">Update data</div>
                </div>
              )}
            </button>
          </nav>
          {/* // Add this after your "Refresh Data" button: */}
          {!sidebarCollapsed && userProfile?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 group text-gray-700 font-medium"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Admin Panel</div>
                <div className="text-xs text-gray-500">System overview</div>
              </div>
            </button>
          )}
          {sidebarCollapsed && userProfile?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center justify-center py-3 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 group text-gray-700 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom Section */}
        {/* ✅ Changed: Border color */}
        <div
          className={`border-t border-gray-200 ${
            sidebarCollapsed ? "p-2" : "p-6"
          } space-y-4`}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">
                HSE Incident Logger
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                BETA
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center py-3" : "px-4 py-3"
            } rounded-lg bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 transition-colors duration-200 font-medium`}
          >
            <svg
              className={`${sidebarCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ✨ Enhanced Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        {/* ✅ Changed: Header background, border, and text colors */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-700 to-indigo-500 bg-clip-text text-transparent">
                HSE Incident Logger
              </h1>
              <p className="text-gray-500 mt-1">
                Personal incident tracking & reporting
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">
                  Welcome back,{" "}
                  <span className="font-semibold text-slate-800">
                    {username}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* ✨ Enhanced Form */}
          {/* ✅ Changed: Form background and border */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200/80 space-y-6 hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              {/* ✅ Changed: Text color */}
              <h2 className="text-2xl font-bold text-slate-900">
                {editingIndex !== null
                  ? "Update Incident"
                  : "Report New Incident"}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* ✅ Changed: Input field styles */}

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="h-14 p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-gray-100"
                required
              >
                <option value="">Select Incident Type</option>
                <option value="Injury">🏥 Injury</option>
                <option value="Near Miss">⚠️ Near Miss</option>
                <option value="Hazard">⚡ Hazard</option>
                <option value="Environmental">🌍 Environmental</option>
                <option value="Equipment Failure">🔧 Equipment Failure</option>
              </select>

              <select
                name="impact"
                value={formData.impact}
                onChange={handleChange}
                className="h-14 p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-gray-100"
                required
              >
                <option value="">Select Impact Level</option>
                <option value="Low">🟢 Low Impact</option>
                <option value="Medium">🟡 Medium Impact</option>
                <option value="High">🟠 High Impact</option>
                <option value="Critical">🔴 Critical Impact</option>
              </select>
            </div>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detailed description of the incident..."
              className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 transition-all duration-300 hover:bg-gray-100 resize-none"
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Date of Occurrence</p>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  placeholder="Detailed description of the incident..."
                  className="h-14 p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-gray-100"
                  required
                />
              </div>

              <div className="flex flex-col">
                <p className="text-sm text-gray-500">File Upload</p>
                {/* ✅ Changed: File input background */}
                <div className="relative">
                  <input
                    type="file"
                    name="file"
                    id="fileInput"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files[0] })
                    }
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                    className="w-full h-14 bg-gray-50 border border-gray-300 rounded-xl transition-all duration-300 hover:bg-gray-100 text-transparent
                    file:absolute file:left-4 file:top-1/2 file:-translate-y-1/2
                    file:py-2 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                    file:bg-gradient-to-r file:from-indigo-500 file:to-purple-600 file:text-white 
                    hover:file:from-indigo-600 hover:file:to-purple-700 file:transition-all file:duration-300
                    cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">
                    {editingIndex !== null ? "✏️" : "📝"}
                  </span>
                  <span>
                    {editingIndex !== null
                      ? "Update Incident"
                      : "Submit Incident"}
                  </span>
                </>
              )}
            </button>
          </form>
          {/* ✨ Enhanced Incidents List */}
          <div ref={incidentsRef} className="space-y-6">
            <div className="flex items-center justify-between">
              {/* ✅ Changed: Text gradient */}
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-gray-700 bg-clip-text text-transparent">
                My Incident Reports
              </h2>
              <div className="flex items-center space-x-3">
                {/* ✅ Changed: Badge styles */}
                <div className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-700">
                  {incidents.length} total incidents
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  {/* ✅ Changed: Text color */}
                  <span className="text-gray-600">
                    Loading your incidents...
                  </span>
                </div>
              </div>
            ) : incidents.length === 0 ? (
              // ✅ Changed: Empty state background and text colors
              <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-200/80">
                <div className="text-6xl mb-4 opacity-50">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No incidents reported yet
                </h3>
                <p className="text-gray-500">
                  Start by creating your first incident report above.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {currentIncidents.map((incident, index) => (
                  // ✅ Changed: Card background and border
                  <div
                    key={incident._id || index}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200/80 hover:shadow-xl hover:scale-[1.01] transition-all duration-500 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">
                            {typeIcons[incident.type] || "📝"}
                          </span>
                          {/* ✅ Changed: Text colors */}
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">
                            {incident.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {incident.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>
                              {new Date(incident.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>
                              {new Date(
                                incident.createdAt || incident.timestamp
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {incident.file && (
                          // ✅ Changed: Link colors
                          <div className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 transition-colors duration-300 mb-4 cursor-pointer">
                            <span>📎</span>
                            <span className="underline">View Attachment</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {incident.type && (
                          // ✅ Changed: Badge styles for better contrast
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full border border-indigo-200">
                            {incident.type}
                          </span>
                        )}
                        {incident.impact && (
                          <span
                            className={`px-3 py-1 ${
                              impactColors[incident.impact]
                            } text-white text-sm rounded-full shadow-lg font-semibold`}
                          >
                            {incident.impact}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteIndex(indexOfFirst + index);
                            setShowDeleteModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ✨ Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                {/* ✅ Changed: Pagination container */}
                <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      // ✅ Changed: Pagination button styles
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        currentPage === i + 1
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✨ Enhanced Profile Modal */}
      {showProfileModal && (
        // ✅ Changed: Modal overlay
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fade-in z-50">
          {/* ✅ Changed: Modal body and text */}
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-center max-w-md w-full mx-4 transform animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-gray-700 bg-clip-text text-transparent">
                Profile Picture
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-300"
              >
                ✕
              </button>
            </div>

            <div className="mb-8">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-1 shadow-2xl">
                {/* ✅ Changed: Inner background */}
                <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img
                      src={userProfile.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {username?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => profilePicInputRef.current?.click()}
                disabled={uploadingProfilePic}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {uploadingProfilePic ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>📷</span>
                    <span>Change Picture</span>
                  </>
                )}
              </button>

              {userProfile?.profilePic && (
                <button
                  onClick={handleRemoveProfilePic}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Remove Picture</span>
                </button>
              )}

              <input
                ref={profilePicInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4">
                Supported formats: JPG, PNG • Maximum size: 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Enhanced Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fade-in z-50">
          {/* ✅ Changed: Modal body and text */}
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-center max-w-md w-full mx-4 transform animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to delete this incident? This action cannot
              be undone and all associated data will be permanently removed.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                // ✅ Changed: Cancel button style
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        /* ✅ Changed: Custom scrollbar for light mode */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #e5e7eb; /* gray-200 */
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #9ca3af; /* gray-400 */
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
