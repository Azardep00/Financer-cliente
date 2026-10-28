# Guía para correr Financer KSD en local

## Requisitos
Node 18+ y npm, Angular CLI (`npm i -g @angular/cli`), Java 17+ y Maven, PostgreSQL (o Docker).

## 1. Base de datos
Crea la base `financer_ksd` en PostgreSQL (usuario por defecto `postgres`), o usa el `docker-compose.yml` del backend:
`docker compose up -d`.
Variables opcionales: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`.

## 2. Backend (carpeta Financer-KSD)
```
mvn spring-boot:run
```
Queda en http://localhost:8080 (Swagger en /swagger-ui.html). Con la base vacía crea un asesor inicial:
- correo `admin@financerksd.com`, contraseña `Admin123!` (cámbialos con `ADMIN_CORREO` / `ADMIN_CONTRASENA`).
CORS ya permite http://localhost:4200.

## 3. Frontend (carpeta Financer-cliente)
```
npm install
ng serve
```
Abre http://localhost:4200. Si el backend corre en otra URL, edita `src/app/core/config.ts`.

## 4. Recorrido de prueba
1. Entra como asesor (admin) → **Asesores** → crea un asesor si quieres.
2. En otra ventana privada, **Regístrate** como cliente.
3. Como asesor: **Clientes** → abre la ficha → registra un diagnóstico → crea el plan del mes con metas → escribe una nota privada.
4. Como cliente: revisa Resumen, Plan del mes y Mi cuenta. Marca una meta como cumplida.
5. Como asesor: **Cerrar mes** y revisa el historial.

## Problemas comunes
- «No se pudo conectar con el servidor»: el backend no está corriendo o `API_URL` es incorrecta.
- Error 403 en la ficha: el cliente pertenece a otro asesor (solo lectura).
- Error de CORS: agrega tu URL a `CORS_ORIGINS`.
