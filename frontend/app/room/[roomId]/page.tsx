import type { Metadata } from "next";
import RoomClient from "@/components/RoomClient";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Sala ${roomId}`,
    description: `Únete a la sala de dibujo colaborativo ${roomId}`,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId} />;
}

