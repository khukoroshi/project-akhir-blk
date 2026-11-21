import { useEffect } from "react";
import { useParams } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/useAuth";
import useProfile from "../features/profile/useProfile";
import ProfileHeader from "../features/profile/ProfileHeader";
import ProfileStats from "../features/profile/ProfileStats";
import {
  ProfileSkeleton,
  ProfileError,
} from "../features/profile/ProfileStatus";

function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  // ganti baris destrukturisasi hook:
  const {
    data: profile,
    loading,
    error,
    refetch,
    patchProfile,
  } = useProfile(username);

  /*
   * Judul tab browser, dipulihkan saat halaman ditutup
   */
  useEffect(() => {
    if (!profile) return;

    const previousTitle = document.title;
    document.title = `${profile.displayName} (@${profile.username}) - AniSphere`;

    return () => {
      document.title = previousTitle;
    };
  }, [profile]);

  let content;

  if (loading) {
    content = <ProfileSkeleton />;
  } else if (error) {
    content = <ProfileError error={error} onRetry={refetch} />;
  } else {
    content = (
      <div className="space-y-6">
        <ProfileHeader profile={profile} onProfileChange={patchProfile} />
        {profile.stats ? (
          <ProfileStats stats={profile.stats} />
        ) : (
          <section
            aria-labelledby="profile-stats-heading"
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2
              id="profile-stats-heading"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              Statistik
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Profil ini privat. Statistik hanya terlihat oleh pemiliknya.
            </p>
          </section>
        )}
      </div>
    );
  }

  return <MainLayout username={user?.name}>{content}</MainLayout>;
}

export default Profile;
