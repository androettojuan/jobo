# AGENTS.md

Guía para agentes que trabajan en este repo. `ESTADO.md` cuenta dónde está el
proyecto y por qué; este archivo dice cómo trabajar en él.

## Regla obligatoria: react-doctor

**Al terminar cualquier tarea que toque código, revisá la app con react-doctor
antes de dar el trabajo por hecho.** Sin excepciones.

```bash
npx react-doctor@latest --verbose src
```

- Si aparecen hallazgos, corregilos. La meta es cerrar en **100 / 100, sin
  issues**, igual que como quedó el 2 de septiembre de 2026.
- Arreglá la causa en el código. No se silencian reglas ni se toca la config de
  react-doctor para bajar el ruido.
- Los diagnósticos son hipótesis: leé el archivo antes de confirmar o descartar
  cada uno.

## Qué correr, siempre, antes de cerrar

```bash
npm run typecheck            # tsc sobre app y tests
npm run lint                 # oxlint
npx prettier --write src     # formato
npm run test:ui              # tests de pantalla, no necesitan emuladores
npx react-doctor@latest --verbose src
```

`npm test` corre además los tests de las reglas de Firestore y **necesita los
emuladores** (`npm run emulators`).

Sobre el lint: quedan 9 warnings viejos de `react(set-state-in-effect)` en
efectos que sincronizan con Firestore. Son conocidos; no sumes warnings nuevos.

## Cómo está armado el código

- `src/pages/` arma la pantalla y el estado; la UI de cada pedazo vive en
  `src/features/<dominio>/components/`. Si una página empieza a crecer en
  ramas, se parte en componentes ahí, no se deja engordar.
- `src/components/ui/` son piezas sin dominio (Button, Input, ChipGroup…).
- Los contextos van en su propio archivo, separados del componente que los
  provee (`features/auth/AuthContext.ts` vs `AuthProvider.tsx`): si conviven,
  Fast Refresh recarga la app entera.
- Toda ruta de primer nivel en `src/app/router.tsx` lleva `errorElement`.
- Los efectos que abren timers, listeners o suscripciones devuelven su cleanup.
- Para buscar lo mismo muchas veces, `Set`/`Map`, no `array.includes`.
- Para ordenar sin mutar, `array.toSorted()` (el target es ES2023).

## Idioma

El código, los comentarios y los textos de la interfaz están en español
rioplatense, con acentos. Los comentarios explican **por qué**, no qué hace la
línea de al lado.
