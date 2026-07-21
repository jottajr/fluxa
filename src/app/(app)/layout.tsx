import { AppShell } from "@/components/AppShell";
import { FinanceDataProvider } from "@/lib/finance-data-context";
import { UserProvider } from "@/lib/user-context";
import { ProfileProvider } from "@/lib/profile-context";
import { FeedbackProvider } from "@/lib/feedback-context";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <UserProvider userName={userName} userEmail={userEmail}>
      <FeedbackProvider>
        <ProfileProvider>
          <FinanceDataProvider>
            <AppShell userName={userName} userEmail={userEmail}>
              {children}
            </AppShell>
          </FinanceDataProvider>
        </ProfileProvider>
      </FeedbackProvider>
    </UserProvider>
  );
}
