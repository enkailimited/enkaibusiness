import { requireAuth } from "@/server/auth";
import { getUploads } from "../services/upload-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { MIME_TYPE_LABELS, FOLDER_LABELS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { UploadWithUser } from "../types";
import type { UploadFilterSchema } from "../schemas";

interface UploadListProps {
  businessId: string;
  filter?: UploadFilterSchema;
}

export async function UploadList({ businessId, filter }: UploadListProps) {
  await requireAuth();

  const { uploads } = await getUploads(businessId, filter);

  const columns = [
    {
      key: "thumbnail",
      header: "",
      cell: (upload: UploadWithUser) => (
        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {upload.thumbnailUrl ? (
            <img
              src={upload.thumbnailUrl}
              alt={upload.fileName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
              {upload.mimeType.startsWith("image/") ? "IMG" : "DOC"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "fileName",
      header: "File Name",
      cell: (upload: UploadWithUser) => (
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[200px]">{upload.fileName}</span>
          <span className="text-xs text-muted-foreground">
            {upload.uploadedBy.firstName} {upload.uploadedBy.lastName}
          </span>
        </div>
      ),
    },
    {
      key: "mimeType",
      header: "Type",
      cell: (upload: UploadWithUser) => (
        <Badge variant="secondary" className="text-xs">
          {MIME_TYPE_LABELS[upload.mimeType] ?? upload.mimeType}
        </Badge>
      ),
    },
    {
      key: "size",
      header: "Size",
      cell: (upload: UploadWithUser) => {
        const sizeKB = upload.size / 1024;
        const sizeMB = sizeKB / 1024;
        return (
          <span className="font-mono text-sm">
            {sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`}
          </span>
        );
      },
    },
    {
      key: "folder",
      header: "Folder",
      cell: (upload: UploadWithUser) => (
        <Badge variant="outline" className="text-xs">
          {FOLDER_LABELS[upload.folder ?? ""] ?? upload.folder ?? "—"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (upload: UploadWithUser) => (
        <span className="text-sm text-muted-foreground">{formatDate(upload.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={uploads}
      emptyTitle="No uploads found"
      emptyDescription="Upload files to see them here."
    />
  );
}
