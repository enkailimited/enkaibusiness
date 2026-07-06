"use client";

import { useState } from "react";
import { Image, X, Check } from "lucide-react";
import { UploadButton } from "@/features/uploads/components/upload-button";

interface IdentityUploadStepProps {
  uploadedDoc: { fileUrl: string; fileName: string; fileId: string } | null;
  onUploadComplete: (result: { fileUrl: string; fileName: string; fileId: string }) => void;
  onRemove: () => void;
}

const DOCUMENT_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voter_id", label: "Voter ID" },
  { value: "other", label: "Other" },
];

export function IdentityUploadStep({
  uploadedDoc,
  onUploadComplete,
  onRemove,
}: IdentityUploadStepProps) {
  const [docType, setDocType] = useState("national_id");

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Image className="h-4 w-4" />
        Identity Document
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Document Type <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-3 gap-2">
          {DOCUMENT_TYPES.map((dt) => {
            const isSelected = docType === dt.value;
            return (
              <button
                key={dt.value}
                type="button"
                onClick={() => setDocType(dt.value)}
                className={`relative flex items-center justify-center rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm text-primary"
                    : "border-muted bg-card hover:border-muted-foreground/30 text-muted-foreground"
                }`}
                data-selected={isSelected}
              >
                {dt.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="documentType" value={docType} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Upload ID Document <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Upload a clear photo or scan of your identity document (JPEG, PNG, PDF — max 10MB)
        </p>

        {uploadedDoc ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-700 truncate">{uploadedDoc.fileName}</p>
              <p className="text-xs text-emerald-500">Uploaded successfully</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-md hover:bg-emerald-100 text-emerald-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <input type="hidden" name="documentFileUrl" value={uploadedDoc.fileUrl} />
            <input type="hidden" name="documentFileName" value={uploadedDoc.fileName} />
            <input type="hidden" name="documentFileId" value={uploadedDoc.fileId} />
          </div>
        ) : (
          <UploadButton
            folder="identity-documents"
            onUploadComplete={(result) => {
              onUploadComplete({
                fileUrl: result.fileUrl,
                fileName: result.fileName,
                fileId: result.fileId,
              });
            }}
            onError={(err) => {
              alert(err);
            }}
          />
        )}
      </div>
    </div>
  );
}
