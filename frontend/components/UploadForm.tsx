// frontend/components/UploadForm.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { useExpenseStore } from "@/store/useExpenseStore";
import { UploadResponse } from "@/types/expense";

export default function UploadForm({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { addExpense, setLoading, setError } = useExpenseStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", userId);

      const response = await axios.post<UploadResponse>(
        "http://localhost:5000/api/upload", 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        addExpense(response.data.data);
        setUploadSuccess(true);
        setFile(null);
        // Reset form
        const form = e.target as HTMLFormElement;
        form.reset();
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(
        error.response?.data?.error || 
        error.message || 
        'Upload failed. Please check your connection and try again.'
      );
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            name="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            required
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="space-y-2">
              <div className="text-4xl text-gray-400">📁</div>
              <div>
                <span className="text-blue-600 font-medium hover:underline">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, PDF up to 5MB
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Display */}
        {file && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm text-gray-700">{file.name}</span>
              <span className="text-xs text-gray-500">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                const input = document.getElementById('file-input') as HTMLInputElement;
                if (input) input.value = '';
              }}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || uploading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            !file || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 active:scale-95'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing Receipt...</span>
            </div>
          ) : (
            <>🚀 Upload & Extract</>
          )}
        </button>
      </form>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span>Receipt uploaded and processed successfully!</span>
        </div>
      )}
    </div>
  );
}
