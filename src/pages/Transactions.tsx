import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Transactions() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/exchanges", { replace: true }); }, [navigate]);
  return null;
}
