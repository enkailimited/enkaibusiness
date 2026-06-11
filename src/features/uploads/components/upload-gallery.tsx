"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, truncate } from "@/lib/utils";
import { FOLDER_LABELS } from "../constants";
import type { UploadWithUser } from "../types";

interface UploadGalleryProps {
  businessId: string;
  folder?: string;
  onSelect?: (upload: UploadWithUser) => void;
}

export function UploadGallery({ businessId, folder, onSelect }: UploadGalleryProps) {
  const [uploads, setUploads] = useState<UploadWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ businessId });
    if (folder) params.set("folder", folder);

    fetch(`/api/uploads?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setUploads(data.uploads ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId, folder]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No images found</p>
        <p className="text-sm">Upload images to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {uploads
        .filter((u) => u.mimeType.startsWith("image/"))
        .map((upload) => (
          <button
            key={upload.id}
            type="button"
            onClick={() => onSelect?.(upload)}
            className="group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all text-left"
          >
            <img
              src={upload.thumbnailUrl ?? upload.fileUrl}
              alt={upload.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white font-medium truncate">
                {truncate(upload.fileName, 24)}
              </p>
              <p className="text-xs text-white/70">
                {upload.folder ? FOLDER_LABELS[upload.folder] ?? upload.folder : "General"}
              </p>
            </div>
          </button>
        ))}
    </div>
  );
}
