import { useState, useEffect, useRef, useCallback } from "react";

// Simulated data and functions for demo purposes
const mockUser = {
  name: "John Doe",
  email: "john.doe@company.com",
  profilePic: null
};

const mockIncidents = [
  {
    _id: "1",
    title: "Slip and Fall in Warehouse",
    description: "Employee slipped on wet floor near loading dock. Minor injury to ankle, first aid administered.",
    date: "2024-12-15",
    type: "Injury",
    impact: "Medium",
    file: "/uploads/incident1.pdf",
    createdAt: "2024-12-15T10:30:00Z"
  },
  {
    _id: "2", 
    title: "Chemical Spill in Lab",
    description: "Small chemical spill contained quickly. No injuries reported, proper cleanup procedures followed.",
    date: "2024-12-14",
    type: "Environmental",
    impact: "Low",
    file: null,
    createdAt: "2024-12-14T14:15:00Z"
  },
  {
    _id: "3",
    title: "Near Miss - Forklift Operation",
    description: "Forklift nearly collided with pedestrian in warehouse. Safety protocols reviewed with both parties.",
    date: "2024-12-13",
    type: "Near Miss", 
    impact: "High",
    file: "/uploads/incident3.jpg",
    createdAt: "2024-12-13T09:20:00Z"
  }
];

function Dashboard() {
  const [username, setUsername] = useState("John");
  const [userProfile, setUserProfile] = useState(mockUser);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
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

  const incidentsRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // Simulated functions
  const handleLogout = useCallback(() => {
    alert("Logout functionality would redirect to login page");
  }, []);

  const fetchUserProfile = useCallback(async () => {
    // Simulated API call
    setUserProfile(mockUser);
  }, []);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIncidents(mockIncidents);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Simulated token check and data fetching
    setUsername("John");
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingProfilePic(true);

    // Simulate upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserProfile(prev => ({ ...prev, profilePic: e.target.result }));
        setShowProfileModal(false);
        setUploadingProfilePic(false);
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  const handleRemoveProfilePic = async () => {
    setUserProfile(prev => ({ ...prev, profilePic: null }));
    setShowProfileModal(false);
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

    // Simulate form submission
    setTimeout(() => {
      const newIncident = {
        _id: Date.now().toString(),
        ...formData,
        file: formData.file ? `/uploads/${formData.file.name}` : null,
        createdAt: new Date().toISOString()
      };

      if (editingIndex !== null) {
        const updatedIncidents = [...incidents];
        updatedIncidents[editingIndex] = { ...updatedIncidents[editingIndex], ...newIncident };
        setIncidents(updatedIncidents);
        setEditingIndex(null);
      } else {
        setIncidents([newIncident, ...incidents]);
      }

      setFormData({
        title: "",
        description: "",
        date: "",
        type: "",
        impact: "",
        file: null,
      });
      
      setSubmitting(false);
    }, 1000);
  };

  const handleEdit = (index) => {
    const actualIndex = indexOfFirst + index;
    const incident = incidents[actualIndex];
    setFormData({
      title: incident.title,
      description: incident.description,
      date: incident.date,
      type: incident.type,
      impact: incident.impact,
      file: null
    });
    setEditingIndex(actualIndex);
    incidentsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async () => {
    const updatedIncidents = incidents.filter((_, i) => i !== deleteIndex);
    setIncidents(updatedIncidents);
    setShowDeleteModal(false);
    setDeleteIndex(null);
    
    if (updatedIncidents.length <= (currentPage - 1) * incidentsPerPage && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const impactColors = {
    Low: "bg-gradient-to-r from-green-500 to-green-600",
    Medium: "bg-gradient-to-r from-yellow-500 to-orange-500",
    High: "bg-gradient-to-r from-orange-500 to-red-500",
    Critical: "bg-gradient-to-r from-red-600 to-red-700",
  };

  const typeIcons = {
    "Injury": "🏥",
    "Near Miss": "⚠️",
    "Hazard": "⚡",
    "Environmental": "🌍",
    "Equipment Failure": "🔧"
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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 overflow-hidden">
      {/* ✨ Enhanced Collapsible Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-500 ease-in-out bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 flex flex-col backdrop-blur-xl relative`}>
        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-4 top-6 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-110 z-10 border-2 border-slate-700"
        >
          {sidebarCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7" />
            </svg>
          )}
        </button>

        <div className={`p-6 flex-1 ${sidebarCollapsed ? 'px-2 py-4' : ''}`}>
          {/* Profile Section */}
          <div className={`flex flex-col items-center transition-all duration-500 ${sidebarCollapsed ? 'scale-90 mb-4' : 'mb-6'}`}>
            {/* Profile Circle */}
            <div 
              className="relative group cursor-pointer"
              onClick={() => !sidebarCollapsed && setShowProfileModal(true)}
            >
              <div className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-20 h-20'} rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-0.5 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                <div className="w-full h-full rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img 
                      src={userProfile.profilePic} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className={`bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent ${sidebarCollapsed ? 'text-lg' : 'text-2xl'}`}>
                      {username?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <span className="text-xs">📸</span>
                </div>
              )}
            </div>

            {/* User Info */}
            {!sidebarCollapsed && (
              <div className="text-center mt-4 animate-fade-in">
                <h3 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {userProfile?.name || username}
                </h3>
                <p className="text-sm text-gray-400 mb-1">{userProfile?.email}</p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span>{incidents.length} incidents</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={`space-y-2 ${sidebarCollapsed ? 'mt-2' : 'mt-8'}`}>
            <button
              onClick={scrollToIncidents}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-1 py-2' : 'px-4 py-3'} rounded-xl text-left hover:bg-slate-700/50 transition-all duration-300 group hover:scale-105 bg-slate-800/50 border border-slate-700/30`}
            >
              <span className={`${sidebarCollapsed ? 'text-lg' : 'text-xl'} group-hover:scale-110 transition-transform duration-300`}>📊</span>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <div className="font-medium text-gray-200">My Incidents</div>
                  <div className="text-xs text-gray-500">View & manage reports</div>
                </div>
              )}
            </button>

            <button
              onClick={() => fetchIncidents()}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-1 py-2' : 'px-4 py-3'} rounded-xl text-left hover:bg-gradient-to-r hover:from-emerald-600/20 hover:to-teal-600/20 transition-all duration-300 group hover:scale-105 border border-transparent hover:border-emerald-500/30`}
            >
              <span className={`${sidebarCollapsed ? 'text-lg' : 'text-xl'} group-hover:scale-110 transition-transform duration-300`}>🔄</span>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <div className="font-medium text-gray-200">Refresh Data</div>
                  <div className="text-xs text-gray-500">Update incidents list</div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`space-y-4 border-t border-slate-700/30 ${sidebarCollapsed ? 'p-2' : 'p-6'}`}>
          {!sidebarCollapsed && (
            <div className="text-center">
              <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
                <span>HSE Incident Logger</span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-lg">
                  BETA
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-1 py-2' : 'px-4 py-3'} rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/25`}
          >
            <span className={`${sidebarCollapsed ? 'text-lg' : 'text-xl'}`}>🚪</span>
            {!sidebarCollapsed && <span className="font-medium ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ✨ Enhanced Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                HSE Incident Logger
              </h1>
              <p className="text-gray-400 mt-1">Personal incident tracking & reporting</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                <span className="text-sm text-gray-300">Welcome back, <span className="font-semibold text-white">{username}</span></span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* ✨ Enhanced Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/30 space-y-6 hover:shadow-3xl transition-all duration-500"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {editingIndex !== null ? "Update Incident" : "Report New Incident"}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Incident Title"
                className="col-span-full h-14 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition-all duration-300 hover:bg-slate-700/70 backdrop-blur-sm"
                required
              />

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="h-14 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-slate-700/70"
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
                className="h-14 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-slate-700/70"
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
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition-all duration-300 hover:bg-slate-700/70 resize-none"
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="h-14 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-slate-700/70"
                required
              />

              <div className="relative">
                <input
                  type="file"
                  name="file"
                  id="fileInput"
                  onChange={(e) =>
                    setFormData({ ...formData, file: e.target.files[0] })
                  }
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                  className="w-full h-14 bg-slate-700/50 border border-slate-600/50 rounded-xl transition-all duration-300 hover:bg-slate-700/70 text-transparent
                    file:absolute file:left-1/2 file:top-1/2 file:-translate-x-1/2 file:-translate-y-1/2
                    file:py-2 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                    file:bg-gradient-to-r file:from-indigo-500 file:to-purple-600 file:text-white 
                    hover:file:from-indigo-600 hover:file:to-purple-700 file:transition-all file:duration-300
                    cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">{editingIndex !== null ? "✏️" : "📝"}</span>
                  <span>{editingIndex !== null ? "Update Incident" : "Submit Incident"}</span>
                </>
              )}
            </button>
          </form>

          {/* ✨ Enhanced Incidents List */}
          <div ref={incidentsRef} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                My Incident Reports
              </h2>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-gray-300">
                  {incidents.length} total incidents
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-gray-400">Loading your incidents...</span>
                </div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/30">
                <div className="text-6xl mb-4 opacity-50">📋</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No incidents reported yet</h3>
                <p className="text-gray-500">Start by creating your first incident report above.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {currentIncidents.map((incident, index) => (
                  <div
                    key={incident._id || index}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/30 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{typeIcons[incident.type] || "📝"}</span>
                          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-300">
                            {incident.title}
                          </h3>
                        </div>
                        <p className="text-gray-300 mb-4 leading-relaxed">{incident.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>{new Date(incident.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>{new Date(incident.createdAt || incident.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {incident.file && (
                          <div className="inline-flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors duration-300 mb-4 cursor-pointer">
                            <span>📎</span>
                            <span className="underline">View Attachment</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {incident.type && (
                          <span className="px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-sm rounded-full border border-indigo-500/30">
                            {incident.type}
                          </span>
                        )}
                        {incident.impact && (
                          <span className={`px-3 py-1 ${impactColors[incident.impact]} text-white text-sm rounded-full shadow-lg font-semibold`}>
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
                <div className="flex items-center space-x-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/30">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        currentPage === i + 1
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-slate-700"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700/50 text-center max-w-md w-full mx-4 transform animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Profile Picture
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors duration-300"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-1 shadow-2xl">
                <div className="w-full h-full rounded-2xl bg-slate-800 flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {userProfile?.profilePic ? (
                    <img 
                      src={userProfile.profilePic} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent">
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
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700/50 text-center max-w-md w-full mx-4 transform animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to delete this incident? This action cannot be undone and all associated data will be permanently removed.
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
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
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
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;