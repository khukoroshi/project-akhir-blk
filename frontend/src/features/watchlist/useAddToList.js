import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

/*
 * addToList(externalId, status, title) -> { ok, message, alreadyInList? } | null
 * null = nothing happened (redirected to login, or a request is in flight).
 * alreadyInList = true when the server answers 409.
 */
export default function useAddToList() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const inFlight = useRef(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const addToList = useCallback(
    async (externalId, status, title = "Anime") => {
      if (!isAuthenticated) {
        navigate("/login", {
          state: { from: location.pathname + location.search },
        });
        return null;
      }

      if (inFlight.current) return null;

      inFlight.current = true;
      setPendingStatus(status);

      try {
        await api.post("/anime", { externalId, status });
        return { ok: true, message: `${title} was added to My List!` };
      } catch (error) {
        return {
          ok: false,
          alreadyInList: error.response?.status === 409,
          message: error.response?.data?.message || "Failed to add anime.",
        };
      } finally {
        inFlight.current = false;
        setPendingStatus(null);
      }
    },
    [isAuthenticated, navigate, location.pathname, location.search],
  );

  return { addToList, pendingStatus };
}
