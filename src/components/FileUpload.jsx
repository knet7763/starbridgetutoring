import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const FileUpload = ({
    onUploadComplete,
    accept = 'image/*',
    bucket = 'tutor-images',
    label = 'Upload File',
    currentFileUrl = null
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(currentFileUrl);
    const [isDragging, setIsDragging] = useState(false);

    const uploadFile = async (file) => {
        if (!file) return;

        setUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);
            setUploadProgress(100);

            // Notify parent component
            if (onUploadComplete) {
                onUploadComplete(publicUrl);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const removeFile = () => {
        setPreviewUrl(null);
        if (onUploadComplete) {
            onUploadComplete(null);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            {!previewUrl ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                        ? 'border-primary bg-yellow-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                        id={`file-upload-${bucket}`}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="space-y-2">
                            <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                        </div>
                    ) : (
                        <label
                            htmlFor={`file-upload-${bucket}`}
                            className="cursor-pointer"
                        >
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {accept === 'image/*' ? 'PNG, JPG, GIF up to 10MB' : 'PDF, PPT, DOCX up to 50MB'}
                            </p>
                        </label>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center justify-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            {accept === 'image/*' ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-16 w-16 object-cover rounded"
                                />
                            ) : (
                                <div className="h-16 w-16 bg-yellow-100 rounded flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    File uploaded successfully
                                </p>
                                <p className="text-xs text-gray-500 truncate">{previewUrl}</p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        </div>
                        <button
                            onClick={removeFile}
                            className="ml-2 p-1 hover:bg-gray-200 rounded"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
