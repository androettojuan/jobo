import {
  Baby,
  Bike,
  Brush,
  Car,
  Cat,
  Cctv,
  ChefHat,
  Container,
  Drill,
  Droplets,
  Flame,
  Hammer,
  HeartHandshake,
  Key,
  Laptop,
  Leaf,
  Music,
  PaintRoller,
  Palette,
  Camera,
  Languages,
  Refrigerator,
  Scissors,
  Shirt,
  Sparkles,
  Sofa,
  Tractor,
  Truck,
  Waves,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { Category } from '@/types/models'

/**
 * Los iconos se guardan en Firestore como string (el nombre) y se resuelven
 * acá: agregar una categoría no requiere subir ninguna imagen.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  bike: Bike,
  brush: Brush,
  camera: Camera,
  car: Car,
  cat: Cat,
  cctv: Cctv,
  'chef-hat': ChefHat,
  container: Container,
  drill: Drill,
  droplets: Droplets,
  flame: Flame,
  hammer: Hammer,
  'heart-handshake': HeartHandshake,
  key: Key,
  languages: Languages,
  laptop: Laptop,
  leaf: Leaf,
  music: Music,
  'paint-roller': PaintRoller,
  palette: Palette,
  refrigerator: Refrigerator,
  scissors: Scissors,
  shirt: Shirt,
  sofa: Sofa,
  sparkles: Sparkles,
  tractor: Tractor,
  truck: Truck,
  waves: Waves,
  wind: Wind,
  wrench: Wrench,
  zap: Zap,
}

/** Agrupamos para que el home no sea una grilla infinita de 30 iconos. */
export type CategoryGroup = 'hogar' | 'obra' | 'vehiculos' | 'personas' | 'servicios'

export const CATEGORY_GROUPS: { id: CategoryGroup; name: string }[] = [
  { id: 'hogar', name: 'Hogar y arreglos' },
  { id: 'obra', name: 'Obra y construcción' },
  { id: 'vehiculos', name: 'Vehículos y campo' },
  { id: 'personas', name: 'Cuidado y bienestar' },
  { id: 'servicios', name: 'Servicios y eventos' },
]

export interface CategoryDef extends Category {
  group: CategoryGroup
}

export const CATEGORIES: CategoryDef[] = [
  // Hogar
  { id: 'plomero', name: 'Plomero', icon: 'droplets', group: 'hogar', order: 1, active: true },
  { id: 'electricista', name: 'Electricista', icon: 'zap', group: 'hogar', order: 2, active: true },
  { id: 'gasista', name: 'Gasista', icon: 'flame', group: 'hogar', order: 3, active: true },
  { id: 'cerrajero', name: 'Cerrajero', icon: 'key', group: 'hogar', order: 4, active: true },
  { id: 'refrigeracion', name: 'Aire y refrigeración', icon: 'wind', group: 'hogar', order: 5, active: true },
  { id: 'electrodomesticos', name: 'Service de electrodomésticos', icon: 'refrigerator', group: 'hogar', order: 6, active: true },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles', group: 'hogar', order: 7, active: true },
  { id: 'jardineria', name: 'Jardinería y poda', icon: 'leaf', group: 'hogar', order: 8, active: true },
  { id: 'piletas', name: 'Mantenimiento de piletas', icon: 'waves', group: 'hogar', order: 9, active: true },
  { id: 'tapiceria', name: 'Tapicería y muebles', icon: 'sofa', group: 'hogar', order: 10, active: true },
  { id: 'costura', name: 'Costura y arreglos de ropa', icon: 'shirt', group: 'hogar', order: 11, active: true },
  { id: 'seguridad', name: 'Cámaras y alarmas', icon: 'cctv', group: 'hogar', order: 12, active: true },

  // Obra
  { id: 'albanil', name: 'Albañil', icon: 'hammer', group: 'obra', order: 20, active: true },
  { id: 'pintor', name: 'Pintor', icon: 'paint-roller', group: 'obra', order: 21, active: true },
  { id: 'carpintero', name: 'Carpintero', icon: 'drill', group: 'obra', order: 22, active: true },
  { id: 'herrero', name: 'Herrero y soldadura', icon: 'wrench', group: 'obra', order: 23, active: true },
  { id: 'techista', name: 'Techista', icon: 'container', group: 'obra', order: 24, active: true },
  { id: 'durlock', name: 'Durlock y yesería', icon: 'brush', group: 'obra', order: 25, active: true },

  // Vehículos y campo
  { id: 'mecanico', name: 'Mecánico', icon: 'car', group: 'vehiculos', order: 30, active: true },
  { id: 'gomeria', name: 'Gomería', icon: 'bike', group: 'vehiculos', order: 31, active: true },
  { id: 'fletes', name: 'Fletes y mudanzas', icon: 'truck', group: 'vehiculos', order: 32, active: true },
  { id: 'maquinaria', name: 'Tractor y movimiento de suelo', icon: 'tractor', group: 'vehiculos', order: 33, active: true },

  // Personas
  { id: 'ninera', name: 'Cuidado de niños', icon: 'baby', group: 'personas', order: 40, active: true },
  { id: 'cuidado-adultos', name: 'Cuidado de adultos', icon: 'heart-handshake', group: 'personas', order: 41, active: true },
  { id: 'peluqueria', name: 'Peluquería y estética', icon: 'scissors', group: 'personas', order: 42, active: true },
  { id: 'mascotas', name: 'Cuidado de mascotas', icon: 'cat', group: 'personas', order: 43, active: true },
  { id: 'profesor', name: 'Clases particulares', icon: 'languages', group: 'personas', order: 44, active: true },

  // Servicios
  { id: 'informatica', name: 'Informática y redes', icon: 'laptop', group: 'servicios', order: 50, active: true },
  { id: 'diseno', name: 'Diseño gráfico', icon: 'palette', group: 'servicios', order: 51, active: true },
  { id: 'fotografia', name: 'Fotografía y video', icon: 'camera', group: 'servicios', order: 52, active: true },
  { id: 'eventos', name: 'Sonido y eventos', icon: 'music', group: 'servicios', order: 53, active: true },
  { id: 'catering', name: 'Cocina y catering', icon: 'chef-hat', group: 'servicios', order: 54, active: true },
]

export const CATEGORIES_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

/** Resuelve el icono de una categoría; las propuestas por usuarios caen en el genérico. */
export function categoryIcon(id: string): LucideIcon {
  const icon = CATEGORIES_BY_ID.get(id)?.icon
  return (icon ? CATEGORY_ICONS[icon] : undefined) ?? Wrench
}
