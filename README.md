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
- Deploy: Render

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

### Variables de Entorno

#### Frontend

Crea un archivo `.env` en la carpeta `frontend/`:

```env
# URL del backend para conexiones WebSocket
# Por defecto: http://localhost:3001 (desarrollo local)
BACKEND_URL=http://localhost:3001
```

## Arquitectura

### Estructura de Carpetas

```
frontend/
├── app/              # Páginas y layouts (Server Components)
├── components/       # Componentes reutilizables (Client/Server)
├── hooks/            # Custom hooks
├── lib/              # Utilidades y constantes
└── types/            # Tipos TypeScript compartidos
```

### Prácticas Aplicadas

- ✅ **Server Components por defecto**: Las páginas son Server Components que renderizan Client Components solo donde es necesario
- ✅ **Custom Hooks**: Lógica de estado extraída a hooks reutilizables (`useStrokesState`)
- ✅ **Separación de responsabilidades**: Constantes, utilidades y configuración en `lib/`
- ✅ **Metadata y SEO**: Metadata configurada en todas las páginas
- ✅ **Manejo de errores**: Páginas `error.tsx` y `loading.tsx` para mejor UX
- ✅ **Variables de entorno**: Configuración centralizada en `lib/config.ts`
