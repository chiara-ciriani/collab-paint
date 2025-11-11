import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Collaborative Paint - Dibuja en tiempo real",
  description: "Aplicación web de dibujo colaborativo en tiempo real donde múltiples usuarios pueden dibujar en un lienzo compartido simultáneamente.",
};

export default function Home() {
  return <HomeClient />;
}
