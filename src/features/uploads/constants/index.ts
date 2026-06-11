export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const DEFAULT_FOLDERS = [
  "general",
  "products",
  "receipts",
  "logos",
  "documents",
  "profiles",
] as const;

export const MIME_TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/gif": "GIF Image",
  "image/webp": "WebP Image",
  "image/svg+xml": "SVG Image",
  "application/pdf": "PDF Document",
  "text/csv": "CSV File",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  "application/vnd.ms-excel": "Excel Spreadsheet",
};

export const FOLDER_LABELS: Record<string, string> = {
  general: "General",
  products: "Products",
  receipts: "Receipts",
  logos: "Logos",
  documents: "Documents",
  profiles: "Profiles",
};

export const DEFAULT_UPLOAD_FOLDER = "general";
