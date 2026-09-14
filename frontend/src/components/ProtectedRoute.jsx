import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted">Loading...</div>;
  }
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}
