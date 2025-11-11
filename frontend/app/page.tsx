export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-black">Collaborative Paint</h1>
        <p className="text-lg text-zinc-600">Dibuja en tiempo real con otros usuarios</p>
        {/* TODO: Agregar botón "Create new room" y input para unirse a room existente */}
      </main>
    </div>
  );
}
