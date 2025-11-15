# Collaborative Paint – Real-time Collaborative Drawing App

Aplicación web de dibujo colaborativo en tiempo real donde múltiples usuarios pueden dibujar simultáneamente en un lienzo compartido. Construida con Next.js + TypeScript en el frontend y Node.js + Socket.IO en el backend.

## Demo

| Capa | URL |
|------|-----|
| **Frontend** (Next.js – Vercel) | `https://collab-paint.vercel.app/` |
| **Backend** (Node + Socket.IO – Render) | `https://collab-paint.onrender.com` |


## Project Overview

Collaborative Paint permite a los usuarios crear o unirse a una sala y colaborar en un lienzo compartido. Cada trazo dibujado por un usuario aparece instantáneamente en todos los clientes conectados a través de un canal WebSocket.

### Core Features

- **Crear sala con URL compartible** (`/room/:id`)
- **Dibujo en tiempo real** (WebSockets vía Socket.IO)
- **Selector de color y grosor** del pincel
- **Modos de dibujo**: Libre (freehand) y Formas (círculo, rectángulo, línea, triángulo)
- **Limpiar canvas** (broadcast a todos los usuarios)
- **Borrar mis trazos**: Eliminar solo los trazos del usuario actual
- **Presencia de usuarios**: Ver cuántos usuarios están conectados y sus nicknames
- **Indicadores de cursor**: Ver el cursor y nickname de otros usuarios mientras dibujan
- **Sincronización de reconexión**: Al refrescar, recibís el estado completo de la sala
- **Exportar como imagen**: Descargar el canvas como PNG
- **Smoothing de trazos**: Interpolación con curvas cuadráticas para líneas suaves
- **Optimizaciones de performance**: Batching de updates, throttling de cursor, `requestAnimationFrame`

### Optional / Nice-to-have (Future Work)

-  Undo/Redo por usuario
- Persistencia de salas usando Redis/DB
- Soporte completo para touch y stylus en móviles
- Más herramientas de dibujo (texto, formas avanzadas)
- Autenticación y moderación básica

## Tech Stack

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Next.js (App Router), TypeScript, TailwindCSS | UI, routing, estilos |
| **Tiempo Real** | Socket.IO (client) | Comunicación bidireccional |
| **Backend** | Node.js + TypeScript + Express + Socket.IO | Servidor WebSocket |
| **Estado** | In-memory (`Map<roomId, roomState>`) | Estado compartido de dibujo |
| **Logging** | Pino (structured logging) | Observabilidad |
| **Deploy** | Vercel (frontend) + Render (backend) | Hosting |

## Architecture

```
        ┌─────────────────────┐
        │     Frontend        │
        │  Next.js + SocketIO │
        │  (App Router)       │
        └────────┬────────────┘
                 │  WebSocket
                 │  (Socket.IO)
                 ▼
        ┌─────────────────────┐
        │     Backend         │
        │ Node + Socket.IO    │
        │ roomsStore (Map)    │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │   Clients en        │
        │   tiempo real       │
        └─────────────────────┘
```

### Room State (in-memory)

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

interface User {
  socketId: string;
  userId: string;
  displayName?: string;
  joinedAt: number;
}

interface RoomState {
  id: string;
  strokes: Stroke[];
  users: User[];
  createdAt: number;
  lastActivityAt: number;
}
```

### Arquitectura del Backend

El backend sigue una **arquitectura en capas** que separa:

1. **Capa de Transporte** (`sockets/connectionHandler.ts`): Maneja eventos de Socket.IO, validación de payloads, rate limiting
2. **Capa de Lógica de Negocio** (`rooms/roomsService.ts`): Operaciones de dominio (join, leave, add stroke, clear, etc.)
3. **Capa de Datos** (`rooms/roomsStore.ts`): Almacenamiento in-memory con `Map<string, RoomState>`

**Beneficios:**
- Fácil de testear (lógica separada de I/O)
- Fácil de extender (cambiar transporte sin tocar lógica)
- Separación clara de responsabilidades
- Código mantenible y escalable

**Nota sobre escalabilidad:** El servidor mantiene el estado de las rooms en memoria mediante un `Map`, encapsulado en `roomsStore`. En una versión productiva, este estado se movería a Redis para permitir múltiples instancias del backend (ver sección "Escalabilidad" más abajo).

### Estructura de Carpetas

#### Frontend
```
frontend/
├── app/                    # Páginas y layouts (Server Components)
│   ├── page.tsx            # Home page
│   ├── room/
│   │   └── [roomId]/
│   │       ├── page.tsx    # Room page (Server Component)
│   │       ├── loading.tsx # Loading state
│   │       └── error.tsx   # Error boundary
├── components/             # Componentes reutilizables
│   ├── Canvas.tsx          # Canvas de dibujo
│   ├── Toolbar.tsx         # Barra de herramientas
│   ├── RoomClient.tsx      # Cliente de sala (Client Component)
│   ├── HomeClient.tsx      # Cliente de home
│   ├── UsersList.tsx       # Lista de usuarios
│   ├── CursorIndicator.tsx # Indicador de cursor
│   └── NicknameModal.tsx   # Modal de nickname
├── hooks/                  # Custom hooks
│   ├── useRoomSocket.ts    # Hook para Socket.IO
│   └── useStrokesState.ts  # Hook para estado de strokes
├── lib/                    # Utilidades y constantes
│   ├── config.ts           # Configuración (env vars)
│   ├── constants.ts        # Constantes y helpers
│   ├── socket.ts           # Cliente Socket.IO
│   ├── throttle.ts         # Utilidades de throttling
│   └── smoothPath.ts       # Algoritmo de smoothing
└── types/                  # Tipos TypeScript compartidos
    ├── index.ts            # Tipos de dominio
    ├── clientToServerTypes.ts
    └── serverToClientTypes.ts
```

#### Backend
```
backend/
├── src/
│   ├── server.ts                    # Entry point: HTTP server + Socket.IO
│   ├── config.ts                    # Constantes de configuración
│   ├── logger.ts                    # Configuración de Pino
│   ├── rooms/
│   │   ├── types.ts                 # Domain types (Point, Stroke, RoomState)
│   │   ├── roomsStore.ts            # Data layer: in-memory Map operations
│   │   └── roomsService.ts          # Business logic layer
│   └── sockets/
│       ├── clientToServerTypes.ts   # Tipos de payloads cliente→servidor
│       ├── serverToClientTypes.ts   # Tipos de payloads servidor→cliente
│       ├── validators.ts            # Validación de payloads
│       ├── connectionHandler.ts      # Socket.IO event handlers
│       └── middleware/
│           └── rateLimiter.ts       # Rate limiting por socket
```

## 🔌 Real-time Protocol

### Eventos Cliente → Servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room:join` | `{ roomId: string, userId: string, displayName?: string }` | Unirse a una sala |
| `stroke:start` | `{ roomId: string, strokeId: string, userId: string, color: string, thickness: number, startPoint: Point }` | Iniciar un nuevo stroke |
| `stroke:update` | `{ roomId: string, strokeId: string, points: Point[] }` | Actualizar stroke con nuevos puntos (batched) |
| `stroke:end` | `{ roomId: string, strokeId: string }` | Finalizar un stroke |
| `canvas:clear` | `{ roomId: string, userId?: string }` | Limpiar el canvas |
| `strokes:delete:user` | `{ roomId: string, userId: string }` | Borrar todos los trazos del usuario |
| `cursor:move` | `{ roomId: string, userId: string, displayName?: string, position: Point, color: string }` | Mover cursor (throttled) |

### Eventos Servidor → Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room:state` | `{ roomId: string, strokes: Stroke[], users: User[] }` | Estado completo de la sala (al unirse) |
| `stroke:started` | `{ strokeId: string, userId: string, color: string, thickness: number, startPoint: Point }` | Nuevo stroke iniciado por otro usuario |
| `stroke:updated` | `{ strokeId: string, points: Point[] }` | Stroke actualizado con nuevos puntos |
| `stroke:ended` | `{ strokeId: string }` | Stroke finalizado |
| `canvas:cleared` | `{ roomId: string, clearedBy?: string }` | Canvas limpiado |
| `strokes:deleted:user` | `{ roomId: string, userId: string }` | Trazos de un usuario eliminados |
| `user:joined` | `{ userId: string, displayName?: string }` | Usuario se unió a la sala |
| `user:left` | `{ userId: string }` | Usuario se desconectó |
| `cursor:move` | `{ userId: string, displayName?: string, position: Point, color: string }` | Cursor de otro usuario movido |
| `error` | `{ message: string, code?: string }` | Error en operación |

## Key Design Decisions

### ¿Por qué Next.js (frontend)?

- **App Router** simplifica el routing (`/room/[id]`) y el deploy
- **Separación Server/Client Components**:
  - `page.tsx` (Server Component) → `RoomClient` (Client Component)
  - Mejor performance y SEO
- **Hooks para separación de lógica**: `useRoomSocket`, `useStrokesState`
- **Deploy perfecto en Vercel**

### ¿Por qué Socket.IO (tiempo real)?

- **Auto-reconexión** y manejo de rooms integrado
- **Fallback a polling** si WebSocket no está disponible
- **Broadcasting eficiente** a todos los clientes de una room

### ¿Por qué in-memory store?

- **Simplicidad** para un demo pequeño (sin setup de DB)
- **Baja latencia** para dibujo en tiempo real

### ¿Por qué coordenadas normalizadas (0-1)?

- **Independencia del tamaño del canvas**: El canvas puede redimensionarse sin perder datos
- **Consistencia entre clientes**: Diferentes resoluciones de pantalla no afectan el dibujo
- **Menor tamaño de payload**: Números más pequeños = menos bytes en la red

### Performance Optimizations

1. **Batching de stroke updates**: Los puntos se acumulan y se envían en batches (cada 16ms o 10 puntos) para reducir tráfico de red
2. **Throttling de cursor moves**: Los movimientos de cursor se limitan a 20 por segundo
3. **`requestAnimationFrame` para renderizado**: El canvas se redibuja sincronizado con el refresh rate del navegador
4. **Reconexión automática**: Socket.IO se reconecta infinitamente y re-une automáticamente a la sala
5. **Path smoothing**: Curvas cuadráticas para trazos libres más suaves (solo en freehand, no en formas)

## Running Locally

### Prerrequisitos

- Node.js 18+ y npm

### Setup

```bash
# Clonar el repositorio
git clone https://github.com/chiara-ciriani/collab-paint.git
cd collab-paint

# Frontend
cd frontend
npm install
npm run dev
# -> http://localhost:3000

# Backend (en otra terminal)
cd ../backend
npm install
npm run dev
# -> http://localhost:3001
```

### Variables de Entorno

#### Frontend (`frontend/.env.local`)

```env
# URL del backend para conexiones WebSocket
# Por defecto: http://localhost:3001 (desarrollo local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Tiempo en milisegundos antes de ocultar el cursor de otros usuarios por inactividad
# Por defecto: 2000 (2 segundos)
NEXT_PUBLIC_CURSOR_TIMEOUT_MS=2000
```

#### Backend (`backend/.env`)

```env
# Puerto del servidor
PORT=3001

# URL del frontend para CORS
FRONTEND_URL=http://localhost:3000
```

## Testing

### Unit Tests

Tests unitarios para lógica que no depende de Socket.IO:

**Backend:**
- `roomsStore.test.ts` → agregar/remover strokes y usuarios (28 tests)
- `validators.test.ts` → validación de payloads (24 tests)

**Frontend:**
- `useStrokesState.test.tsx` → hook de estado de strokes (17 tests)

### Ejecutar Tests

**Backend:**
```bash
cd backend
npm test          # Modo watch (se re-ejecuta al cambiar archivos)
npm run test:run  # Ejecución única
npm run test:ui   # Interfaz visual de Vitest
```

**Frontend:**
```bash
cd frontend
npm test          # Modo watch
npm run test:run  # Ejecución única
npm run test:ui   # Interfaz visual de Vitest
```

**Total:** 69 tests unitarios cubriendo la lógica de dominio y validación.

## Security & Validation

### CORS

- CORS restringido a `FRONTEND_URL` (configurado en Socket.IO)

### Room IDs

- Generados con `nanoid`
- Longitud configurable (por defecto 7 caracteres)

### Validación de Payloads

- Validación robusta en `validators.ts`

### Rate Limiting

- Rate limiting por socket para prevenir spam:
  - `stroke:update`: 60 eventos/segundo
  - `cursor:move`: 20 eventos/segundo
  - `stroke:start/end`: 10 eventos/segundo
  - `canvas:clear`: 2 eventos/5 segundos
  - `strokes:delete:user`: 5 eventos/segundo

### Límite de Tamaño de Payload

- `maxHttpBufferSize`: 100KB (configurado en Socket.IO)
- Validación adicional en `validators.ts` para arrays de puntos grandes

### Logging Estructurado

- Uso de **Pino** para logs estructurados con contexto:
  - `roomId`, `userId`, `strokeId`, `eventName`, `pointsCount`
  - Facilita debugging y observabilidad

### Graceful Shutdown

- Manejo de `SIGTERM` y `SIGINT`:
  - Dejar de aceptar conexiones
  - Cerrar servidor limpiamente
  - Limpiar timers y recursos

### Health Checks

- `GET /health`: Health check básico
- `GET /ready`: Readiness check

## Escalabilidad: Cómo escalar a Redis/Adapter

### Estado Actual (In-memory)

El servidor mantiene el estado en memoria usando un `Map<string, RoomState>`. Esto funciona perfectamente para:
- Una sola instancia del backend
- Demos y prototipos
- Baja latencia

### Escalando a Múltiples Instancias

Para escalar horizontalmente:

#### 1. Socket.IO Redis Adapter

**Beneficios:**
- Múltiples instancias del backend pueden compartir eventos
- Un cliente conectado a la instancia A puede recibir eventos de la instancia B

#### 2. Redis para Estado de Rooms

**Beneficios:**
- Estado compartido entre instancias
- Persistencia opcional
- TTL automático para limpiar rooms inactivas

#### 3. Opcional: Base de Datos para Persistencia

Para guardar dibujos permanentemente.

### Arquitectura Escalada

```
        ┌─────────────┐
        │   Frontend  │
        │   (Vercel)  │
        └──────┬──────┘
               │
    ┌──────────▼──────────────┐
    │      Load Balancer      │
    └──────────┬──────────────┘
               │
    ┌──────────┴───────────┐
    │                      │
┌───▼────┐          ┌──────▼──┐
│ Backend│          │ Backend │
│   A    │          │   B     │
└───┬────┘          └─────┬───┘
    │                     │
    └──────────┬──────────┘
               │
        ┌──────▼──────┐
        │    Redis    │
        │  (Adapter + │
        │   State)    │
        └─────────────┘
```

## Future Improvements

| Área | Idea |
|------|------|
| **Persistencia** | Guardar dibujos en Redis/Postgres |
| **Escalabilidad** | Socket.IO Redis Adapter para multi-instancia |
| **Undo/Redo** | Stack de acciones por usuario |
| **Mobile** | Soporte completo para touch |
| **Moderación** | Owner de room puede kickear/bloquear "clear" |
| **Autenticación** | Login básico |
| **Export** | Más formatos (SVG, PDF) |
| **Herramientas** | Texto, más formas, filtros |

## Known Limitations

- **Estado perdido si el backend se reinicia**: Sin persistencia, todas las rooms se pierden
- **Sin autenticación**: Cualquiera puede unirse a cualquier room con el ID
- **Una sola instancia del backend**: No escalable horizontalmente sin Redis
- **Sin límite de usuarios por room**: Teóricamente ilimitado, pero puede degradar performance

## Prácticas Aplicadas

### Frontend

- **Server Components por defecto**: Las páginas son Server Components que renderizan Client Components solo donde es necesario
- **Custom Hooks**: Lógica de estado extraída a hooks reutilizables (`useStrokesState`, `useRoomSocket`)
- **Separación de responsabilidades**: Constantes, utilidades y configuración en `lib/`
- **Metadata y SEO**: Metadata configurada en todas las páginas
- **Manejo de errores**: Páginas `error.tsx` y `loading.tsx` para mejor UX
- **Variables de entorno**: Configuración centralizada en `lib/config.ts`
- **Cleanup de efectos**: Desconexión de socket y remoción de listeners en cleanup
- **Performance**: Batching, throttling, `requestAnimationFrame`

### Backend

- **Arquitectura en capas**: Separación entre transporte, lógica de negocio y datos
- **Validación de payloads**: Validación robusta con funciones dedicadas
- **Ciclo de vida de conexiones**: Manejo correcto de disconnect y limpieza
- **Seguridad básica**: CORS configurado, límite de tamaño de payload, rate limiting
- **Logging estructurado**: Pino con contexto (roomId, userId, etc.)
- **Graceful shutdown**: Manejo de señales para cierre limpio
- **Health checks**: Endpoints `/health` y `/ready`
- **Limpieza de rooms**: TTL para eliminar rooms inactivas
- **Error handling**: Try/catch en handlers, emisión de errores al cliente
