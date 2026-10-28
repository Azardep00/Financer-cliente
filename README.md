# Financer KSD — Frontend (Angular 18)

Aplicación web para clientes y asesores financieros. Se conecta al backend **Financer-KSD** (Spring Boot).

## Qué incluye
- **Cliente:** resumen financiero con gráficas, plan del mes con metas medibles, historial de planes (solo lectura), su asesor y mi cuenta.
- **Asesor:** panel de clientes (alertas, búsqueda, filtros, orden, paginación), ficha del cliente (estado, traspaso, diagnósticos con cálculo en vivo, progreso), planes y metas (crear, editar, cerrar mes, cancelar), notas privadas, equipo de asesores y mi cuenta.
- Rutas protegidas por rol, avisos visibles para errores 400/401/403, diseño responsive y navegación accesible (saltar al contenido, foco visible, etiquetas en formularios).

## Correr todo en local
Ver **GUIA-LOCAL.md** (backend + frontend paso a paso).

Resumen: `npm install` y `ng serve` → http://localhost:4200. La URL del backend está en `src/app/core/config.ts`.

## Estructura
- `src/app/core/` modelos, `ApiService`, sesión, guards, interceptor, formato y gráficas.
- `src/app/features/auth|cliente|asesor|cuenta|shell/` pantallas por rol.
- `src/app/pages/landing.component.ts` página pública.

## Comandos
- `ng serve` desarrollo · `ng build` producción (`dist/`) · `ng test` pruebas.
