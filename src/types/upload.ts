export interface ImageUploadOptions {
  folder?: string;
  tags?: string[];
  isPublic?: boolean;
  transformation?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
}

export interface ImageUploadResult {
  url: string;
  fileId: string;
  thumbnailUrl: string;
  filePath: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  id: string;
  url: string;
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}
