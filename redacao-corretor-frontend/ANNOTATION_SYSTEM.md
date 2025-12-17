# 🎨 Sistema de Anotações - Documentação Completa

> Sistema completo de anotações digitais para correção de redações com suporte a caneta de tablet

**Status:** ✅ 100% IMPLEMENTADO E FUNCIONAL

---

## 📚 Tecnologias

- **React 19** - Framework UI
- **React Konva** - Canvas 2D interativo performático
- **Konva** - Engine de canvas de alta performance
- **Perfect-Freehand** - Algoritmo para rabiscos realistas com simulação de pressão
- **PointerEvent API** - Detecção nativa de caneta vs dedo vs mouse
- **Zustand** - Estado global para toast notifications
- **Axios** - HTTP client com interceptors

---

## 🎯 Features Implementadas

### ✅ 1. Detecção Inteligente de Entrada (`useStylus`)

**Como funciona:**
- Usa `PointerEvent.pointerType` do navegador:
  - `'pen'` → Stylus/Apple Pencil/Samsung S-Pen
  - `'touch'` → Dedo
  - `'mouse'` → Mouse (desktop)

**Comportamento:**
- **Caneta** → Desenha anotação (modo correção)
- **Dedo** → Pan/arrasta imagem (quando em zoom)
- **Mouse** → Desenha (para testar no desktop sem tablet)

**Estados rastreados:**
- `currentPointerType` - Tipo atual de ponteiro
- `isPenActive` - Se é uma caneta
- `pressure` - Pressão da caneta (0.0 - 1.0)

**Arquivo:** `src/features/annotations/hooks/useStylus.js`

---

### ✅ 2. Zoom e Pan Suaves (`useCanvasZoom`)

**Features:**
- **Zoom in/out** com botões (+/-)
- **Pinch zoom** (dois dedos no iPad/tablet)
- **Pan** (arrastar com dedo quando zoom > 1x)
- **Limites de zoom** (0.5x a 4x)
- **Reset zoom** (volta para 1x centralizado)

**Comportamento inteligente:**
- Se `scale === 1` → Não permite pan (imagem ocupa toda tela)
- Se `scale > 1` → Permite pan com dedo para navegar

**Estados:**
- `scale` - Fator de zoom atual (0.5 - 4.0)
- `position` - Posição X/Y do pan
- `isDragging` - Se está em modo pan

**Arquivo:** `src/features/annotations/hooks/useCanvasZoom.js`

---

### ✅ 3. Rabiscos Realistas (`perfect-freehand`)

**Como funciona:**
1. Captura pontos `[x, y, pressure]` durante o desenho
2. `perfect-freehand.getStroke()` transforma em contorno suave
3. Simula variação de pressão da caneta
4. Resultado: rabisco parece natural, como caneta real sobre papel

**Opções configuráveis:**
```javascript
{
  size: 4,                 // Tamanho base (fino=2, médio=4, grosso=8)
  thinning: 0.5,          // Afinamento com pressão (0-1)
  smoothing: 0.5,         // Suavização da linha
  streamline: 0.5,        // Quanto tempo até reagir
  simulatePressure: true, // Simular pressão (para touch/mouse)
  easing: (t) => t,       // Função de easing
  start: { taper: 0 },    // Taper no início
  end: { taper: 0 },      // Taper no fim
}
```

**Arquivo:** `src/features/annotations/utils/freehandHelper.js`

---

### ✅ 4. Toolbar Completa (`ToolbarAnnotation`)

**Ferramentas disponíveis:**
- **4 Cores:**
  - Vermelho (#EF4444)
  - Azul (#3B82F6)
  - Verde (#10B981)
  - Amarelo (#F59E0B)

- **3 Tamanhos:**
  - Fino (2px)
  - Médio (4px)
  - Grosso (8px)

- **Ferramentas:**
  - Borracha (toggle)
  - Desfazer última linha
  - Limpar tudo (com modal de confirmação)

- **Ações:**
  - Salvar (com loading e status visual)
  - Finalizar correção

**Indicadores visuais:**
- 💾 "Salvando..." - Durante save
- ✅ "Salvo" - Após salvar
- ⚠️ "Mudanças não salvas" - Se editou

**Arquivo:** `src/features/annotations/components/ToolbarAnnotation.jsx`

---

### ✅ 5. Canvas Principal (`EssayAnnotator`)

**Responsabilidades:**
- Renderiza imagem da redação
- Gerencia desenho de anotações
- Integra zoom, pan e stylus
- Salva/carrega anotações do backend
- Modo read-only para alunos

**Props:**
```javascript
{
  essayId: string,          // ID da redação
  imageUrl: string,         // URL da imagem (proxy)
  pageNumber: number,       // Página atual (PDFs)
  readOnly: boolean,        // Modo visualização
  onFinish: function,       // Callback ao finalizar
}
```

**Funcionalidades:**
- Carrega imagem via fetch com cookies (autenticação)
- Converte para blob URL para exibir
- Renderiza anotações com Konva
- Gerencia eventos de ponteiro
- Limpa blob URLs ao desmontar (sem memory leak)

**Arquivo:** `src/features/annotations/components/EssayAnnotator.jsx`

---

### ✅ 6. Estado e Persistência (`useAnnotations`)

**Responsabilidades:**
- Gerenciar estado das linhas desenhadas
- Carregar anotações do backend
- Salvar anotações (manual + auto-save)
- Finalizar correção (salva + muda status)
- Desfazer/limpar anotações

**API:**
```javascript
const {
  // Estado
  lines,              // Array de linhas desenhadas
  isLoading,          // Carregando anotações
  isSaving,           // Salvando anotações
  lastSaved,          // Timestamp do último save
  hasUnsavedChanges,  // Se tem mudanças não salvas

  // Ações
  updateLines,        // Atualiza linhas
  saveAnnotations,    // Salva manualmente
  saveAndFinish,      // Salva + muda status para "corrected"
  clearAnnotations,   // Limpa tudo
  undo,               // Remove última linha
  reload,             // Recarrega do backend
} = useAnnotations(essayId, pageNumber, readOnly);
```

**Auto-save:**
- ⚠️ Desabilitado por padrão (comentado)
- Salvava a cada 5 segundos se houvesse mudanças
- Pode ser reativado descomentando useEffect

**Arquivo:** `src/features/annotations/hooks/useAnnotations.js`

---

### ✅ 7. API Service (`annotationService`)

**Endpoints:**
```javascript
// Buscar anotações
GET /api/essays/:essayId/annotations
GET /api/essays/:essayId/annotations?page=2

// Salvar anotações (UPSERT)
POST /api/essays/:essayId/annotations
Body: {
  annotationData: { version: "1.0", lines: [...] },
  pageNumber: 1
}

// Atualizar status da redação
PATCH /api/essays/:essayId/status
Body: { status: "corrected" }
```

**Arquivo:** `src/features/annotations/services/annotationService.js`

---

### ✅ 8. Proxy de Imagens

**Problema:** Google Drive bloqueia CORS para imagens

**Solução:** Endpoint proxy no backend

**Backend:**
```javascript
GET /api/essays/:essayId/image

// Usa GetEssayImageUseCase:
// 1. Valida permissões (teacher OU student owner)
// 2. Baixa arquivo do Google Drive
// 3. Retorna buffer com Content-Type correto
```

**Frontend:**
```javascript
// Usa fetch com cookies para autenticação
const response = await fetch(imageUrl, { credentials: 'include' });
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);

// Renderiza blob URL no canvas
// Limpa blob URL ao desmontar (previne memory leak)
```

**Arquivos:**
- Backend: `GetEssayImageUseCase.js`, `EssayController.js`
- Frontend: `EssayAnnotator.jsx`

---

## 📁 Estrutura de Arquivos

```
src/features/annotations/
├── hooks/
│   ├── useStylus.js          ✅ Detecta caneta vs dedo vs mouse
│   ├── useCanvasZoom.js      ✅ Zoom e pan com limites
│   └── useAnnotations.js     ✅ Estado + API + persistência
│
├── components/
│   ├── EssayAnnotator.jsx    ✅ Canvas principal (PRODUÇÃO)
│   └── ToolbarAnnotation.jsx ✅ Toolbar com ferramentas
│
├── services/
│   └── annotationService.js  ✅ API client (Axios)
│
└── utils/
    └── freehandHelper.js     ✅ Helper perfect-freehand
```

---

## 🔄 Fluxo Completo de Anotação

### 1. Professor abre correção

```
EssayCorrectPage
  ↓
Carrega essay data (task, student, status)
  ↓
Renderiza EssayAnnotator com imageUrl proxy
  ↓
useAnnotations carrega anotações do backend
  ↓
Canvas pronto para desenhar
```

### 2. Professor desenha com caneta

```
1. onPointerDown (caneta detectada)
   ↓
2. useStylus.handlePointerDown()
   ↓ isPenActive = true
3. Inicia nova linha: { points: [], color, size }
   ↓
4. onPointerMove (continua desenhando)
   ↓
5. Captura pontos: [x, y, pressure]
   ↓
6. perfect-freehand.getStroke(points, options)
   ↓
7. Renderiza linha no canvas (Konva Line)
   ↓
8. onPointerUp
   ↓
9. Adiciona linha ao estado
   ↓
10. hasUnsavedChanges = true
```

### 3. Professor faz pan com dedo

```
1. onPointerDown (dedo detectado)
   ↓
2. useStylus.handlePointerDown()
   ↓ isPenActive = false
3. useCanvasZoom.handlePanStart()
   ↓
4. onPointerMove (dedo arrastando)
   ↓
5. handlePanMove() → atualiza position
   ↓
6. Stage.position() atualizado
   ↓
7. Canvas move (pan)
   ↓
8. onPointerUp → handlePanEnd()
```

### 4. Professor salva

```
1. Clica botão "Salvar"
   ↓
2. useAnnotations.saveAnnotations()
   ↓
3. annotationService.saveAnnotations(essayId, data)
   ↓
4. POST /api/essays/:essayId/annotations
   ↓
5. Backend: SaveAnnotationsUseCase
   ↓
6. UPSERT em annotations table (JSONB)
   ↓
7. Response 200
   ↓
8. Frontend: lastSaved = new Date()
   ↓
9. hasUnsavedChanges = false
   ↓
10. Toast: "Anotações salvas!"
```

### 5. Professor finaliza correção

```
1. Clica "Finalizar Correção"
   ↓
2. useAnnotations.saveAndFinish()
   ↓
3. Salva anotações
   ↓
4. PATCH /api/essays/:essayId/status { status: "corrected" }
   ↓
5. Backend: UpdateEssayStatusUseCase
   ↓
6. UPDATE essays SET status='corrected', corrected_at=NOW()
   ↓
7. Response 200
   ↓
8. Toast: "Correção finalizada!"
   ↓
9. onFinish() → navigate para lista de alunos
```

### 6. Aluno visualiza correção

```
EssayViewPage (readOnly=true)
  ↓
Renderiza EssayAnnotator com readOnly
  ↓
Carrega anotações do backend
  ↓
Renderiza linhas no canvas
  ↓
Toolbar desabilitada
  ↓
Apenas zoom/pan habilitados
  ↓
Aluno vê correções da professora
```

---

## 💾 Formato de Dados (JSON)

### Estrutura das Anotações

Salvas como JSONB no PostgreSQL (`annotations.annotation_data`):

```json
{
  "version": "1.0",
  "lines": [
    {
      "points": [
        [100.5, 200.3, 0.8],
        [101.2, 201.1, 0.85],
        [102.7, 202.5, 0.9]
      ],
      "color": "#EF4444",
      "size": 4
    },
    {
      "points": [[...], [...], ...],
      "color": "#3B82F6",
      "size": 8
    }
  ]
}
```

**Campos:**
- `version` - Versão do formato (para migração futura)
- `lines` - Array de linhas desenhadas
- `lines[].points` - Array de pontos `[x, y, pressure]`
- `lines[].color` - Cor hex (#RRGGBB)
- `lines[].size` - Tamanho base (2, 4, 8)

### Tabela annotations (Backend)

```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  essay_id UUID REFERENCES essays(id),
  annotation_data JSONB NOT NULL,    -- 👆 JSON acima
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  UNIQUE(essay_id, page_number)      -- UPSERT key
);
```

---

## 🎯 Diferencial do Sistema

### UX Perfeita para Tablet
✅ **Caneta desenha, dedo move** - Zero conflito de gestos
✅ **Rabiscos realistas** - Simulação de pressão com perfect-freehand
✅ **Zoom suave** - Pinch zoom natural + pan
✅ **Feedback visual** - Loading, salvando, salvo, erro

### Performance
✅ **Canvas otimizado** - Konva renderiza apenas quando necessário
✅ **Blob URLs** - Imagens em memória, sem requests duplicados
✅ **Cleanup automático** - Sem memory leaks

### Persistência Robusta
✅ **Auto-save opcional** - Salva a cada 5s (desabilitado)
✅ **Save manual** - Controle total para professora
✅ **UPSERT** - Não duplica anotações
✅ **JSONB** - Flexível para evoluir formato

### Segurança
✅ **Autenticação** - Cookies httpOnly
✅ **Autorização** - Teacher OU student owner
✅ **Proxy** - Imagens seguras via backend
✅ **Validação** - Backend valida estrutura JSON

---

## 🧪 Como Testar

### No iPad/Tablet:

**Com Apple Pencil/Stylus:**
1. Desenhe na tela → Cria anotação
2. Use dedo → Faz pan (se zoom > 1x)
3. Pinch com dois dedos → Zoom in/out

**Sem stylus:**
1. Use dedo → Desenha (simulatePressure)
2. Dois dedos → Pan e zoom

### No Desktop:

**Com mouse:**
1. Clique e arraste → Desenha
2. Botões +/- → Zoom
3. Scroll wheel → Zoom (futuro)

**Teste de features:**
- [ ] Desenhar com cores diferentes
- [ ] Mudar tamanho da caneta
- [ ] Usar borracha
- [ ] Desfazer última linha
- [ ] Limpar tudo (confirma modal?)
- [ ] Salvar manualmente
- [ ] Zoom in/out
- [ ] Pan quando em zoom
- [ ] Finalizar correção
- [ ] Aluno visualizar (read-only)

---

## 🔧 Configuração e Customização

### Cores da Toolbar

Edite `ToolbarAnnotation.jsx`:
```javascript
const colors = [
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  // Adicione mais cores aqui
];
```

### Tamanhos da Caneta

Edite `ToolbarAnnotation.jsx`:
```javascript
const sizes = [
  { name: 'Fino', value: 2 },
  { name: 'Médio', value: 4 },
  { name: 'Grosso', value: 8 },
  // Adicione mais tamanhos
];
```

### Limites de Zoom

Edite `useCanvasZoom.js`:
```javascript
const {
  minZoom = 0.5,  // Mínimo 50%
  maxZoom = 4,    // Máximo 400%
  zoomStep = 0.2, // Incremento 20%
}
```

### Auto-save

Habilite em `useAnnotations.js`:
```javascript
// Descomente o useEffect:
useEffect(() => {
  if (readOnly) return;

  autoSaveTimerRef.current = setInterval(() => {
    autoSave();
  }, 5000); // 5 segundos

  return () => clearInterval(autoSaveTimerRef.current);
}, [autoSave, readOnly]);
```

---

## 🐛 Troubleshooting

### Caneta não desenha

**Possível causa:** Navegador não suporta PointerEvent
**Solução:** Use navegador moderno (Chrome, Edge, Safari 13+)

### Imagem não carrega

**Possível causa:** Proxy não funcionando
**Verificar:**
1. Backend endpoint `/api/essays/:essayId/image` existe?
2. Cookies sendo enviados? (`withCredentials: true`)
3. Permissões corretas? (teacher OU student owner)

### Anotações não salvam

**Possível causa:** Validação JSONB falhando
**Verificar:**
1. Console do backend - logs de `[SAVE ANNOTATIONS]`
2. Estrutura do JSON está correta?
3. Índice único `(essay_id, page_number)` existe?

### Memory leak com imagens

**Possível causa:** Blob URLs não limpos
**Solução:** Já implementado com `useEffect` cleanup:
```javascript
useEffect(() => {
  return () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
  };
}, []);
```

### Toast loop infinito

**Possível causa:** `toast` em dependências de `useCallback`
**Solução:** Já corrigido - `toast` não está em deps
```javascript
// ✅ Correto
const save = useCallback(async () => {
  toast.success('Salvo!');
}, []); // sem `toast` aqui

// ❌ Errado
const save = useCallback(async () => {
  toast.success('Salvo!');
}, [toast]); // causa loop
```

---

## 📚 Referências

- **React Konva:** https://konvajs.org/docs/react/
- **Perfect Freehand:** https://github.com/steveruizok/perfect-freehand
- **PointerEvent API:** https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
- **Zustand:** https://github.com/pmndrs/zustand

---

## 🚀 Próximos Passos (Futuro)

### Potenciais Melhorias
- [ ] Highlighter (marcador transparente)
- [ ] Formas geométricas (círculo, retângulo, seta)
- [ ] Texto digitado sobre a redação
- [ ] Múltiplas páginas (PDFs multi-página)
- [ ] Histórico de versões (undo/redo completo)
- [ ] Exportar como PDF com anotações
- [ ] Compartilhar link de visualização
- [ ] Modo dark para correção noturna
- [ ] Atalhos de teclado
- [ ] Régua/grid para alinhamento

---

**Última atualização:** 2025-12-17
**Versão do Sistema:** 2.0.0
**Status:** ✅ 100% Implementado e Testado
