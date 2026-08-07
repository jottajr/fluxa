import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FinanceDataProvider } from "@/lib/finance-data-context";
import { UserProvider } from "@/lib/user-context";
import { ProfileProvider } from "@/lib/profile-context";
import { FeedbackProvider } from "@/lib/feedback-context";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingPreferences } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Jotta";
  const userEmail = user?.email ?? "jotta@exemplo.com";

  let onboardingPreferences: OnboardingPreferences | null = null;
  if (user) {
    const { data: account } = await supabase
      .from("accounts")
      .select("onboarding_preferences")
      .eq("id", user.id)
      .single();
    onboardingPreferences =
      (account?.onboarding_preferences as OnboardingPreferences | null) ?? null;

    if (!onboardingPreferences) {
      redirect("/onboarding");
    }
  }

  return (
    <UserProvider userName={userName} userEmail={userEmail}>
      <FeedbackProvider>
        <ProfileProvider>
          <OnboardingProvider initialPreferences={onboardingPreferences}>
            <FinanceDataProvider>
              <AppShell userName={userName} userEmail={userEmail}>
                {children}
              </AppShell>
            </FinanceDataProvider>
          </OnboardingProvider>
        </ProfileProvider>
      </FeedbackProvider>
    </UserProvider>
  );
}
