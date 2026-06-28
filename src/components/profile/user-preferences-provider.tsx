"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyUserPreferences,
  createStableDefaultPreferences,
  loadUserPreferences,
  saveUserPreferences,
  USER_PREFERENCES_UPDATED_EVENT,
  type UserPreferences,
} from "@/lib/profile/preferences";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  isHydrated: boolean;
  setPreferences: (next: UserPreferences) => void;
  updatePreferences: (updater: (current: UserPreferences) => UserPreferences) => void;
  persistPreferences: (next: UserPreferences) => void;
  sidebarCollapsed: boolean;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(createStableDefaultPreferences);
  const [isHydrated, setIsHydrated] = useState(false);

  const persistPreferences = useCallback((next: UserPreferences) => {
    setPreferencesState(next);
    saveUserPreferences(next);
    applyUserPreferences(next);
  }, []);

  const setPreferences = useCallback(
    (next: UserPreferences) => {
      persistPreferences(next);
    },
    [persistPreferences],
  );

  const updatePreferences = useCallback((updater: (current: UserPreferences) => UserPreferences) => {
    setPreferencesState((current) => {
      const next = updater(current);
      saveUserPreferences(next);
      applyUserPreferences(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const loaded = loadUserPreferences();
    setPreferencesState(loaded);
    applyUserPreferences(loaded);
    setIsHydrated(true);

    function onPreferencesUpdated() {
      const next = loadUserPreferences();
      setPreferencesState(next);
      applyUserPreferences(next);
    }

    window.addEventListener(USER_PREFERENCES_UPDATED_EVENT, onPreferencesUpdated);
    return () => window.removeEventListener(USER_PREFERENCES_UPDATED_EVENT, onPreferencesUpdated);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      isHydrated,
      setPreferences,
      updatePreferences,
      persistPreferences,
      sidebarCollapsed: isHydrated ? preferences.appearance.sidebarCollapsed : false,
    }),
    [isHydrated, preferences, persistPreferences, setPreferences, updatePreferences],
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextValue {
  const context = useContext(UserPreferencesContext);

  if (!context) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider.");
  }

  return context;
}
