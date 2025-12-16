import getStroke from 'perfect-freehand';

/**
 * Opções padrão para perfect-freehand
 * Essas configurações fazem o rabisco parecer com caneta real
 */
export const DEFAULT_STROKE_OPTIONS = {
  size: 4, // Tamanho base da linha
  thinning: 0.5, // Quanto a linha afina (0.5 = meio termo)
  smoothing: 0.5, // Suavização do traço
  streamline: 0.5, // Suavização do movimento
  easing: (t) => t, // Função de easing
  start: {
    taper: 0, // Afinamento no início (0 = sem afinar)
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 0, // Afinamento no fim (0 = sem afinar)
    easing: (t) => t,
    cap: true,
  },
  simulatePressure: true, // Simular pressão (importante para toque)
  last: true, // Incluir último ponto
};

/**
 * Gerar opções de stroke personalizadas
 */
export function getStrokeOptions({ size = 4, pressure = true } = {}) {
  return {
    ...DEFAULT_STROKE_OPTIONS,
    size,
    simulatePressure: pressure,
  };
}

/**
 * Converte pontos [x, y, pressure] em path SVG usando perfect-freehand
 * @param {Array} points - Array de pontos [[x, y, pressure], ...]
 * @param {Object} options - Opções do stroke
 * @returns {string} - Path SVG (d attribute)
 */
export function pointsToPath(points, options = DEFAULT_STROKE_OPTIONS) {
  // perfect-freehand retorna array de pontos que formam o contorno do traço
  const stroke = getStroke(points, options);

  if (stroke.length === 0) return '';

  // Converter pontos em path SVG
  const path = stroke.reduce(
    (acc, [x, y], i, arr) => {
      if (i === 0) {
        // Primeiro ponto: Move to
        return `M ${x},${y}`;
      } else if (i === arr.length - 1) {
        // Último ponto: Close path
        return `${acc} L ${x},${y} Z`;
      } else {
        // Pontos intermediários: Line to
        return `${acc} L ${x},${y}`;
      }
    },
    ''
  );

  return path;
}

/**
 * Converte path SVG em array de pontos 2D para Konva
 * @param {string} pathData - Path SVG (d attribute)
 * @returns {Array} - Flat array [x1, y1, x2, y2, ...]
 */
export function pathToKonvaPoints(pathData) {
  const points = [];
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];

  commands.forEach((cmd) => {
    const type = cmd[0];
    const coords = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    if (type === 'M' || type === 'L') {
      points.push(coords[0], coords[1]);
    }
  });

  return points;
}

/**
 * Converte eventos de pointer em pontos para perfect-freehand
 * @param {PointerEvent} event
 * @param {Object} offset - Offset do canvas {x, y}
 * @param {number} scale - Escala do canvas (zoom)
 * @returns {Array} - [x, y, pressure]
 */
export function eventToPoint(event, offset = { x: 0, y: 0 }, scale = 1) {
  const x = (event.clientX - offset.x) / scale;
  const y = (event.clientY - offset.y) / scale;
  const pressure = event.pressure || 0.5; // Fallback para 0.5 se não tiver pressão

  return [x, y, pressure];
}
