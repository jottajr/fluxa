"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingPreferences } from "@/types";

interface OnboardingContextValue {
  preferences: OnboardingPreferences | null;
  savePreferences: (prefs: OnboardingPreferences) => Promise<boolean>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: OnboardingPreferences | null;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);

  async function savePreferences(prefs: OnboardingPreferences) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("accounts")
      .update({ onboarding_preferences: prefs })
      .eq("id", user.id);

    if (error) return false;
    setPreferences(prefs);
    return true;
  }

  return (
    <OnboardingContext.Provider value={{ preferences, savePreferences }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding deve ser usado dentro de OnboardingProvider");
  }
  return ctx;
}
