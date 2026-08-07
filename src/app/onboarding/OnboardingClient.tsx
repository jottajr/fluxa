"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import type { OnboardingPreferences } from "@/types";

export function OnboardingClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete(prefs: OnboardingPreferences) {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update({ onboarding_preferences: prefs })
      .eq("id", user.id);

    if (updateError) {
      setSaving(false);
      setError("Não foi possível salvar suas respostas. Tente novamente.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <OnboardingWizard onComplete={handleComplete} saving={saving} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
