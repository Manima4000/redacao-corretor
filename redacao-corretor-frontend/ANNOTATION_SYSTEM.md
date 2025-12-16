# 🎨 Sistema de Anotações - Arquitetura

## 📚 Tecnologias

- **React + Vite** - Framework
- **React Konva** - Canvas interativo com zoom/pan
- **perfect-freehand** - Algoritmo para rabiscos realistas com simulação de pressão
- **PointerEvent API** - Detecção de caneta vs dedo

---

## 🎯 Features Implementadas

### ✅ 1. Detecção de Caneta vs Dedo (`useStylus`)

**Como funciona:**
- `PointerEvent.pointerType` retorna:
  - `'pen'` = Stylus/Caneta de iPad
  - `'touch'` = Dedo
  - `'mouse'` = Mouse (fallback para desktop)

**Comportamento:**
- **Caneta (pen)** → Desenha anotação
- **Dedo (touch)** → Move a imagem (pan)
- **Mouse** → Desenha (para testar no desktop)

### ✅ 2. Zoom e Pan (`useCanvasZoom`)

**Features:**
- Zoom in/out com botões (+/-)
- Pinch zoom (dois dedos no iPad)
- Pan (arrastar com dedo quando em zoom)
- Limites de zoom (0.5x a 4x)
- Reset zoom (volta para 1x centralizado)

**Comportamento:**
- Se `scale === 1` → Não permite pan
- Se `scale > 1` → Permite pan com dedo

### ✅ 3. Rabiscos Realistas (`perfect-freehand`)

**Como funciona:**
- Captura pontos `[x, y, pressure]` durante o desenho
- `perfect-freehand` transforma pontos em contorno suave
- Simula variação de pressão da caneta
- Resultado: rabisco parece natural, como caneta real

**Opções configuráveis:**
```javascript
{
  size: 4,                 // Tamanho base
  thinning: 0.5,          // Afinamento (0-1)
  smoothing: 0.5,         // Suavização
  simulatePressure: true, // Simular pressão (para touch)
}
```

---

## 📁 Estrutura de Arquivos

```
src/features/annotations/
├── hooks/
│   ├── useStylus.js          # Detecta caneta vs dedo
│   ├── useCanvasZoom.js      # Zoom e pan
│   └── useAnnotations.js     # Estado das anotações (TODO)
├── components/
│   ├── AnnotationCanvas.jsx  # Canvas principal Konva (TODO)
│   ├── AnnotationToolbar.jsx # Ferramentas (cores, borracha) (TODO)
│   └── EssayViewer.jsx       # Visualizador de redação (TODO)
└── utils/
    ├── freehandHelper.js     # Integração perfect-freehand
    └── annotationSerializer.js # Serializar para JSON (TODO)
```

---

## 🔄 Fluxo de Anotação

### 1. Usuário desenha com caneta

```
1. onPointerDown (caneta detectada)
   ↓
2. useStylus.handlePointerDown() → retorna true (deve desenhar)
   ↓
3. Captura ponto [x, y, pressure]
   ↓
4. onPointerMove (continua desenhando)
   ↓
5. Acumula pontos: [[x1,y1,p1], [x2,y2,p2], ...]
   ↓
6. perfect-freehand.getStroke() → gera contorno suave
   ↓
7. Renderiza no canvas Konva
   ↓
8. onPointerUp → finaliza linha
   ↓
9. Adiciona ao histórico de anotações
```

### 2. Usuário move com dedo

```
1. onPointerDown (dedo detectado)
   ↓
2. useStylus.handlePointerDown() → retorna false (não desenha)
   ↓
3. useCanvasZoom.handlePanStart()
   ↓
4. onPointerMove (dedo arrastando)
   ↓
5. useCanvasZoom.handlePanMove() → atualiza position
   ↓
6. Canvas move junto (pan)
   ↓
7. onPointerUp → finaliza pan
```

---

## 🎨 Próximos Passos

1. **useAnnotations hook** - Gerenciar estado das linhas
2. **AnnotationCanvas component** - Implementar canvas Konva
3. **AnnotationToolbar component** - Botões de cores, borracha, undo
4. **Serialização JSON** - Salvar anotações no backend
5. **Auto-save** - Salvar a cada 5 segundos
6. **Integração com API** - GET/POST anotações

---

## 🧪 Como Testar

### No iPad/Tablet:
1. Use **Apple Pencil** ou **Stylus** → Desenha
2. Use **dedo** → Move a imagem (quando em zoom)

### No Desktop (mouse):
1. Use **mouse** → Desenha (simula caneta)
2. Use **scroll wheel** → Zoom (futuro)

---

## 💾 Formato de Dados (JSON)

As anotações serão salvas no backend como:

```json
{
  "essayId": "uuid",
  "pageNumber": 1,
  "annotationData": {
    "lines": [
      {
        "id": "uuid",
        "points": [[x1, y1, p1], [x2, y2, p2], ...],
        "color": "#FF0000",
        "size": 4,
        "tool": "pen"
      }
    ],
    "version": "1.0"
  }
}
```

---

## 🎯 Diferencial do Sistema

✅ **Caneta desenha, dedo move** - UX perfeita para iPad
✅ **Rabiscos realistas** - perfect-freehand com simulação de pressão
✅ **Zoom suave** - Pinch zoom + pan
✅ **Performance** - Canvas otimizado com Konva
✅ **Persistência** - Auto-save + serialização JSON
