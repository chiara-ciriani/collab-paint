# Collaborative Paint

Aplicación web de dibujo colaborativo en tiempo real donde múltiples usuarios pueden dibujar en un lienzo compartido simultáneamente.

## Stack

### Frontend
- **Next.js** (App Router) + TypeScript
- **TailwindCSS** (opcional, para estilos)
- Deploy: Vercel

### Backend
- **Node.js** + TypeScript
- **Express** (framework HTTP)
- **Socket.IO** (comunicación en tiempo real)
- Deploy: Render / Railway / Fly.io

## Estructura del Proyecto

```
.
├── frontend/          # Aplicación Next.js
├── backend/           # Servidor Node.js + Socket.IO
└── README.md
```

## Desarrollo Local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Backend

```bash
cd backend
npm install
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

**Nota:** El backend está configurado para aceptar conexiones desde `http://localhost:3000` por defecto. Si necesitas cambiar el puerto del frontend, configura la variable de entorno `FRONTEND_URL` en el backend.

## Próximos Pasos

- [ ] Implementar canvas básico
- [ ] Integrar WebSocket para tiempo real
- [ ] Agregar herramientas de dibujo (color, grosor)
- [ ] Implementar sistema de rooms compartibles

