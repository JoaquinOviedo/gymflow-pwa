# GymFlow: instrucciones de mantenimiento

Este archivo resume las reglas que deben seguirse antes de modificar el proyecto. La referencia técnica ampliada está en [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Objetivo del producto

GymFlow es una PWA personal de gimnasio, local y privada. Está pensada para facilitar el entrenamiento diario, no para funcionar como una aplicación de gestión.

Las prioridades de UX son, en este orden:

1. Poder iniciar una rutina desde Inicio con la menor navegación posible.
2. Ver las rutinas por nombre y el calendario en la misma vista.
3. Mantener la sesión activa compacta: cada ejercicio se registra en una sola fila, con un peso y una cantidad de reps para todas sus series.
4. Permitir importar el plan de Excel sin reescribirlo manualmente.
5. Mantener el historial y la eliminación de entrenamientos accesibles sin convertirlos en el centro de la app.

No reintroducir barra de navegación inferior, dashboard de métricas, pantallas separadas de calendario/progreso o listas extensas de ejercicios salvo que Joaquín lo pida expresamente.

## Flujo visible actual

- `dashboard`: Inicio. Contiene rutinas compactas, calendario, comienzo rápido, sesión en curso e historial inline.
- `session`: sesión activa. Contiene timer, ejercicios en filas compactas, descanso, notas y finalización.
- Editar/importar rutinas se abre como panel modal desde Inicio.
- Configuración se abre como panel modal desde el botón superior.
- El calendario completo, progreso, peso corporal, historial antiguo y técnica todavía tienen componentes en `src/App.tsx`, pero no forman parte de la navegación visible actual. No activarlos automáticamente.

## Reglas de implementación

- Mantener los datos en el dispositivo: IndexedDB con fallback a `localStorage`; no agregar backend, cuentas ni sincronización remota sin una solicitud explícita.
- Usar `setState` de forma inmutable y conservar los tipos de `src/types.ts`.
- Si se agrega un campo obligatorio a `AppState`, actualizar la carga de datos antiguos y la importación de backups; `loadState` no hace migraciones automáticas.
- La apariencia usa variables CSS en `src/styles.css`. Mantener funcionando `light`, `dark` y `system`, incluyendo el `data-theme` del elemento raíz.
- Cualquier cambio al modelo de sesión debe conservar el cálculo de PRs, volumen, eliminación de sesiones y el comportamiento de una sola carga/reps por ejercicio.
- Los cambios de UX deben conservar el calendario visible en Inicio y el flujo rápido de entrenamiento.
- La importación de Excel se carga de forma diferida. No importar `xlsx` en el arranque salvo que sea necesario.
- Las funciones de cámara procesan el video localmente y no deben guardar ni enviar el video.
- Preferir cambios pequeños y legibles. `src/App.tsx` es actualmente un archivo denso; localizar el componente por nombre antes de editarlo y evitar reescrituras masivas.

## Comandos de validación

Desde la raíz del proyecto:

```text
npm install
npm run lint
npm run test
npm run build
```

Para probar localmente:

```text
npm run dev -- --host 127.0.0.1
```

Comprobar también `http://127.0.0.1:5173/`, `/manifest.webmanifest` y `/sw.js` cuando se toque el arranque o la PWA.

## Windows y publicación

- `iniciar_gymflow.bat` delega en PowerShell y permanece invisible.
- `iniciar_gymflow.vbs` oculta la consola para el acceso directo.
- `iniciar_gymflow.ps1` actualiza desde `origin/<rama actual>` solo con fast-forward y solo si el árbol local está limpio; luego inicia Vite, verifica que la respuesta contiene `GymFlow` y abre el navegador.
- `crear_acceso_directo.ps1` crea `GymFlow.lnk` en el Escritorio.
- El remoto actual es `https://github.com/JoaquinOviedo/gymflow-pwa.git`. La rama de trabajo publicada actualmente es `agent/excel-import-minimal-ui`.
- Antes de publicar: revisar `git status`, ejecutar las validaciones, confirmar que solo se agregan archivos relacionados, hacer commit descriptivo y usar `git push`.
- No usar `git reset --hard`, `git checkout --` ni comandos destructivos para resolver conflictos sin autorización explícita.

## Documentación relacionada

- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md): arquitectura, modelo de datos, importación, persistencia, scripts y deuda conocida.
- [`README.md`](README.md): instalación y uso diario en Windows.
