import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 👈 redirect after login

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // 👈

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // ✅ Store token in localStorage
      localStorage.setItem("token", res.data.token);

      setMessage(`✅ Logged in! Welcome back, ${res.data.user?.name || "User"}`);

      // ⬇️ Redirect user to Incident Logger page after login
      navigate("/IncidentLogger");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "❌ Invalid credentials, try again."
      );
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded"
        >
          Login
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}

export default Login;
