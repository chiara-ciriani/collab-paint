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

Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
# URL del backend para conexiones WebSocket
# Por defecto: http://localhost:3001 (desarrollo local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Tiempo en milisegundos antes de ocultar el cursor de otros usuarios por inactividad
# Por defecto: 2000 (2 segundos)
NEXT_PUBLIC_CURSOR_TIMEOUT_MS=2000
```

## Arquitectura

### Estructura de Carpetas

#### Frontend
```
frontend/
├── app/              # Páginas y layouts (Server Components)
├── components/       # Componentes reutilizables (Client/Server)
├── hooks/            # Custom hooks
├── lib/              # Utilidades y constantes
└── types/            # Tipos TypeScript compartidos
```

#### Backend
```
backend/
├── src/
│   ├── server.ts              # Entry point: HTTP server + Socket.IO setup
│   ├── rooms/
│   │   ├── types.ts           # Domain types (Point, Stroke, RoomState, etc.)
│   │   ├── roomsStore.ts      # Data layer: in-memory Map operations
│   │   └── roomsService.ts    # Business logic layer
│   └── sockets/
│       ├── types.ts           # Socket event payload types
│       ├── validators.ts      # Payload validation functions
│       └── connectionHandler.ts  # Socket.IO event handlers
```

### Arquitectura del Backend

El backend sigue una arquitectura en capas que separa:

1. **Capa de Transporte** (`sockets/connectionHandler.ts`): Maneja eventos de Socket.IO
2. **Capa de Lógica de Negocio** (`rooms/roomsService.ts`): Operaciones de dominio
3. **Capa de Datos** (`rooms/roomsStore.ts`): Almacenamiento in-memory

**Beneficios:**
- Fácil de testear (lógica separada de I/O)
- Fácil de extender (cambiar transporte sin tocar lógica)

**Nota sobre escalabilidad:** El servidor mantiene el estado de las rooms en memoria mediante un `Map`, encapsulado en `roomsStore`. En una versión productiva, este estado se movería a Redis para permitir múltiples instancias del backend.

### Protocolo WebSocket

#### Eventos Cliente → Servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room:join` | `{ roomId: string, userId: string, displayName?: string }` | Unirse a una sala |
| `stroke:start` | `{ roomId: string, strokeId: string, userId: string, color: string, thickness: number, startPoint: Point }` | Iniciar un nuevo stroke |
| `stroke:update` | `{ roomId: string, strokeId: string, points: Point[] }` | Actualizar stroke con nuevos puntos |
| `stroke:end` | `{ roomId: string, strokeId: string }` | Finalizar un stroke |
| `canvas:clear` | `{ roomId: string, userId?: string }` | Limpiar el canvas |

#### Eventos Servidor → Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room:state` | `{ roomId: string, strokes: Stroke[], users: User[] }` | Estado completo de la sala (al unirse) |
| `stroke:started` | `{ strokeId: string, userId: string, color: string, thickness: number, startPoint: Point }` | Nuevo stroke iniciado por otro usuario |
| `stroke:updated` | `{ strokeId: string, points: Point[] }` | Stroke actualizado con nuevos puntos |
| `stroke:ended` | `{ strokeId: string }` | Stroke finalizado |
| `canvas:cleared` | `{ roomId: string, clearedBy?: string }` | Canvas limpiado |
| `user:joined` | `{ userId: string, displayName?: string }` | Usuario se unió a la sala |
| `user:left` | `{ userId: string }` | Usuario se desconectó |
| `error` | `{ message: string, code?: string }` | Error en operación |

#### Tipos

```typescript
interface Point {
  x: number; // 0-1 (coordenadas normalizadas)
  y: number; // 0-1
}

interface Stroke {
  id: string;
  userId: string;
  color: string; // Hex format: #RRGGBB
  thickness: number; // 1-50
  points: Point[];
  createdAt: number;
}
```

### Prácticas Aplicadas

#### Frontend
- ✅ **Server Components por defecto**: Las páginas son Server Components que renderizan Client Components solo donde es necesario
- ✅ **Custom Hooks**: Lógica de estado extraída a hooks reutilizables (`useStrokesState`)
- ✅ **Separación de responsabilidades**: Constantes, utilidades y configuración en `lib/`
- ✅ **Metadata y SEO**: Metadata configurada en todas las páginas
- ✅ **Manejo de errores**: Páginas `error.tsx` y `loading.tsx` para mejor UX
- ✅ **Variables de entorno**: Configuración centralizada en `lib/config.ts`

#### Backend
- ✅ **Arquitectura en capas**: Separación entre transporte, lógica de negocio y datos
- ✅ **Validación de payloads**: Validación robusta con funciones dedicadas
- ✅ **Ciclo de vida de conexiones**: Manejo correcto de disconnect y limpieza
- ✅ **Seguridad básica**: CORS configurado, límite de tamaño de payload
