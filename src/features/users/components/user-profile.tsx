"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2, User, Phone, AtSign, Camera, Key, Lock,
  ShieldCheck, CheckCircle,
} from "lucide-react";
import type { UserProfile, UpdateProfileInput } from "@/features/users/types";
import { updateProfileSchema, type UpdateProfileSchema } from "@/features/users/schemas";
import { updateProfileAction } from "@/features/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormError, FormSuccess } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { UploadButton } from "@/features/uploads/components/upload-button";
import { changePasswordAction } from "@/app/change-password/actions";

interface UserProfileProps {
  user: UserProfile;
  avatarBusinessId?: string;
  roles?: { id: string; name: string; slug: string; scope: string }[];
}

export function UserProfile({ user, avatarBusinessId, roles = [] }: UserProfileProps) {
  const [tab, setTab] = useState("profile");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [avatarHover, setAvatarHover] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileSchema>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      username: user.username ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileSchema) => {
      const parsed = updateProfileSchema.safeParse(data);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        for (const [field, msgs] of Object.entries(fieldErrors)) {
          if (msgs) setError(field as keyof UpdateProfileSchema, { message: msgs[0] });
        }
        throw new Error("Validation failed");
      }
      return updateProfileAction(user.id, parsed.data as UpdateProfileInput);
    },
    onSuccess: (result) => {
      setFormSuccess(null);
      setFormError(null);
      if (!result.success) {
        setFormError(result.message);
        if (result.errors) {
          for (const [field, msgs] of Object.entries(result.errors)) {
            if (msgs) setError(field as keyof UpdateProfileSchema, { message: msgs[0] });
          }
        }
      } else {
        setFormSuccess("Profile updated successfully");
        setTimeout(() => setFormSuccess(null), 3000);
      }
    },
    onError: (error) => setFormError(error.message),
  });

  // ─── Password change ───────────────────────────────────────────────────
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwPending, setPwPending] = useState(false);
  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwPending(true);
    setPwError(null);
    setPwSuccess(null);

    const fd = new FormData(e.currentTarget);
    const current = fd.get("currentPassword") as string;
    const newPw = fd.get("newPassword") as string;
    const confirm = fd.get("confirmPassword") as string;

    if (newPw !== confirm) {
      setPwError("New passwords do not match");
      setPwPending(false);
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      setPwPending(false);
      return;
    }

    const res = await changePasswordAction(current, newPw);
    if (res.success) {
      setPwSuccess("Password changed successfully");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setPwSuccess(null), 3000);
    } else {
      setPwError(res.message);
    }
    setPwPending(false);
  }

  // ─── Avatar upload handler ─────────────────────────────────────────────
  async function handleAvatarUploaded(result: { fileId: string; fileUrl: string }) {
    setFormError(null);
    setFormSuccess(null);
    const res = await updateProfileAction(user.id, { avatarUrl: result.fileUrl } as UpdateProfileInput);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setValue("avatarUrl", result.fileUrl);
      setAvatarUrl(result.fileUrl);
      setFormSuccess("Profile photo updated");
      setTimeout(() => setFormSuccess(null), 3000);
    }
  }

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Profile Hero ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="h-32 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          <CardContent className="relative -mt-16 px-6 pb-6 pt-0">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div
                className="relative"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
              >
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  avatarUrl={avatarUrl}
                  className="h-28 w-28 rounded-xl border-4 border-background shadow-xl"
                />
                <AnimatePresence>
                  {avatarHover && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/50"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:mt-0">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  {roles.map((r) => (
                    <Badge key={r.id} variant="secondary" className="text-xs">
                      {r.name}
                    </Badge>
                  ))}
                  <Badge variant={user.isActive ? "success" : "destructive"} className="text-xs">
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1 gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {tab === "profile" && (
            <TabsContent value="profile" asChild forceMount>
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <form onSubmit={onSubmit} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="First Name" error={errors.firstName} required>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input {...register("firstName")} className="pl-9" />
                          </div>
                        </FormField>

                        <FormField label="Last Name" error={errors.lastName} required>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input {...register("lastName")} className="pl-9" />
                          </div>
                        </FormField>
                      </div>

                      <FormField label="Phone" error={errors.phone}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="tel" {...register("phone")} className="pl-9" />
                        </div>
                      </FormField>

                      <FormField label="Username" error={errors.username}>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input {...register("username")} className="pl-9" />
                        </div>
                      </FormField>

                      <input type="hidden" {...register("avatarUrl")} />

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Profile photo</p>
                        <div className="flex items-center gap-4">
                          <UserAvatar
                            firstName={user.firstName}
                            lastName={user.lastName}
                            avatarUrl={avatarUrl}
                            className="h-16 w-16 rounded-lg"
                          />
                          <div className="flex-1">
                            <UploadButton
                              businessId={avatarBusinessId}
                              uploadedById={user.id}
                              folder="avatars"
                              onUploadComplete={handleAvatarUploaded}
                              onError={(err) => setFormError(err)}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              JPG, PNG or WebP. Max 2MB.
                            </p>
                          </div>
                        </div>
                      </div>

                      <FormError message={formError ?? undefined} />
                      <FormSuccess message={formSuccess ?? undefined} />

                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="w-full gap-2"
                          disabled={mutation.isPending || !isDirty}
                          size="lg"
                        >
                          {mutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {mutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {tab === "security" && (
            <TabsContent value="security" asChild forceMount>
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Change Password</h3>
                          <p className="text-xs text-muted-foreground">
                            Update your password regularly to keep your account secure
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <FormField label="Current Password" required>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                          <PasswordInput
                            name="currentPassword"
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            className="pl-9 pr-10"
                            required
                          />
                        </div>
                      </FormField>

                      <FormField label="New Password" required>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                          <PasswordInput
                            name="newPassword"
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            className="pl-9"
                            required
                          />
                        </div>
                      </FormField>

                      <FormField label="Confirm New Password" required>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                          <PasswordInput
                            name="confirmPassword"
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            className="pl-9"
                            required
                          />
                        </div>
                      </FormField>

                      <FormError message={pwError ?? undefined} />
                      <FormSuccess message={pwSuccess ?? undefined} />

                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="w-full gap-2"
                          disabled={pwPending}
                          size="lg"
                        >
                          {pwPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          {pwPending ? "Updating..." : "Update Password"}
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
