import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthForm } from "./AuthForm";

/**
 * Sign in / create account in one card. Used on the landing page and on the
 * standalone /login and /signup routes (which only differ in the default tab).
 */
export function AuthCard({
  defaultTab,
  next,
  googleEnabled,
  initialError,
}: {
  defaultTab: "signin" | "signup";
  next?: string;
  googleEnabled: boolean;
  initialError?: string;
}) {
  return (
    <Card className="w-full max-w-md border-border/80 shadow-[0_20px_60px_-24px_rgba(13,38,99,0.35)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Get into ZDocs</CardTitle>
        <CardDescription>Sign in or create an account to start writing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="signin">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup">
              Create account
            </TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <AuthForm mode="signin" next={next} googleEnabled={googleEnabled} initialError={initialError} showLinks={false} />
          </TabsContent>
          <TabsContent value="signup">
            <AuthForm mode="signup" next={next} googleEnabled={googleEnabled} showLinks={false} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
