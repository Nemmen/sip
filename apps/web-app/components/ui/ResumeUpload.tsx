'use client';

import { useState, useRef } from 'react';
import { Button } from './Button';
import { Alert } from './Alert';
import { LoadingSpinner } from './Loading';
import { storageApi } from '@/lib/api';

interface ResumeUploadProps {
  onUploadSuccess: (url: string) => void;
  currentResumeUrl?: string | null;
  disabled?: boolean;
}

export default function ResumeUpload({
  onUploadSuccess,
  currentResumeUrl,
  disabled = false,
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentResumeUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await storageApi.upload(file);
      const { url } = response.data;

      setUploadedFile(url);
      onUploadSuccess(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="resume-upload"
        />
        
        {!uploadedFile ? (
          <label htmlFor="resume-upload">
            <Button
              as="span"
              variant="outline"
              disabled={disabled || uploading}
              className="cursor-pointer"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Uploading...</span>
                </>
              ) : (
                '📎 Upload Resume'
              )}
            </Button>
          </label>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm font-medium text-green-900">Resume uploaded</span>
                </div>
                <Button
                  onClick={handleRemove}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
              <a
                href={uploadedFile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block mt-1"
              >
                View uploaded resume →
              </a>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Accepted formats: PDF, DOC, DOCX (Max 5MB)
      </p>

      {error && <Alert type="error">{error}</Alert>}
    </div>
  );
}
