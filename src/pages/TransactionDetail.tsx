import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function TransactionDetail() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/exchanges", { replace: true }); }, [navigate]);
  return null;
}
