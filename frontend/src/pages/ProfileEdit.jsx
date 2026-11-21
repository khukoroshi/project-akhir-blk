import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/useAuth";
import useProfile from "../features/profile/useProfile";
import ProfileEditForm from "../features/profile/ProfileEditForm";
import {
  ProfileSkeleton,
  ProfileError,
} from "../features/profile/ProfileStatus";

function ProfileEdit() {
  const { user } = useAuth();
  const { data: profile, loading, error, refetch } = useProfile(user?.name);

  let content;

  if (loading) {
    content = <ProfileSkeleton />;
  } else if (error) {
    content = <ProfileError error={error} onRetry={refetch} />;
  } else {
    content = <ProfileEditForm profile={profile} />;
  }

  return <MainLayout username={user?.name}>{content}</MainLayout>;
}

export default ProfileEdit;
