import { useNavigate } from "react-router-dom";

function IncidentLogger() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // ✅ Clear token
    localStorage.removeItem("token");

    // ✅ Redirect back to login
    navigate("/login");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Incident Logger</h2>
      </div>

      {/* Main content of Incident Logger */}
      <p>Welcome! You can now log incidents here.</p>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}

export default IncidentLogger;
