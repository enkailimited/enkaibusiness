"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ImageUploadOptions, UploadProgress, UploadedFile } from "@/types/upload";

interface ImageUploaderProps {
  onUpload: (files: UploadedFile[]) => void;
  options?: ImageUploadOptions;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  existingImages?: UploadedFile[];
  disabled?: boolean;
}

export function ImageUploader({
  onUpload,
  options,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  className,
  existingImages = [],
  disabled = false,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || uploading) return;

      const remaining = maxFiles - files.length;
      const filesToUpload = acceptedFiles.slice(0, remaining);

      if (filesToUpload.length === 0) return;

      setUploading(true);

      try {
        const uploadedFiles: UploadedFile[] = [];

        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i]!;
          const formData = new FormData();
          formData.append("file", file);

          if (options?.folder) {
            formData.append("folder", options.folder);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();

          const uploadedFile: UploadedFile = {
            id: result.fileId || crypto.randomUUID(),
            url: result.url,
            fileId: result.fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            createdAt: new Date().toISOString(),
          };

          uploadedFiles.push(uploadedFile);

          const progress: UploadProgress = {
            loaded: i + 1,
            total: filesToUpload.length,
            percentage: Math.round(((i + 1) / filesToUpload.length) * 100),
          };
          setUploadProgress(progress);
          options?.onProgress?.(progress);
        }

        const newFiles = [...files, ...uploadedFiles];
        setFiles(newFiles);
        onUpload(uploadedFiles);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
        setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      }
    },
    [files, maxFiles, disabled, uploading, options, onUpload],
  );

  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>,
    ),
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: disabled || uploading || files.length >= maxFiles,
    multiple: maxFiles > 1,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || uploading || files.length >= maxFiles) && "cursor-not-allowed opacity-50",
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Uploading {uploadProgress.loaded} of {uploadProgress.total}...
            </p>
            <Progress value={uploadProgress.percentage} className="w-full max-w-xs" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              {isDragActive ? (
                <ImageIcon className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.map((t) => t.split("/")[1]).join(", ")} up to{" "}
              {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file) => (
            <div
              key={file.fileId}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              {file.mimeType.startsWith("image/") ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(file.fileId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
