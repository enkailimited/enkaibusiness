"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CustomerLoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, null);

  if (state?.success) {
    router.push("/customer/dashboard");
  }

  return (
    <form action={action} className="space-y-4">
      {state?.message && !state?.success && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Phone</Label>
        <Input id="identifier" name="identifier" type="text" required placeholder="demo@enkaibusiness.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Sign In
      </Button>
    </form>
  );
}
