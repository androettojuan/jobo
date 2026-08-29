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

import categoriesData from './data/categories.json'

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

export const CATEGORIES = categoriesData as CategoryDef[]

export const CATEGORIES_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

/** Resuelve el icono de una categoría; las propuestas por usuarios caen en el genérico. */
export function categoryIcon(id: string): LucideIcon {
  const icon = CATEGORIES_BY_ID.get(id)?.icon
  return (icon ? CATEGORY_ICONS[icon] : undefined) ?? Wrench
}
