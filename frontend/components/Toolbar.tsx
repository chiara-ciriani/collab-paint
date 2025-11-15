"use client";

import { PRESET_COLORS, MIN_THICKNESS, MAX_THICKNESS, SHAPE_TYPES } from "@/lib/constants";
import type { DrawingMode, ShapeType } from "@/types";

interface ToolbarProps {
  currentColor: string;
  currentThickness: number;
  drawingMode: DrawingMode;
  shapeType?: ShapeType;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onShapeTypeChange?: (shapeType: ShapeType) => void;
  onClear: () => void;
  onDeleteMyStrokes?: () => void;
  onExport?: () => void;
}

export default function Toolbar({
  currentColor,
  currentThickness,
  drawingMode,
  shapeType = "circle",
  onColorChange,
  onThicknessChange,
  onDrawingModeChange,
  onShapeTypeChange,
  onClear,
  onDeleteMyStrokes,
  onExport,
}: ToolbarProps) {

  return (
      <nav
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 bg-white/90 backdrop-blur-sm border-b-2 border-purple-200/50 shadow-md overflow-x-auto sm:overflow-x-visible"
        aria-label="Herramientas de dibujo"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto order-1 flex-shrink-0">
          <label htmlFor="color-presets" className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">
            Color:
          </label>
          <div className="flex gap-1.5 sm:gap-2" role="group" aria-label="Colores predefinidos">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 transition-all shadow-md hover:scale-110 active:scale-95 ${
                  currentColor === color
                    ? "border-gray-900 scale-110 ring-2 ring-purple-400"
                    : "border-gray-300 hover:border-gray-500"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Seleccionar color ${color}`}
                aria-pressed={currentColor === color}
              />
            ))}
          </div>
          <div className="relative">
            <label htmlFor="color-picker" className="sr-only">
              Selector de color personalizado
            </label>
            <input
              id="color-picker"
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-10 h-8 sm:w-12 sm:h-10 rounded-xl border-2 border-gray-300 cursor-pointer shadow-md hover:scale-110 transition-transform"
              aria-label="Selector de color personalizado"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 w-full sm:w-auto order-2 flex-shrink-0">
          <label className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">
            Modo:
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => onDrawingModeChange("freehand")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                drawingMode === "freehand"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Modo dibujo libre"
              aria-pressed={drawingMode === "freehand"}
            >
              ✏️ Libre
            </button>
            <button
              onClick={() => onDrawingModeChange("shape")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                drawingMode === "shape"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Modo formas"
              aria-pressed={drawingMode === "shape"}
            >
              ⬜ Formas
            </button>
          </div>
        </div>

        {drawingMode === "shape" && onShapeTypeChange && (
          <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 w-full sm:w-auto order-2 flex-shrink-0">
            <label className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">
              Forma:
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              {SHAPE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onShapeTypeChange(type)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    shapeType === type
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label={`Forma ${type}`}
                  aria-pressed={shapeType === type}
                >
                  {type === "circle" && "⭕"}
                  {type === "rectangle" && "⬜"}
                  {type === "line" && "📏"}
                  {type === "triangle" && "🔺"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-2 rounded-xl border-2 border-gray-200 w-full sm:w-auto order-2 flex-shrink-0">
          <label htmlFor="thickness-slider" className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">
            Grosor:
          </label>
          <input
            id="thickness-slider"
            type="range"
            min={MIN_THICKNESS}
            max={MAX_THICKNESS}
            value={currentThickness}
            onChange={(e) => onThicknessChange(Number(e.target.value))}
            className="w-24 sm:w-32 accent-purple-600 flex-1 sm:flex-none"
            aria-label={`Grosor del pincel: ${currentThickness} píxeles`}
            aria-valuemin={MIN_THICKNESS}
            aria-valuemax={MAX_THICKNESS}
            aria-valuenow={currentThickness}
          />
          <span className="text-xs sm:text-sm font-semibold text-gray-700 w-8 sm:w-10 text-center bg-white px-1.5 sm:px-2 py-1 rounded-lg border border-gray-200 flex-shrink-0">
            {currentThickness}px
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto order-3 flex-shrink-0">
          {onExport && (
            <button
              onClick={onExport}
              className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm md:text-base hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 whitespace-nowrap"
              aria-label="Exportar dibujo como imagen"
            >
              💾 Exportar
            </button>
          )}
          {onDeleteMyStrokes && (
            <button
              onClick={onDeleteMyStrokes}
              className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-xs sm:text-sm md:text-base hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 whitespace-nowrap"
              aria-label="Borrar mis trazos"
            >
              🧹 Borrar mis trazos
            </button>
          )}
          <button
            onClick={onClear}
            className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold text-xs sm:text-sm md:text-base hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 whitespace-nowrap"
            aria-label="Limpiar el lienzo"
          >
            🗑️ Limpiar todo
          </button>
        </div>
      </nav>
  );
}

