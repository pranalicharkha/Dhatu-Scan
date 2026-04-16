import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/lib/api";
import { getCurrentUserToken, getCurrentUserEmail } from "@/data/userRepository";
import type { ChildProfile, Gender } from "@/types";
import { formatAgeFromMonths, calculateAgeInMonths } from "@/utils/childAge";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";


type ChildFormState = {
  name: string;
  dateOfBirth: string;
  gender: Gender;
};

const INITIAL_FORM: ChildFormState = {
  name: "",
  dateOfBirth: "",
  gender: "male",
};

async function getToken(): Promise<string | null> {
  return getCurrentUserToken();
}

async function getUserEmail(): Promise<string> {
  return (await getCurrentUserEmail()) ?? "";
}

export default function ChildProfilesPage() {
  const {
    state,
    activeChild,
    addChild,
    updateChild,
    replaceChildId,
    removeChild,
    setActiveChild,
  } = useApp();
  const [form, setForm] = useState<ChildFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ChildFormState, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiMsg, setApiMsg] = useState("");
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChildFormState>(INITIAL_FORM);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const PALETTE = isDark ? {
    page: "transparent",
    soft: "rgba(29, 36, 48, 0.4)",
    border: "rgba(124, 107, 192, 0.22)",
    ink: "#F3F2FB",
    muted: "#B8B2C9",
    accent: "#B39BFF",
    blue: "rgba(179,155,255,0.18)",
    white: "rgba(35, 44, 58, 0.82)",
    red: "#ef4444",
  } : {
    page: "transparent",
    soft: "rgba(255, 250, 245, 0.4)",
    border: "rgba(156, 143, 203, 0.18)",
    ink: "#403552",
    muted: "#6D6578",
    accent: "#9C8FCB",
    blue: "#B5D1DA",
    white: "#FFFAF5",
    red: "#e05c5c",
  };

  const sortedChildren = useMemo(
    () =>
      [...state.children].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [state.children],
  );

  function update<K extends keyof ChildFormState>(
    key: K,
    value: ChildFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function updateEdit<K extends keyof ChildFormState>(
    key: K,
    value: ChildFormState[K],
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(nextForm: ChildFormState) {
    const nextErrors: Partial<Record<keyof ChildFormState, string>> = {};

    if (!nextForm.name.trim()) nextErrors.name = "Child name is required";

    if (!nextForm.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required";
    } else if (calculateAgeInMonths(nextForm.dateOfBirth) > 120) {
      nextErrors.dateOfBirth =
        "This profile flow is for children up to 10 years";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleAddChild() {
    if (!validate(form)) return;

    setIsLoading(true);
    setApiMsg("");

    const now = new Date().toISOString();
    const localProfile: ChildProfile = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth,
      age: calculateAgeInMonths(form.dateOfBirth),
      gender: form.gender,
      height: 0,
      weight: 0,
      createdAt: now,
      updatedAt: now,
    };

    addChild(localProfile);
    const parentEmail = await getUserEmail();

    try {
      const token = await getToken();
      if (token) {
        const resp = await fetch(`${API_BASE}/children`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            childName: localProfile.name,
            dob: localProfile.dateOfBirth,
            gender: localProfile.gender,
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (resp.ok) {
          const cloudChild = await resp.json();
          const syncedProfile: ChildProfile = {
            ...localProfile,
            id: cloudChild.childId,
            name: cloudChild.childName,
            dateOfBirth: cloudChild.dob,
            gender: cloudChild.gender,
            age: calculateAgeInMonths(cloudChild.dob),
            updatedAt: new Date().toISOString(),
          };

          replaceChildId(localProfile.id, syncedProfile);
          setActiveChild(syncedProfile.id);
          setApiMsg("Child saved to cloud and local device.");
        } else {
          setApiMsg("Saved locally only. Cloud sync will retry later.");
        }
      } else {
        setApiMsg("Saved locally only. Login to sync to cloud.");
      }
    } catch {
      setApiMsg("Saved locally only. Cloud sync will happen when online.");
    } finally {
      setForm(INITIAL_FORM);
      setIsLoading(false);
    }
  }

  function startEditing(child: ChildProfile) {
    setEditingChildId(child.id);
    setEditForm({
      name: child.name,
      dateOfBirth: child.dateOfBirth ?? "",
      gender: child.gender,
    });
  }

  async function handleSaveEdit(child: ChildProfile) {
    if (!editForm.name.trim()) return;

    setIsLoading(true);

    const now = new Date().toISOString();
    updateChild({
      ...child,
      name: editForm.name,
      dateOfBirth: editForm.dateOfBirth,
      gender: editForm.gender,
      updatedAt: now,
    });

    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_BASE}/children/${child.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            childName: editForm.name,
            dob: editForm.dateOfBirth,
            gender: editForm.gender,
          }),
          signal: AbortSignal.timeout(4000),
        });
      }
    } catch {
      // Keep the local edit and let a later sync reconcile it.
    } finally {
      setEditingChildId(null);
      setIsLoading(false);
    }
  }

  async function handleDeleteChild(child: ChildProfile) {
    if (!window.confirm(`Delete profile for ${child.name}? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    removeChild(child.id);

    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_BASE}/children/${child.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(4000),
        });
      }
    } catch {
      // The local delete already succeeded.
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-10"
      style={{ backgroundColor: PALETTE.page }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr] lg:items-start">
          <GlassCard
            variant="elevated"
            className="rounded-[2rem] p-8 lg:sticky lg:top-8"
          >
            <div>
              <p
                className="text-sm uppercase tracking-[0.22em]"
                style={{ color: PALETTE.muted }}
              >
                Add Child
              </p>
              <h2
                className="mt-2 font-display text-3xl font-semibold"
                style={{ color: PALETTE.ink }}
              >
                New child profile
              </h2>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  Child Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Aarav"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: PALETTE.white,
                    color: PALETTE.ink,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  Date Of Birth
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: PALETTE.white,
                    color: PALETTE.ink,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as Gender[]).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => update("gender", gender)}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold capitalize transition-smooth"
                      style={
                        form.gender === gender
                          ? {
                              backgroundColor: PALETTE.accent,
                              color: PALETTE.white,
                            }
                          : {
                              backgroundColor: PALETTE.white,
                              color: PALETTE.ink,
                              border: `1px solid ${PALETTE.border}`,
                            }
                      }
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {apiMsg && (
                <p
                  className="text-xs font-medium"
                  style={{
                    color: apiMsg.startsWith("Child saved")
                      ? "#2e7d32"
                      : "#b45309",
                  }}
                >
                  {apiMsg}
                </p>
              )}

              <button
                type="button"
                onClick={handleAddChild}
                disabled={isLoading}
                className="w-full rounded-2xl px-5 py-3 font-semibold transition-smooth disabled:opacity-60"
                style={{ backgroundColor: PALETTE.ink, color: PALETTE.white }}
              >
                {isLoading ? "Saving..." : "Save Child Profile"}
              </button>
            </div>
          </GlassCard>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p
                  className="text-sm uppercase tracking-[0.22em]"
                  style={{ color: PALETTE.muted }}
                >
                  Saved Profiles
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-semibold"
                  style={{ color: PALETTE.ink }}
                >
                  Choose the child you want to screen
                </h2>
              </div>
              <div
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: PALETTE.white,
                  color: PALETTE.ink,
                }}
              >
                {sortedChildren.length} profiles
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {sortedChildren.map((child, index) => {
                const ageMonths = child.dateOfBirth
                  ? calculateAgeInMonths(child.dateOfBirth)
                  : child.age;
                const isActive = activeChild?.id === child.id;
                const isEditing = editingChildId === child.id;

                return (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <GlassCard variant="elevated" className="rounded-[2rem] p-6">
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <motion.div
                            key="edit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                          >
                            <p
                              className="text-sm font-semibold"
                              style={{ color: PALETTE.muted }}
                            >
                              Editing profile
                            </p>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => updateEdit("name", e.target.value)}
                              placeholder="Child name"
                              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                              style={{
                                backgroundColor: PALETTE.white,
                                color: PALETTE.ink,
                                border: `1px solid ${PALETTE.border}`,
                              }}
                            />
                            <input
                              type="date"
                              value={editForm.dateOfBirth}
                              onChange={(e) =>
                                updateEdit("dateOfBirth", e.target.value)
                              }
                              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                              style={{
                                backgroundColor: PALETTE.white,
                                color: PALETTE.ink,
                                border: `1px solid ${PALETTE.border}`,
                              }}
                            />
                            <div className="flex gap-2">
                              {(["male", "female"] as Gender[]).map((gender) => (
                                <button
                                  key={gender}
                                  type="button"
                                  onClick={() => updateEdit("gender", gender)}
                                  className="flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition-smooth"
                                  style={
                                    editForm.gender === gender
                                      ? {
                                          backgroundColor: PALETTE.accent,
                                          color: PALETTE.white,
                                        }
                                      : {
                                          backgroundColor: PALETTE.white,
                                          color: PALETTE.ink,
                                          border: `1px solid ${PALETTE.border}`,
                                        }
                                  }
                                >
                                  {gender}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(child)}
                                disabled={isLoading}
                                className="flex-1 rounded-full py-2 text-sm font-semibold transition-smooth disabled:opacity-60"
                                style={{
                                  backgroundColor: PALETTE.accent,
                                  color: PALETTE.white,
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingChildId(null)}
                                className="flex-1 rounded-full py-2 text-sm font-semibold transition-smooth"
                                style={{
                                  backgroundColor: PALETTE.white,
                                  color: PALETTE.ink,
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold"
                                  style={{
                                    backgroundColor: PALETTE.blue,
                                    color: PALETTE.ink,
                                  }}
                                >
                                  {child.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h3
                                    className="text-lg font-semibold"
                                    style={{ color: PALETTE.ink }}
                                  >
                                    {child.name}
                                  </h3>
                                  <p
                                    className="text-sm capitalize"
                                    style={{ color: PALETTE.muted }}
                                  >
                                    {child.gender}
                                  </p>
                                </div>
                              </div>
                              {isActive && (
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: PALETTE.accent,
                                    color: PALETTE.white,
                                  }}
                                >
                                  Active
                                </span>
                              )}
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <div
                                className="rounded-2xl p-3"
                                style={{
                                  background: PALETTE.soft,
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                <p
                                  className="text-xs uppercase tracking-[0.18em]"
                                  style={{ color: PALETTE.muted }}
                                >
                                  Age
                                </p>
                                <p
                                  className="mt-2 text-sm font-semibold"
                                  style={{ color: PALETTE.ink }}
                                >
                                  {formatAgeFromMonths(ageMonths)}
                                </p>
                              </div>
                              <div
                                className="rounded-2xl p-3"
                                style={{
                                  background: PALETTE.soft,
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                <p
                                  className="text-xs uppercase tracking-[0.18em]"
                                  style={{ color: PALETTE.muted }}
                                >
                                  Date Of Birth
                                </p>
                                <p
                                  className="mt-2 text-sm font-semibold"
                                  style={{ color: PALETTE.ink }}
                                >
                                  {child.dateOfBirth ?? "Not set"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveChild(child.id)}
                                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-smooth"
                                style={
                                  isActive
                                    ? {
                                        backgroundColor: PALETTE.white,
                                        color: PALETTE.ink,
                                        border: `1px solid ${PALETTE.border}`,
                                      }
                                    : {
                                        backgroundColor: PALETTE.accent,
                                        color: PALETTE.white,
                                      }
                                }
                              >
                                {isActive ? "Selected" : "Select"}
                              </button>
                              <Link
                                to="/form"
                                onClick={() => setActiveChild(child.id)}
                                className="rounded-full px-4 py-2.5 text-sm font-semibold transition-smooth"
                                style={{
                                  backgroundColor: PALETTE.white,
                                  color: PALETTE.ink,
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                Screen
                              </Link>
                              <button
                                type="button"
                                onClick={() => startEditing(child)}
                                className="rounded-full px-3 py-2.5 text-sm font-semibold transition-smooth"
                                style={{
                                  backgroundColor: PALETTE.white,
                                  color: PALETTE.ink,
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChild(child)}
                                className="rounded-full px-3 py-2.5 text-sm font-semibold transition-smooth"
                                style={{
                                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fde8e8",
                                  color: PALETTE.red,
                                  border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #f5c2c2",
                                }}
                                title="Delete"
                              >
                                Delete
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
