'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function FileUpload({ value, onChange, maxFiles = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      throw err;
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxFiles - value.length;

    if (remaining <= 0) {
      setError(`Maximum of ${maxFiles} files allowed`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    setUploading(true);
    setError(null);
    setProgress(0);

    const newUrls: string[] = [];
    for (let i = 0; i < toUpload.length; i++) {
      try {
        const url = await uploadFile(toUpload[i]);
        if (url) newUrls.push(url);
        setProgress(Math.round(((i + 1) / toUpload.length) * 100));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }

    setUploading(false);
    setProgress(0);
  }, [value, maxFiles, onChange, uploadFile]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset so the same file can be selected again
    e.target.value = '';
  }

  function removeFile(index: number) {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  }

  const canUploadMore = value.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      {canUploadMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          className={`w-full flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/40 hover:border-primary/40 hover:bg-primary/[0.02]'
          }`}
        >
          <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
            cloud_upload
          </span>
          <span className="text-sm font-medium text-on-surface-variant">
            {uploading ? 'Uploading...' : 'Click or drop images here'}
          </span>
          <span className="text-xs text-outline">
            JPG, PNG, GIF, WebP (max 5MB each)
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-tertiary">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div
              key={url}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-low"
            >
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File count hint */}
      {value.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          {value.length}/{maxFiles} files uploaded
        </p>
      )}
    </div>
  );
}
