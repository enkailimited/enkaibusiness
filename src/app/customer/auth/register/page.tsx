import { CustomerRegisterForm } from "@/features/customer/auth/components/register-form";

export default function CustomerRegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join and start exploring</p>
        </div>
        <CustomerRegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/customer/auth/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
