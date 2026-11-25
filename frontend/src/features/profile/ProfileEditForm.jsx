import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { updateProfile } from "./profileApi";
import { toActionMessage } from "./profileErrors";

const DISPLAY_NAME_MAX = 100;
const BIO_MAX = 500;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function validate({ displayName, bio }) {
  const errors = {};

  if (displayName.trim().length > DISPLAY_NAME_MAX) {
    errors.displayName = `Nama tampilan maksimal ${DISPLAY_NAME_MAX} karakter.`;
  }

  if (bio.length > BIO_MAX) {
    errors.bio = `Bio maksimal ${BIO_MAX} karakter (sekarang ${bio.length}).`;
  }

  return errors;
}

function ProfileEditForm({ profile }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const clearFeedback = () => {
    setNotice("");
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (inFlight.current) return;

    clearFeedback();

    const found = validate({ displayName, bio });
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    inFlight.current = true;
    setSaving(true);

    try {
      const updated = await updateProfile({
        displayName: displayName.trim() === "" ? null : displayName.trim(),
        bio: bio.trim() === "" ? null : bio.trim(),
        isPrivate,
      });

      setDisplayName(updated.displayName);
      setBio(updated.bio ?? "");
      setIsPrivate(updated.isPrivate);
      setNotice("Profil berhasil disimpan.");
    } catch (error) {
      setServerError(toActionMessage(error) ?? "");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const bioTooLong = bio.length > BIO_MAX;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Edit profil
      </h1>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {serverError}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
        >
          {notice}{" "}
          <Link
            to={`/u/${encodeURIComponent(profile.username)}`}
            className="font-medium underline"
          >
            Lihat profil
          </Link>
        </div>
      )}

      <fieldset disabled={saving} className="space-y-6">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Nama tampilan
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              clearFeedback();
            }}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby="displayName-hint"
            className={inputClass}
          />
          <p
            id="displayName-hint"
            className={`mt-1 text-sm ${
              errors.displayName
                ? "text-red-700 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {errors.displayName ??
              "Kosongkan untuk memakai username (@" + profile.username + ")."}
          </p>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
              clearFeedback();
            }}
            aria-invalid={Boolean(errors.bio) || bioTooLong}
            aria-describedby="bio-counter bio-error"
            className={inputClass}
          />
          <div className="mt-1 flex items-start justify-between gap-4 text-sm">
            <p
              id="bio-error"
              className="text-red-700 dark:text-red-400"
              role={errors.bio ? "alert" : undefined}
            >
              {errors.bio}
            </p>
            <p
              id="bio-counter"
              className={`ml-auto shrink-0 ${
                bioTooLong
                  ? "font-medium text-red-700 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {bio.length}/{BIO_MAX}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              id="private-label"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Profil privat
            </p>
            <p
              id="private-desc"
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              Statistik tontonanmu disembunyikan dari orang lain. Orang lain
              tetap bisa mengikutimu tanpa persetujuan.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            aria-labelledby="private-label"
            aria-describedby="private-desc"
            onClick={() => {
              setIsPrivate((prev) => !prev);
              clearFeedback();
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
              isPrivate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                isPrivate ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Avatar and banner
          </p>
          <p className="text-sm italic text-slate-500 dark:text-slate-400">
            Coming soon.
          </p>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Storing..." : "Store"}
        </button>

        <Link
          to={`/u/${encodeURIComponent(profile.username)}`}
          className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-400"
        >
          Back to profile
        </Link>
      </div>
    </form>
  );
}

export default ProfileEditForm;
