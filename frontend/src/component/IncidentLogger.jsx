import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [username, setUsername] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    type: "",
    impact: "",
    file: null,
    timestamp: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 5;

  const navigate = useNavigate();
  const incidentsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username || "User");
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }

    const fetchIncidents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/incidents");
        setIncidents(res.data);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
    };

    fetchIncidents();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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

    try {
      const data = new FormData();
      data.append("title", formData.title);
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
        setIncidents([...incidents, res.data]);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        type: "",
        impact: "",
        file: null,
      });
      document.getElementById("fileInput").value = "";
    } catch (error) {
      console.error("Error saving incident:", error);
    }
  };

  const handleEdit = (index) => {
    setFormData(incidents[index]);
    setEditingIndex(index);
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
    } catch (error) {
      console.error("Error deleting incident:", error);
    }
  };

  const impactColors = {
    Low: "bg-green-600",
    Medium: "bg-yellow-600",
    High: "bg-orange-600",
    Critical: "bg-red-700",
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
    <div className="flex h-screen bg-gray-950 text-gray-300">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col p-6 shadow-lg">
        {/* Profile Section */}
        <div className="flex flex-col items-center">
          {/* Profile Circle */}
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold mb-3 shadow-md text-indigo-400">
            {username?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Profile Button */}
          <button className="w-full border border-gray-600 text-sm text-gray-300 py-2 rounded-lg mb-6 hover:border-indigo-500 hover:text-indigo-400 transition-colors duration-200">
            Profile
          </button>
        </div>

        {/* Navigation */}
        <ul className="flex-1 space-y-2 text-gray-300">
          <li
            onClick={scrollToIncidents}
            className="px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-indigo-400 cursor-pointer transition-colors duration-200"
          >
            📋 Logged Incidents
          </li>
        </ul>

        {/* Bottom Section */}
        <div className="mt-auto space-y-4">
          {/* App Title */}
          <h2 className="text-lg font-bold flex items-center justify-between text-gray-200">
            Incident Logger
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold shadow">
              BETA
            </span>
          </h2>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full border border-red-600 text-red-500 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          HSE Incident Log
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-600 text-white font-semibold shadow">
            Beta
          </span>
        </h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-6 rounded-xl shadow-md space-y-4"
        >
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Incident Title"
            className="w-full h-12 p-3 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition transform hover:scale-[1.01] hover:shadow-lg"
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full h-12 p-3 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 transition transform hover:scale-[1.01] hover:shadow-lg"
          >
            <option value="">Select Type</option>
            <option value="Injury">Injury</option>
            <option value="Near Miss">Near Miss</option>
            <option value="Hazard">Hazard</option>
          </select>

          <select
            name="impact"
            value={formData.impact}
            onChange={handleChange}
            className="w-full h-12 p-3 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 transition transform hover:scale-[1.01] hover:shadow-lg"
          >
            <option value="">Select Impact</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Brief description of incident"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition transform hover:scale-[1.01] hover:shadow-lg"
          ></textarea>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full h-12 p-3 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 transition transform hover:scale-[1.01] hover:shadow-lg"
          />

          <input
            type="file"
            name="file"
            id="fileInput"
            onChange={(e) =>
              setFormData({ ...formData, file: e.target.files[0] })
            }
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition w-full"
          >
            {editingIndex !== null ? "Update Incident" : "Submit Incident"}
          </button>
        </form>

        {/* List */}
        <div ref={incidentsRef} className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Logged Incidents</h2>
          <ul className="space-y-4">
            {currentIncidents.map((incident, index) => (
              <li
                key={index}
                className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition"
              >
                <h3 className="text-lg font-bold">{incident.title}</h3>
                <p className="text-sm">{incident.description}</p>
                <p className="text-xs text-gray-400">📅 {incident.date}</p>
                <p className="text-xs text-gray-400">⏰ {incident.timestamp}</p>
                {incident.file && (
                  <a
                    href={`http://localhost:5000${incident.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 View File
                  </a>
                )}
                <br />
                {incident.type && (
                  <span className="inline-block bg-blue-600 px-2 py-1 text-xs rounded-lg mt-1">
                    {incident.type}
                  </span>
                )}
                {incident.impact && (
                  <span
                    className={`inline-block ${
                      impactColors[incident.impact]
                    } px-2 py-1 text-xs rounded-lg mt-1 ml-2`}
                  >
                    {incident.impact}
                  </span>
                )}
                <div className="mt-3 space-x-2">
                  <button
                    onClick={() => handleEdit(indexOfFirst + index)}
                    className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteIndex(indexOfFirst + index);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-lg font-bold mb-4 text-white">
                Confirm Delete
              </h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this incident?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDelete}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
