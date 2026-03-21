import React from 'react';
import { ImageIcon } from 'lucide-react';
import FileUpload from '../FileUpload';

const ImageSlideEditor = ({ slide, updateSlideContent }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-green-50 p-8 overflow-y-auto">
            <ImageIcon size={56} className="text-green-400 mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Image Slide</h2>
            <div className="w-full max-w-xl space-y-6">
                <FileUpload
                    label="Slide Image"
                    accept="image/*"
                    bucket="lesson-images"
                    currentFileUrl={slide.content?.url || null}
                    onUploadComplete={(url) => {
                        updateSlideContent({ url: url || '' });
                    }}
                />
                {slide.content?.url && (
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img
                            src={slide.content.url}
                            alt="Preview"
                            className="w-full max-h-64 object-contain bg-gray-900"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Caption (optional)</label>
                    <input
                        type="text"
                        value={slide.content?.caption || ''}
                        onChange={(e) => updateSlideContent({ caption: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 outline-none text-base bg-white mb-8"
                        placeholder="e.g., The water cycle diagram"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageSlideEditor;
