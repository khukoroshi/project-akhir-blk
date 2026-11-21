import { Link } from "react-router-dom";

import formatDate from "../../utils/formatDate";
import FollowButton from "./FollowButton";

function formatJoinedDate(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function ProfileHeader({ profile, onProfileChange }) {
  const joined = formatJoinedDate(profile.joinedAt);

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          {profile.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {profile.displayName}
            </h1>

            {profile.isPrivate && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Privat
              </span>
            )}

            {profile.isSelf && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                Ini profil kamu
              </span>
            )}
          </div>

          <p className="break-all text-sm text-slate-500 dark:text-slate-400">
            @{profile.username}
          </p>

          {profile.bio ? (
            <p className="mt-3 whitespace-pre-line break-words text-slate-700 dark:text-slate-300">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
              Belum ada bio.
            </p>
          )}

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-slate-500 dark:text-slate-400">Followers</dt>
              <dd
                aria-live="polite"
                aria-atomic="true"
                className="font-semibold text-slate-900 dark:text-white"
              >
                {profile.followersCount}
              </dd>
            </div>

            <div className="flex gap-1.5">
              <dt className="text-slate-500 dark:text-slate-400">Following</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {profile.followingCount}
              </dd>
            </div>

            {joined && (
              <div className="flex gap-1.5">
                <dt className="text-slate-500 dark:text-slate-400">
                  Bergabung
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  <time dateTime={profile.joinedAt}>{joined}</time>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="sm:shrink-0">
          {profile.isSelf ? (
            <Link
              to="/profile/edit"
              className="inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Edit profil
            </Link>
          ) : (
            <FollowButton profile={profile} onChange={onProfileChange} />
          )}
        </div>
      </div>
    </header>
  );
}

export default ProfileHeader;
