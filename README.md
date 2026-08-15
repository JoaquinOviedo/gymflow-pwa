# GymFlow

PWA personal de gimnasio con rutinas, sesiones, PRs, calendario, progreso, peso corporal y análisis local de técnica.

También podés importar una rutina desde un archivo `.xlsx`: GymFlow reconoce bloques como `Día 1`, `Día 2`, `Día 3`, cardio/movilidad y estiramiento. Las variantes se agregan como ejercicios disponibles; los ejercicios marcados como eliminados no se activan.

## Uso en Windows

El acceso directo `GymFlow.lnk` abre `iniciar_gymflow.vbs`, que ejecuta el lanzador sin mostrar una consola. El lanzador:

1. Consulta GitHub y aplica únicamente actualizaciones fast-forward cuando el árbol local está limpio.
2. Instala dependencias si todavía no existe `node_modules`.
3. Inicia Vite en `http://127.0.0.1:5173/` en segundo plano.
4. Espera una respuesta HTTP válida de GymFlow y recién entonces abre el navegador.

Para recrear el acceso directo:

```powershell
powershell -ExecutionPolicy Bypass -File .\crear_acceso_directo.ps1
```

Para ejecutar manualmente:

```bat
iniciar_gymflow.bat
```

Los datos de entrenamiento permanecen locales en IndexedDB. El video de cámara no se guarda.

## Desarrollo

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

La guía para futuras modificaciones está en [`AGENTS.md`](AGENTS.md) y el contexto técnico completo en [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). La experiencia actual prioriza Inicio y Sesión activa; el calendario se muestra dentro de Inicio y la edición/importación de rutinas se abre como panel.
