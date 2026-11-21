import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import { followUser, unfollowUser } from "./profileApi";
import { toActionMessage } from "./profileErrors";

function FollowButton({ profile, onChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inFlight = useRef(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: location.pathname + location.search },
      });
      return;
    }

    // Penjaga klik ganda: state React baru berlaku setelah render.
    if (inFlight.current) return;

    inFlight.current = true;
    setPending(true);
    setErrorMsg("");

    try {
      const action = profile.isFollowing ? unfollowUser : followUser;
      const { isFollowing, followersCount } = await action(profile.username);

      onChange({ isFollowing, followersCount });
    } catch (error) {
      setErrorMsg(toActionMessage(error) ?? "");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={profile.isFollowing}
        aria-busy={pending}
        className={
          profile.isFollowing
            ? "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            : "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {profile.isFollowing ? "Mengikuti" : "Ikuti"}
      </button>

      {errorMsg && (
        <p
          role="alert"
          className="max-w-xs text-sm text-red-700 dark:text-red-400"
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}

export default FollowButton;
