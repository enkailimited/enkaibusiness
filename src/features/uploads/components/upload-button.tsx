"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../constants";

interface UploadButtonProps {
  businessId?: string; // kept for future use with uploads API
  uploadedById?: string; // kept for future use with uploads API
  folder?: string;
  onUploadComplete?: (result: { fileId: string; fileUrl: string; fileName: string; thumbnailUrl?: string }) => void;
  onError?: (error: string) => void;
}

export function UploadButton({
  businessId,
  uploadedById,
  folder,
  onUploadComplete,
  onError,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        onError?.("File type not supported");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        onError?.("File size exceeds 10MB limit");
        return;
      }

      setUploading(true);

      try {
         const formData = new FormData();
         formData.append("file", file);
         if (folder) formData.append("folder", folder);

         const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }
         const raw = await response.json();
         const normalized = {
           fileId: raw.fileId ?? raw.id ?? crypto.randomUUID(),
           fileUrl: raw.fileUrl ?? raw.url,
           fileName: raw.fileName ?? raw.name ?? file.name,
           thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnailUrl ?? undefined,
         };
         onUploadComplete?.(normalized);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [businessId, uploadedById, folder, onUploadComplete, onError],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button type="button" onClick={handleClick} disabled={uploading}>
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </>
  );
}
