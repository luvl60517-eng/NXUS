import React from 'react';
import { Universe, LoreEntry } from '../types';
import { GalleryImageUploader } from './GalleryImageUploader';
import { X, Globe, Plus, Trash2, BookOpen, MapPin, KeyRound, Sparkles } from 'lucide-react';

interface UniverseEditorModalProps {
  universe?: Universe | null;
  onSave: (universe: Universe) => void;
  onClose: () => void;
}

const UNIVERSE_PRESETS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&auto=format&fit=crop&q=80',
];

export const UniverseEditorModal: React.FC<UniverseEditorModalProps> = ({
  universe,
  onSave,
  onClose,
}) => {
  const [name, setName] = React.useState(universe?.name || '');
  const [tagline, setTagline] = React.useState(universe?.tagline || '');
  const [description, setDescription] = React.useState(universe?.description || '');
  const [image, setImage] = React.useState(universe?.image || '');
  const [rules, setRules] = React.useState(universe?.rules || '');
  const [secrets, setSecrets] = React.useState(universe?.secrets || '');
  const [locations, setLocations] = React.useState<string[]>(universe?.locations || []);
  const [newLocation, setNewLocation] = React.useState('');
  const [lore, setLore] = React.useState<LoreEntry[]>(universe?.lore || []);

  // New lore entry state
  const [newLoreTitle, setNewLoreTitle] = React.useState('');
  const [newLoreKeywords, setNewLoreKeywords] = React.useState('');
  const [newLoreContent, setNewLoreContent] = React.useState('');
  const [isAddingLore, setIsAddingLore] = React.useState(false);

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    setLocations([...locations, newLocation.trim()]);
    setNewLocation('');
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleAddLore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoreTitle.trim() || !newLoreContent.trim()) return;

    const entry: LoreEntry = {
      id: 'lore_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: newLoreTitle.trim(),
      keywords: newLoreKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      content: newLoreContent.trim(),
    };

    setLore([...lore, entry]);
    setNewLoreTitle('');
    setNewLoreKeywords('');
    setNewLoreContent('');
    setIsAddingLore(false);
  };

  const handleRemoveLore = (id: string) => {
    setLore(lore.filter((l) => l.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedUniverse: Universe = {
      id: universe?.id || 'univ_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      image: image.trim() || undefined,
      rules: rules.trim(),
      secrets: secrets.trim(),
      lore,
      locations,
      createdAt: universe?.createdAt || Date.now(),
    };

    onSave(savedUniverse);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#11141d] border border-zinc-800 w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#151926]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-600/50 flex items-center justify-center text-indigo-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {universe ? `Editar ${universe.name}` : 'Crear Universo & Lorebook'}
              </h2>
              <p className="text-xs text-zinc-400">
                Reglas del mundo, ubicaciones, secretos y persistencia ambiental
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Nombre del Universo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Metrópolis Neo-Aethel"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Lema o Resumen Corto
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej: Lluvia ácida, neón y secretos corporativos"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Descripción General del Mundo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="¿Cómo es este mundo? ¿Qué atmósfera se respira en sus calles o páramos?"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* World Image from Gallery */}
          <GalleryImageUploader
            label="Foto de Perfil o Portada del Mundo"
            sublabel="Sube una ilustración o fotografía desde tu galería para este universo"
            value={image}
            onChange={(val) => setImage(val)}
            aspect="banner"
            presets={UNIVERSE_PRESETS}
            placeholderIcon={<Globe className="w-8 h-8 text-indigo-400" />}
          />

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Leyes y Reglas del Universo (Física, Magia, Tecnología, Códigos Sociales)
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              placeholder="Ej: La magia exige pago en recuerdos; el viaje hiperespacial requiere navegantes sintéticos; mentir ante el concilio es castigado con el exilio."
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Secretos Ocultos del Mundo (Solo revelables mediante investigación o roleplay)
            </label>
            <textarea
              value={secrets}
              onChange={(e) => setSecrets(e.target.value)}
              rows={2}
              placeholder="Ej: El núcleo del reactor se apagará en un mes; el fundador de la rebelión es el hijo del tirano."
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Locations */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Ubicaciones Clave del Universo
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                placeholder="Añadir lugar (ej: La Taberna del Cuervo Ciego)"
                className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
            </div>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {locations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-2.5 py-1 rounded-lg"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {loc}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(idx)}
                      className="text-zinc-500 hover:text-rose-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lorebook section */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Lorebook (Entradas de Sabiduría del Mundo: {lore.length})
              </label>
              {!isAddingLore && (
                <button
                  type="button"
                  onClick={() => setIsAddingLore(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Entrada de Lore
                </button>
              )}
            </div>

            {isAddingLore && (
              <div className="bg-[#161a26] border border-indigo-500/40 rounded-xl p-3 space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-300">
                    Nueva Entrada en el Lorebook
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingLore(false)}
                    className="text-zinc-400 hover:text-zinc-200 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
                <input
                  type="text"
                  value={newLoreTitle}
                  onChange={(e) => setNewLoreTitle(e.target.value)}
                  placeholder="Título (ej: La Guerra de las Seis Torres)"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newLoreKeywords}
                  onChange={(e) => setNewLoreKeywords(e.target.value)}
                  placeholder="Palabras clave separadas por coma (ej: guerra, torres, asedio, rey)"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
                <textarea
                  value={newLoreContent}
                  onChange={(e) => setNewLoreContent(e.target.value)}
                  rows={2}
                  placeholder="Explicación detallada del hecho o facción..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddLore}
                    disabled={!newLoreTitle.trim() || !newLoreContent.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    Guardar Entrada
                  </button>
                </div>
              </div>
            )}

            {lore.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lore.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/70 border border-zinc-800 p-2.5 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-indigo-300">{item.title}</div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {item.content}
                      </p>
                      {item.keywords.length > 0 && (
                        <div className="text-[10px] text-zinc-500">
                          Keywords: {item.keywords.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLore(item.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-[11px] italic">
                Sin entradas de Lorebook. El lore ayuda a los personajes a conocer hechos históricos de este mundo.
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-950 disabled:opacity-50"
            >
              {universe ? 'Guardar Cambios' : 'Crear Universo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
