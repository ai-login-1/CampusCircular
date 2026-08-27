import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  navigate("/login", { replace: true });
  return null;
}
