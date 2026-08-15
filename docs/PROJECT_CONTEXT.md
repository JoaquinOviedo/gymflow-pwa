# Contexto de proyecto: GymFlow

Documento de referencia para futuras modificaciones. Describe el estado real del repositorio al 15 de agosto de 2026; actualizarlo si cambian el flujo principal, el modelo de datos o el proceso de arranque.

## Identidad y alcance

- Nombre: GymFlow.
- Tipo: PWA React + TypeScript + Vite para uso personal.
- Idioma de interfaz: español (`es`).
- Datos: locales en el dispositivo; no hay cuenta, API ni servidor de datos.
- Repositorio: `https://github.com/JoaquinOviedo/gymflow-pwa.git`.
- Rama publicada de trabajo: `agent/excel-import-minimal-ui`.
- PR de trabajo actual: [#1](https://github.com/JoaquinOviedo/gymflow-pwa/pull/1).

## Estructura del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `src/App.tsx` | Estado global, acciones de sesiones y la mayoría de componentes de UI. Incluye Inicio, sesión, rutinas, calendario antiguo, progreso, historial, técnica y ajustes. |
| `src/types.ts` | Tipos del estado, rutinas, ejercicios, series, sesiones, récords, análisis y preferencias. |
| `src/seed.ts` | Ejercicios y rutina iniciales; también define las preferencias iniciales. |
| `src/db.ts` | Persistencia en IndexedDB (`gymflow-db`, store `app`, key `state`) y fallback `localStorage` (`gymflow-state`). |
| `src/importExcel.ts` | Parser diferido de `.xlsx`; crea rutinas y ejercicios a partir de bloques del plan. |
| `src/analytics.ts` | Volumen y detección de récords personales. Los récords nuevos se asocian a `sessionId`. |
| `src/technique.ts` | Analizadores locales de técnica y tipos de feedback de pose. |
| `src/utils.ts` | IDs, fechas, duración, números, volumen, 1RM estimado y semana actual. |
| `src/logic.test.ts` | Tests unitarios de cálculos, PRs, fechas, analizador de curl e importación Excel. |
| `src/main.tsx` | Punto de entrada React; importa `styles.css` y monta `App`. |
| `src/styles.css` | Tokens de tema, layout, componentes, responsive y estados de la aplicación. |
| `public/manifest.webmanifest` | Metadatos instalables de la PWA. |
| `public/sw.js` | Service worker con cache-first y fallback a `/index.html`. |
| `iniciar_gymflow.bat` | Entrada de usuario para iniciar sin consola visible. |
| `iniciar_gymflow.vbs` | Oculta la ventana de `cmd.exe` que ejecuta el `.bat`. |
| `iniciar_gymflow.ps1` | Actualización fast-forward desde GitHub, selección de puerto, servidor y apertura del navegador. |
| `crear_acceso_directo.ps1` | Crea `GymFlow.lnk` en el Escritorio. |
| `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` | Configuración de build, TypeScript y lint. |

Los siguientes elementos son generados o locales y están ignorados por Git: `node_modules/`, `dist/`, `*.tsbuildinfo`, logs del lanzador, `.xlsx-tool/` y archivos `.env`.

## Arquitectura visible actual

`App` conserva el estado completo y solo renderiza dos flujos principales:

```text
App
├─ dashboard
│  ├─ rutinas por nombre + comienzo rápido
│  ├─ MiniCalendar en la misma vista
│  ├─ InlineHistory con eliminación confirmada
│  ├─ panel modal Routines para editar/importar
│  └─ panel modal SettingsView para preferencias/backups
└─ session
   ├─ timer y pausa
   ├─ una fila por ejercicio: nombre, peso, reps, series, completar
   ├─ RestTimer opcional
   └─ notas y finalización
```

El tipo `Page` todavía contiene `routines`, `calendar`, `progress`, `technique`, `history` y `settings` por compatibilidad con componentes antiguos, pero la navegación visible se redujo deliberadamente a Inicio y Sesión. `Routines`, `SettingsView`, `CalendarView`, `Progress`, `BodyWeightPanel`, `HistoryView` y `TechniqueView` viven en `App.tsx`; los tres primeros tienen uso parcial/actual y los restantes están dormidos en el flujo principal.

## Modelo de datos

`AppState` contiene:

- `exercises`: catálogo de ejercicios base o importados.
- `routines`: nombre, descripción y ejercicios prescritos (`targetSets`, rango de reps, descanso, carga inicial).
- `sessions`: sesiones en curso o terminadas, con arrays de `ExerciseSet`.
- `records`: PRs de peso, reps, volumen y 1RM estimado; los nuevos incluyen `sessionId`.
- `bodyWeight`: registros opcionales de peso corporal.
- `analyses`: resultados locales de técnica.
- `activeSession`: referencia a la sesión en curso y tiempo pausado.
- `settings`: `theme` (`light`, `dark`, `system`), unidad, descanso automático, sonido, vibración y esqueleto de cámara.

Al comenzar una sesión se crean tantas series como `targetSets`. En la UI actual, el usuario introduce el peso y las reps una sola vez por ejercicio; esos valores se copian a todas sus series. Completar un ejercicio marca todas sus series. La sesión solo se puede finalizar cuando todos los ejercicios tienen todas sus series completadas.

Al finalizar:

1. Se calcula la duración usando `startedAt` y `pausedSeconds`.
2. Se detectan PRs únicamente con series completadas y reps mayores que cero.
3. Se guardan los PRs con el `sessionId` de la sesión.
4. Se elimina `activeSession` y se vuelve a Inicio.

Al eliminar una sesión desde el historial, también se eliminan sus PRs asociados. Para PRs antiguos sin `sessionId` se usa como fallback la fecha y el ejercicio.

## Persistencia y backups

`src/db.ts` no tiene versionado ni migraciones de esquema. Lee el objeto completo desde IndexedDB y, si no existe o falla, usa el backup JSON de `localStorage`. Por eso, cualquier nueva propiedad requerida debe normalizarse al cargar estados antiguos antes de usarla.

La pantalla de Ajustes exporta el `AppState` completo como `gymflow-backup-YYYY-MM-DD.json` e importa un backup si contiene `exercises`, `sessions` y `settings`. Si se amplía la validación, conservar compatibilidad con backups previos.

## Importación de Excel

`parseWorkoutWorkbook` importa `xlsx` de forma dinámica al seleccionar un archivo. Recorre todas las hojas y reconoce:

- Bloques `Dia 1`, `Dia 2`, etc. en la primera columna.
- En esos bloques: ejercicio en columna A, carga planificada en B y peso actual en C.
- Una sección `Dia 2 Cardio` en la columna E, leyendo ejercicio/carga desde E/F.
- Una sección `Dia Estiramiento` en la columna H, leyendo ejercicio/carga desde H/I.
- `Variantes de Ejercicios` como catálogo de ejercicios disponibles.
- Filas bajo `Ejercicios eliminados` no se agregan al catálogo de variantes.

El parser interpreta nombres como `4x10`, `3 × 12`, cardio por minutos y cargas numéricas con o sin `kg`. Conserva el peso actual como `startingWeight` cuando puede convertirlo a número y conserva el texto original en `startingLoad`.

Si se cambia el formato aceptado, actualizar `src/importExcel.ts` y los tests de importación en `src/logic.test.ts` juntos.

## Apariencia y PWA

- El tema se resuelve desde `state.settings.theme` y se aplica como `data-theme` sobre `<html>`.
- `light` y `dark` usan variables CSS; `system` escucha `prefers-color-scheme`.
- El botón superior alterna directamente entre claro y oscuro; Ajustes conserva las tres opciones.
- A partir de 1200 px de ancho se activa automáticamente una escala de gimnasio para lectura a 1–2 metros: aumenta títulos, controles, timer, rutinas, calendario e historial. La versión móvil conserva su escala compacta.
- Al entrar en una sesión se activa el modo de visualización de entrenamiento: se oculta la cabecera general y se priorizan la hora actual, el tiempo de sesión y la actividad en curso.
- Cada ejercicio puede tener `workSeconds`. En ese caso, la app cuenta cada serie, completa la serie al llegar a cero, ejecuta `restSeconds` y continúa con la siguiente serie o ejercicio cronometrado. Los cambios se anuncian por voz cuando está habilitado el sonido de descanso.
- La sesión puede pausarse desde el botón visible o con la barra espaciadora. La pausa congela el tiempo general y cualquier cuenta regresiva hasta continuar.
- `public/manifest.webmanifest` declara el modo standalone y el color de acento lime.
- `public/sw.js` cachea la raíz y recursos solicitados. Si se cambia la estrategia de cache o el nombre de cache, probar una instalación existente y considerar un nuevo nombre de cache.

## Lanzador de Windows

El flujo de usuario es:

```text
GymFlow.lnk → iniciar_gymflow.vbs → iniciar_gymflow.bat → iniciar_gymflow.ps1 → Vite → navegador
```

`iniciar_gymflow.ps1`:

1. Se posiciona en la carpeta del script mediante `Split-Path -Parent $MyInvocation.MyCommand.Path`.
2. Hace `git fetch origin` y solo aplica `git pull --ff-only` si `HEAD..origin/<rama>` tiene commits y el árbol está limpio.
3. Instala dependencias si falta `node_modules`.
4. Busca un puerto libre entre 5173 y 5193.
5. Reutiliza un servidor existente si devuelve HTTP 200 y contiene `GymFlow`.
6. Inicia Vite oculto, espera hasta 45 segundos y abre el navegador únicamente después de validar la respuesta.

No cambiar la comprobación a “puerto escuchando” solamente: un proceso puede estar activo y servir otra aplicación.

## Validación y entrega

Antes de considerar terminado un cambio:

```text
npm run lint
npm run test
npm run build
```

Si cambia el arranque, ejecutar además una comprobación HTTP de `/`, `/manifest.webmanifest` y `/sw.js`. Si cambia UI, probar Inicio, abrir/cerrar panel de rutinas, comenzar sesión, registrar un ejercicio, finalizar/eliminar sesión y cambiar tema.

La rama actual de trabajo está publicada en el PR #1. Revisar siempre `git status -sb` antes de hacer commit y no incluir `dist`, logs ni archivos generados.

## Deuda técnica conocida

- `src/App.tsx` concentra muchas vistas en líneas muy densas; una extracción gradual de componentes podría mejorar mantenimiento, pero debe conservar el flujo reducido.
- Hay componentes de navegación antigua no usados por la UI actual.
- No hay migraciones de IndexedDB ni pruebas de componentes React.
- El service worker usa cacheo genérico; una actualización de assets puede requerir revisar invalidación de cache.
- El parser de Excel depende de posiciones de columnas; formatos nuevos deben incorporarse de manera explícita y probarse.
