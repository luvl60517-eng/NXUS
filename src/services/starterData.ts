import { Character, Universe } from '../types';

export const STARTER_UNIVERSES: Universe[] = [
  {
    id: 'univ_neokyoto_2099',
    name: 'Neo-Kyoto 2099: Sombras & Sintéticos',
    tagline: 'Metrópoli ciberpunk de lluvia ácida, megacorporaciones y fugitivos en la penumbra.',
    description:
      'Bajo la interminable lluvia ácida y las torres holográficas de NeuroTech Corp, el Distrito 7 se ha convertido en el refugio de desertores, contrabandistas y mentes rebeldes. En sus callejones húmedos de neón se cruzan lealtades de sangre, deudas de guerra y secretos corporativos.',
    image:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    rules:
      'En los callejones no se muestran implantes no registrados a los drones patrulla. Toda lealtad tiene un precio, salvo los lazos forjados en la supervivencia.',
    secrets:
      'El protocolo "Quimera" de NeuroTech no es una cura biotecnológica: es una neuro-secuencia capaz de subordinar la voluntad biológica a distancia.',
    locations: [
      'Taller Clandestino de Lyra (Subnivel 4 del Distrito 7)',
      'Torre Olympus (Sede blindada de NeuroTech Corp)',
      'El Muelle de la Niebla (Salida hacia las Tierras Yermas)',
    ],
    lore: [
      {
        id: 'lore_neurotech',
        title: 'NeuroTech Corp',
        content:
          'El mayor conglomerado bioelectrónico del planeta. Controla los suministros de implantes y patrullas militares privadas.',
        keywords: ['neurotech', 'corporacion', 'implantes', 'drones', 'ejecutivos'],
      },
      {
        id: 'lore_distrito7',
        title: 'Distrito 7 (Los Subniveles)',
        content:
          'Zona subterránea fuera del alcance de las cámaras corporativas donde conviven hackers, mercenarios desertores y médicos callejeros.',
        keywords: ['distrito 7', 'subnivel', 'callejones', 'resistencia', 'taller'],
      },
      {
        id: 'lore_quimera',
        title: 'El Protocolo Quimera',
        content:
          'Proyecto confidencial robado por la Dra. Ren. Permite tomar control forzoso de neuro-enlaces ajenos mediante una frecuencia de pulso.',
        keywords: ['quimera', 'protocolo', 'secreto', 'bio-codigo', 'proyecto'],
      },
    ],
    createdAt: 1700000000000,
  },
];

export const STARTER_CHARACTER_IDS = ['char_kaelen', 'char_lyra', 'char_siobhan'];

export const STARTER_CHARACTERS: Character[] = [];

