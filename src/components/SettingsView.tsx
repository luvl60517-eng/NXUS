import React from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { GalleryImageUploader } from './GalleryImageUploader';
import {
  User,
  Settings,
  Download,
  Upload,
  Trash2,
  Cpu,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  onRefreshAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateUserProfile,
  onRefreshAllData,
}) => {
  const [name, setName] = React.useState(userProfile.name);
  const [persona, setPersona] = React.useState(userProfile.persona);
  const [avatar, setAvatar] = React.useState(userProfile.avatar);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const [apiHealth, setApiHealth] = React.useState<{
    status: string;
    hasApiKey: boolean;
    model: string;
  } | null>(null);

  const [importJson, setImportJson] = React.useState('');
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSuccess, setImportSuccess] = React.useState(false);

  React.useEffect(() => {
    ApiService.checkHealth().then(setApiHealth);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      name: name.trim() || 'Aventurero',
      persona: persona.trim(),
      avatar: avatar.trim() || userProfile.avatar,
    };
    onUpdateUserProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(false);
    if (!importJson.trim()) return;

    const res = StorageService.importData(importJson);
    if (res.success) {
      setImportSuccess(true);
      setImportJson('');
      onRefreshAllData();
      setTimeout(() => setImportSuccess(false), 3000);
    } else {
      setImportError(res.error || 'Error al importar archivo JSON');
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas borrar todos los universos, personajes y chats? Esta acción no se puede deshacer.'
      )
    ) {
      StorageService.clearAllData();
      onRefreshAllData();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-3">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Ajustes de NEXUS & Perfil
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configura la identidad de tu avatar, gestión de copias de seguridad y estado de IA
        </p>
      </div>

      {/* User Persona & Identity */}
      <form onSubmit={handleSaveProfile} className="bg-[#121622] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <User className="w-4 h-4 text-purple-400" />
          <span>Tu Identidad en el Roleplay (Persona)</span>
        </div>
        <p className="text-xs text-zinc-400">
          Los personajes que crees en NEXUS utilizarán esta información para saber quién eres,
          cómo te ves y cómo tratarte en las conversaciones.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Tu Nombre / Alias
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Kael, Ren, Valery..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500"
            />
          </div>

          <GalleryImageUploader
            label="Tu Foto de Perfil"
            sublabel="Sube tu imagen desde tu galería o fotos del dispositivo"
            value={avatar}
            onChange={(val) => setAvatar(val)}
            aspect="square"
            placeholderIcon={<User className="w-8 h-8 text-purple-400" />}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Descripción de tu Persona / Apariencia / Rol
          </label>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={3}
            placeholder="Ej: Un viajero silencioso con una gabardina gastada que busca respuestas sobre el Cataclismo..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        <div className="flex justify-end items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Perfil guardado
            </span>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-purple-950"
          >
            Guardar Perfil
          </button>
        </div>
      </form>

      {/* AI Model & Backend Status */}
      <div className="bg-[#121622] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Motor Neuronal & Filosofía NEXUS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 block mb-1">Modelo Seleccionado</span>
            <span className="text-white font-mono font-semibold">Gemini 3.8 Flash</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              ● Procesamiento Full-Stack Servidor
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 block mb-1">Límites de Mensajes</span>
            <span className="text-white font-semibold">Ilimitados & Gratuitos</span>
            <span className="text-[10px] text-purple-400 block mt-0.5">
              Memoria contextual continua
            </span>
          </div>
        </div>

        <div className="bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl text-xs text-purple-200/90 space-y-1">
          <span className="font-semibold flex items-center gap-1.5 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" /> Libertad Narrativa de NEXUS
          </span>
          <p className="leading-relaxed text-[11px]">
            NEXUS está diseñado para evitar rupturas de inmersión, sermones morales artificiales o
            respuestas genéricas repetitivas. Los personajes son fieles a su historia,
            conservan sus puntos ciegos y recuerdan lo que vivieron contigo.
          </p>
        </div>
      </div>

      {/* Data Backup & Migration */}
      <div className="bg-[#121622] border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Copias de Seguridad (Exportar / Importar)</span>
        </div>
        <p className="text-xs text-zinc-400">
          Tus creaciones son 100% tuyas. Descarga un archivo JSON con todos tus personajes,
          universos, lorebooks y conversaciones para transferirlos a cualquier dispositivo.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Copia JSON</span>
          </button>
        </div>

        {/* Import JSON textarea */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="text-xs text-zinc-300 font-semibold block">
            Importar datos desde archivo o texto JSON:
          </label>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={2}
            placeholder="Pega el contenido JSON aquí para restaurar..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-purple-500 font-mono"
          />

          {importError && (
            <div className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {importError}
            </div>
          )}

          {importSuccess && (
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> ¡Datos importados con éxito!
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-[#121622] border border-rose-900/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
          <Trash2 className="w-4 h-4" />
          <span>Zona de Peligro</span>
        </div>
        <p className="text-xs text-zinc-400">
          Borrar permanentemente todos tus universos, personajes y mensajes guardados en este navegador.
        </p>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Restablecer todo a cero</span>
        </button>
      </div>
    </div>
  );
};
