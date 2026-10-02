import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  Camera,
  Check
} from 'lucide-react';

// Preset sample craft photos for instant seller selection
const CRAFT_PRESETS = [
  {
    label: 'Terracotta Kulhad',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    category: 'Handicrafts',
  },
  {
    label: 'Blue Pottery Vase',
    url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
    category: 'Pottery',
  },
  {
    label: 'Handloom Textile',
    url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80',
    category: 'Textiles',
  },
  {
    label: 'Brass Diya Lamp',
    url: 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&w=600&q=80',
    category: 'Handicrafts',
  },
  {
    label: 'Artisan Spices',
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    category: 'Food',
  },
  {
    label: 'Handmade Jewelry',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    category: 'Jewelry',
  },
];

export default function ProductImageUploader({ value, onChange }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Resize and compress client-side via canvas
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality compressed JPEG Data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setIsProcessing(false);
        onChange(compressedDataUrl);
      };
      img.onerror = () => {
        setIsProcessing(false);
        setError('Failed to process the image file.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-indigo flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-clay" /> Product Picture / Image
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] text-saffron hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" /> Remove Picture
          </button>
        )}
      </div>

      {/* When Image is Present: Preview Box */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-clay/30 bg-warmwhite p-2 flex items-center gap-4 shadow-warm-sm">
          <div className="w-24 h-24 rounded-xl overflow-hidden border border-clay/20 bg-ivory shrink-0 relative">
            <img
              src={value}
              alt="Product Preview"
              className="w-full h-full object-cover"
              onError={() => setError('Image failed to load. Please verify the link or file.')}
            />
          </div>

          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center gap-1 text-neem font-bold">
              <Check className="w-3.5 h-3.5" />
              <span>Picture Uploaded Successfully</span>
            </div>
            <p className="text-[11px] text-indigo/60">
              This photo will be displayed on your store shelf, Mohalla Bazaar search, and buyer order tracking.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-clay font-bold hover:underline inline-block mt-1 cursor-pointer"
            >
              Change Photo
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-full bg-saffron/10 text-saffron hover:bg-saffron hover:text-white transition-colors cursor-pointer mr-2"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* When No Image: Tabbed Upload Experience */
        <div className="rounded-2xl border border-clay/25 bg-ivory/60 p-3.5 space-y-3">
          {/* Sub-tabs: Device Upload | Preset Crafts | Web URL */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-clay/15 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-clay text-warmwhite shadow-sm'
                  : 'text-indigo/70 hover:text-indigo'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-clay text-warmwhite shadow-sm'
                  : 'text-indigo/70 hover:text-indigo'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Artisan Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-clay text-warmwhite shadow-sm'
                  : 'text-indigo/70 hover:text-indigo'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Web URL</span>
            </button>
          </div>

          {/* Tab 1: Device File Upload Dropzone */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-clay/30 hover:border-clay rounded-xl p-5 text-center bg-white/70 hover:bg-white transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-clay/10 text-clay group-hover:scale-110 transition-transform flex items-center justify-center mx-auto">
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-clay border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-indigo">
                  {isProcessing ? 'Optimizing photo...' : 'Click or Drag photo here'}
                </p>
                <p className="text-[10px] text-indigo/60 mt-0.5">
                  Supports JPG, PNG, WebP from phone camera or gallery (auto-optimized)
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Curated Indian Craft Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-[11px] text-indigo/70">
                Quickly pick a high-quality sample artisan craft photo for your listing demo:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CRAFT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className="group relative rounded-xl overflow-hidden border border-clay/20 hover:border-clay aspect-square bg-warmwhite transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                      <span className="text-[9px] text-white font-semibold truncate leading-tight">
                        {preset.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Direct Web Image URL */}
          {activeTab === 'url' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-clay/25 bg-white text-indigo focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-2 bg-clay text-warmwhite text-xs font-bold rounded-xl hover:bg-clay/90 cursor-pointer shadow-sm"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-[11px] text-saffron font-medium">{error}</p>
      )}
    </div>
  );
}
