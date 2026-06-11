"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { UserProfile, UpdateProfileInput } from "@/features/users/types";
import { updateProfileSchema, type UpdateProfileSchema } from "@/features/users/schemas";
import { updateProfileAction } from "@/features/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError, FormSuccess } from "@/components/ui/form";
import { UploadButton } from "@/features/uploads/components/upload-button";
import { UserAvatar } from "@/features/users/components/user-avatar";

interface UserProfileProps {
  user: UserProfile;
  avatarBusinessId?: string;
}

export function UserProfile({ user, avatarBusinessId }: UserProfileProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
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
          if (msgs) {
            setError(field as keyof UpdateProfileSchema, { message: msgs[0] });
          }
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
            if (msgs) {
              setError(field as keyof UpdateProfileSchema, { message: msgs[0] });
            }
          }
        }
      } else {
        setFormSuccess("Profile updated successfully");
      }
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));
  async function handleAvatarUploaded(result: { fileId: string; fileUrl: string; fileName: string }) {
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await updateProfileAction(user.id, { avatarUrl: result.fileUrl } as UpdateProfileInput);
      if (!res.success) {
        setFormError(res.message);
      } else {
        setValue("avatarUrl", result.fileUrl);
        setAvatarUrl(result.fileUrl);
        setFormSuccess("Profile photo updated");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update profile photo");
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatarUrl={avatarUrl}
            className="h-12 w-12"
          />
          <div className="space-y-1">
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Profile photo</p>
            <UploadButton
              businessId={avatarBusinessId}
              uploadedById={user.id}
              folder="avatars"
              onUploadComplete={handleAvatarUploaded}
              onError={(err) => setFormError(err)}
            />
          </div>
          <FormField label="First Name" error={errors.firstName} required>
            <Input {...register("firstName")} />
          </FormField>
          <FormField label="Last Name" error={errors.lastName} required>
            <Input {...register("lastName")} />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input type="tel" {...register("phone")} />
          </FormField>
          <FormField label="Username" error={errors.username}>
            <Input {...register("username")} />
          </FormField>
          {/* Avatar URL is managed in the background and hidden from the user */}
          <input type="hidden" {...register("avatarUrl")} />
          <FormError message={formError} />
          <FormSuccess message={formSuccess} />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
