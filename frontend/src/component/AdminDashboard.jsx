import { useState, useEffect, useMemo, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Helper objects for styling and icons, consistent with the user dashboard
const impactColors = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Critical: "bg-red-100 text-red-800 border-red-200",
};

const typeIcons = {
  Injury: "🏥",
  "Near Miss": "⚠️",
  Hazard: "⚡",
  Environmental: "🌍",
  "Equipment Failure": "🔧",
};

function AdminDashboard() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byImpact: {},
    byType: {},
  });
  const [filters, setFilters] = useState({
    impact: "",
    type: "",
    userId: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  }, [navigate]);

  // Replace the fetchAllIncidents function with:
  useEffect(() => {
    const fetchAllIncidents = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          handleLogout();
          return;
        }

        // Check admin role
        if (decoded.role !== "admin") {
          alert("Access denied. You are not an administrator.");
          navigate("/IncidentLogger");
          return;
        }

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Use the admin API endpoint
        const res = await axios.get(
          "http://localhost:5000/api/admin/incidents"
        );
        setAllIncidents(res.data.incidents || res.data);

        // Also fetch stats if available
        try {
          // eslint-disable-next-line no-unused-vars
          const statsRes = await axios.get(
            "http://localhost:5000/api/admin/stats"
          );
          // Handle stats response
        // eslint-disable-next-line no-unused-vars
        } catch (statsError) {
          console.log("Stats not available yet");
        }
      } catch (error) {
        console.error("Error fetching all incidents:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert("Access denied. Admin privileges required.");
          navigate("/IncidentLogger");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllIncidents();
  }, [navigate, handleLogout]);

  // Calculate stats and unique users whenever incidents data changes
  useEffect(() => {
    if (allIncidents.length > 0) {
      const newStats = {
        total: allIncidents.length,
        byImpact: allIncidents.reduce((acc, incident) => {
          acc[incident.impact] = (acc[incident.impact] || 0) + 1;
          return acc;
        }, {}),
        byType: allIncidents.reduce((acc, incident) => {
          acc[incident.type] = (acc[incident.type] || 0) + 1;
          return acc;
        }, {}),
      };
      setStats(newStats);

      const users = [
        ...new Map(
          allIncidents.map((item) => [item.user._id, item.user])
        ).values(),
      ];
      setUniqueUsers(users);
    }
  }, [allIncidents]);

  // Memoized hook to filter and sort incidents based on state
  const filteredAndSortedIncidents = useMemo(() => {
    let processedIncidents = [...allIncidents];

    // Apply filters
    if (filters.impact) {
      processedIncidents = processedIncidents.filter(
        (i) => i.impact === filters.impact
      );
    }
    if (filters.type) {
      processedIncidents = processedIncidents.filter(
        (i) => i.type === filters.type
      );
    }
    if (filters.userId) {
      processedIncidents = processedIncidents.filter(
        (i) => i.user._id === filters.userId
      );
    }

    // Apply sorting
    const impactOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    processedIncidents.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === "impact") {
        valA = impactOrder[a.impact] || 0;
        valB = impactOrder[b.impact] || 0;
      } else {
        // Default to date
        valA = new Date(a.date);
        valB = new Date(b.date);
      }

      if (valA < valB) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    return processedIncidents;
  }, [allIncidents, filters, sortConfig]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-xs text-gray-500">HSE Incident Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            className="w-full flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium"
          >
            📊 Dashboard
          </a>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-700 to-indigo-500 bg-clip-text text-transparent">
            Administrator Dashboard
          </h1>
        </header>

        <div className="p-6 space-y-8">
          {/* Stats Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              Analytics Overview
            </h2>
            {loading ? (
              <p>Loading stats...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                  <h3 className="text-gray-500 font-medium">Total Incidents</h3>
                  <p className="text-4xl font-bold text-indigo-600">
                    {stats.total}
                  </p>
                </div>
                {/* Stats by Impact */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 col-span-1 md:col-span-1 lg:col-span-2">
                  <h3 className="text-gray-500 font-medium">By Impact</h3>
                  <div className="flex justify-around items-center mt-2">
                    {Object.entries(stats.byImpact).map(([impact, count]) => (
                      <div key={impact} className="text-center">
                        <p
                          className={`text-3xl font-bold ${
                            impactColors[impact]
                              .replace("bg-", "text-")
                              .split(" ")[0]
                          }`}
                        >
                          {count}
                        </p>
                        <p className="text-sm text-gray-500">{impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Stats by Type */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                  <h3 className="text-gray-500 font-medium">
                    Most Frequent Type
                  </h3>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-3xl font-bold text-indigo-600">
                      {Object.keys(stats.byType).length > 0
                        ? Object.entries(stats.byType).reduce((a, b) =>
                            b[1] > a[1] ? b : a
                          )[0]
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Incidents List Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">
              All Incident Reports
            </h2>
            {/* Filter and Sort Controls */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200/80 mb-6 flex flex-wrap gap-4 items-center">
              <h3 className="text-gray-600 font-medium">Filter By:</h3>
              <select
                name="impact"
                onChange={handleFilterChange}
                className="p-2 border rounded-md bg-gray-50"
              >
                <option value="">Any Impact</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                name="type"
                onChange={handleFilterChange}
                className="p-2 border rounded-md bg-gray-50"
              >
                <option value="">Any Type</option>
                <option value="Injury">Injury</option>
                <option value="Near Miss">Near Miss</option>
                <option value="Hazard">Hazard</option>
                <option value="Environmental">Environmental</option>
                <option value="Equipment Failure">Equipment Failure</option>
              </select>
              <select
                name="userId"
                onChange={handleFilterChange}
                className="p-2 border rounded-md bg-gray-50"
              >
                <option value="">Any User</option>
                {uniqueUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <div className="flex-grow"></div>
              <button
                onClick={() => handleSortChange("date")}
                className="p-2 text-sm text-gray-600 font-semibold"
              >
                Sort by Date{" "}
                {sortConfig.key === "date" &&
                  (sortConfig.direction === "descending" ? "▼" : "▲")}
              </button>
              <button
                onClick={() => handleSortChange("impact")}
                className="p-2 text-sm text-gray-600 font-semibold"
              >
                Sort by Impact{" "}
                {sortConfig.key === "impact" &&
                  (sortConfig.direction === "descending" ? "▼" : "▲")}
              </button>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-10">
                Loading incidents...
              </p>
            ) : filteredAndSortedIncidents.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                No incidents match the current filters.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="bg-white p-4 rounded-xl shadow-md border border-gray-200/80 transition hover:shadow-lg"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div className="md:col-span-2">
                        <p className="font-bold text-lg text-slate-800">
                          {incident.title}
                        </p>
                        {/* THIS IS THE NEW PART: Displaying the user's name */}
                        <p className="text-sm text-gray-500">
                          Reported by:{" "}
                          <span className="font-semibold">
                            {incident.user.name}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">
                          {typeIcons[incident.type]}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                          {incident.type}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                            impactColors[incident.impact]
                          }`}
                        >
                          {incident.impact} Impact
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        <p>{new Date(incident.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
