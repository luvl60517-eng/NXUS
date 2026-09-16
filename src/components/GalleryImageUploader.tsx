import React, { useState, useRef } from 'react';
import { processImageFile } from '../services/imageHelper';
import { Upload, Image as ImageIcon, Trash2, Check, RefreshCw } from 'lucide-react';

interface GalleryImageUploaderProps {
  label?: string;
  sublabel?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  aspect?: 'square' | 'banner';
  presets?: string[];
  placeholderIcon?: React.ReactNode;
}

export const GalleryImageUploader: React.FC<GalleryImageUploaderProps> = ({
  label = 'Imagen de perfil / Galería',
  sublabel = 'Sube una foto desde tu galería o dispositivo',
  value,
  onChange,
  aspect = 'square',
  presets = [],
  placeholderIcon,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const dataUrl = await processImageFile(file, aspect === 'banner' ? 900 : 512);
      onChange(dataUrl);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Error al procesar la imagen de la galería.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const triggerGalleryPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Label & header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-zinc-500">{sublabel}</p>}
        </div>

        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-[11px] text-purple-400 hover:text-purple-300 transition underline underline-offset-2"
          >
            {showPresets ? 'Ocultar sugerencias' : 'Ver sugerencias'}
          </button>
        )}
      </div>

      {/* Hidden native file input targeting device gallery & camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Main Upload / Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerGalleryPicker}
        className={`relative rounded-2xl border-2 border-dashed p-4 transition cursor-pointer flex items-center gap-4 ${
          isDragging
            ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30'
            : value
            ? 'border-zinc-700/80 bg-[#121622] hover:border-purple-400/80'
            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900'
        }`}
      >
        {/* Preview or Icon Placeholder */}
        <div className="shrink-0 relative">
          {value ? (
            <div
              className={`relative overflow-hidden border-2 border-purple-500/70 shadow-md ${
                aspect === 'square' ? 'w-16 h-16 rounded-2xl' : 'w-24 h-16 rounded-xl'
              }`}
            >
              <img
                src={value}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center justify-center bg-zinc-800/80 border border-zinc-700 text-zinc-400 ${
                aspect === 'square' ? 'w-16 h-16 rounded-2xl' : 'w-24 h-16 rounded-xl'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              ) : (
                placeholderIcon || <ImageIcon className="w-7 h-7" />
              )}
            </div>
          )}
        </div>

        {/* Text and Actions */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerGalleryPicker();
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{value ? 'Cambiar desde Galería' : 'Elegir de la Galería'}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/40 transition"
                title="Quitar imagen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 truncate">
            {isDragging
              ? '¡Suelta la imagen para cargarla!'
              : 'Toca para abrir tu galería o arrastra un archivo'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-rose-400 mt-1">{errorMessage}</p>
      )}

      {/* Preset suggestions list if toggled */}
      {showPresets && presets.length > 0 && (
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2 animate-in fade-in duration-200">
          <span className="text-[11px] font-semibold text-zinc-400 block">
            O selecciona una imagen prediseñada:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(preset)}
                className={`relative overflow-hidden rounded-xl border-2 transition ${
                  value === preset
                    ? 'border-purple-400 ring-2 ring-purple-400/40 scale-105'
                    : 'border-zinc-700 opacity-60 hover:opacity-100'
                } ${aspect === 'square' ? 'w-10 h-10' : 'w-16 h-10'}`}
              >
                <img src={preset} alt="" className="w-full h-full object-cover" />
                {value === preset && (
                  <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
