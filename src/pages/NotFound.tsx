import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
      <div className="text-center">
        <p className="text-6xl mb-4">😔</p>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/dashboard")}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
