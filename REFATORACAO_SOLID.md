# Plano de Refatoração SOLID - Sistema de Correção de Redações

> Documento criado em: 2025-12-19
>
> Este documento detalha um plano completo de refatoração para desacoplar o código de correção e visualização de redações, seguindo rigorosamente os princípios SOLID.

---

## Índice

1. [Problemas Identificados](#problemas-identificados)
2. [Soluções Propostas](#soluções-propostas)
3. [Arquitetura Refatorada](#arquitetura-refatorada)
4. [Implementação Passo a Passo](#implementação-passo-a-passo)
5. [Checklist de Migração](#checklist-de-migração)

---

## Problemas Identificados

### Backend

#### ❌ Problema 1: Use Cases com Validação de Domínio Inline

**Arquivo:** `SaveAnnotationsUseCase.js`

**Problema:**
- Use case está fazendo validação complexa de estrutura de dados (linhas 110-168)
- Violação de **SRP**: Use case deveria apenas orquestrar, não validar domínio
- Validação não é reutilizável em outros contextos

```javascript
// ❌ RUIM - Validação dentro do Use Case
export class SaveAnnotationsUseCase {
  async execute({ essayId, teacherId, annotationData, pageNumber = 1 }) {
    // ...
    this._validateAnnotationData(annotationData); // ⚠️ Método privado de validação
    // ...
  }

  _validateAnnotationData(data) {
    // 50+ linhas de validação complexa
    // Deveria ser um Domain Service!
  }
}
```

**Impacto:**
- Dificulta testes unitários
- Não reutilizável em outros use cases
- Use case muito grande e com múltiplas responsabilidades

---

#### ❌ Problema 2: Validação de Permissões Espalhada

**Arquivos:** `SaveAnnotationsUseCase.js`, `FinalizeEssayCorrectionUseCase.js`

**Problema:**
- Cada use case valida permissões de forma diferente
- Código duplicado (verificar se é professor, se é dono da turma, etc.)
- Violação de **DRY** (Don't Repeat Yourself)

```javascript
// ❌ RUIM - Validação duplicada em cada use case
export class SaveAnnotationsUseCase {
  async execute({ teacherId, ... }) {
    // Valida se é professor da turma (TODO comentado)
    // Código duplicado em vários use cases
  }
}

export class FinalizeEssayCorrectionUseCase {
  async execute({ userId, userType, ... }) {
    if (userType !== 'teacher') {
      throw new ForbiddenError('Apenas professores...');
    }
    // Mesma validação repetida
  }
}
```

**Impacto:**
- Manutenção difícil (mudar regra exige editar vários arquivos)
- Inconsistências (validações podem divergir)
- Código duplicado

---

#### ❌ Problema 3: Falta de Domain Services

**Problema:**
- Não existem serviços de domínio para lógica complexa
- Use cases ficam inchados com lógica que não é orquestração
- Violação de **SRP**

**Domínios que precisam de services:**
- Validação de anotações (estrutura de dados do Konva)
- Autorização/Permissões (quem pode corrigir qual redação)
- Finalização de correção (regras de nota, status, etc.)

---

### Frontend

#### ❌ Problema 4: EssayCorrectPage com Múltiplas Responsabilidades

**Arquivo:** `EssayCorrectPage.jsx`

**Problema:**
- Gerencia loading state
- Faz chamadas HTTP (via essayService)
- Controla modal de finalização
- Lógica de navegação
- Orquestra componentes
- Violação de **SRP**

```javascript
// ❌ RUIM - Componente fazendo muita coisa
export const EssayCorrectPage = () => {
  // Estado de loading
  const [isLoading, setIsLoading] = useState(true);

  // Chamada HTTP direta
  useEffect(() => {
    const loadEssay = async () => {
      const data = await essayService.getEssayById(essayId); // ⚠️ Acoplado ao service
      setEssay(data);
    };
    loadEssay();
  }, [essayId]);

  // Lógica de finalização
  const handleFinalizeSubmit = async (grade, writtenFeedback) => {
    await essayService.finalizeEssay(essayId, grade, writtenFeedback); // ⚠️ Acoplado
    navigate(`/classes/${essay.task.classId}/tasks/${essay.task.id}`); // ⚠️ Lógica de navegação
  };

  // ... muito mais código
};
```

**Impacto:**
- Difícil de testar
- Difícil de reutilizar partes
- Componente muito grande (195 linhas)

---

#### ❌ Problema 5: EssayAnnotator - Componente Gigante

**Arquivo:** `EssayAnnotator.jsx`

**Problema:**
- **547 linhas** em um único componente
- Múltiplas responsabilidades:
  - Carrega imagem (fetch com credenciais)
  - Gerencia estado de desenho (caneta, borracha, cores, tamanhos)
  - Zoom e pan
  - Renderização de linhas (perfect-freehand)
  - Auto-save
  - Atalhos de teclado
  - Detecção de stylus/pressure
- Violação de **SRP**, **OCP**

```javascript
// ❌ RUIM - Componente monolítico
export const EssayAnnotator = ({ essayId, imageUrl, onFinish }) => {
  // Carregamento de imagem (linhas 80-136)
  useEffect(() => {
    const loadImage = async () => {
      const response = await fetch(imageUrl, { credentials: 'include' }); // ⚠️ Infraestrutura
      // ... 50+ linhas de lógica de carregamento
    };
    loadImage();
  }, [imageUrl]);

  // Desenho (linhas 156-247)
  const handleMouseDown = useCallback((e) => { /* ... */ }, []);
  const handleMouseMove = useCallback((e) => { /* ... */ }, []);
  const handleMouseUp = useCallback((e) => { /* ... */ }, []);

  // Zoom (linhas 478-500)
  // Renderização (linhas 303-343)
  // Stylus (linhas 252-274)
  // Teclado (linhas 279-298)
  // ... muito mais
};
```

**Impacto:**
- Impossível testar partes isoladamente
- Difícil de manter
- Não reutilizável
- Performance (re-renders desnecessários)

---

#### ❌ Problema 6: useAnnotations - Hook com Múltiplas Responsabilidades

**Arquivo:** `useAnnotations.js`

**Problema:**
- Faz chamadas HTTP (via annotationService)
- Gerencia estado de linhas
- Auto-save (comentado mas presente)
- Validação de mudanças
- Atualização de status
- Violação de **SRP**, **DIP**

```javascript
// ❌ RUIM - Hook acoplado ao service concreto
export const useAnnotations = (essayId, pageNumber, readOnly) => {
  const loadAnnotations = useCallback(async () => {
    const data = await annotationService.getAnnotations(essayId, pageNumber); // ⚠️ Dependência concreta
    setLines(data?.annotationData?.lines || []);
  }, [essayId, pageNumber]);

  const saveAnnotations = useCallback(async () => {
    await annotationService.saveAnnotations(essayId, annotationData, pageNumber); // ⚠️ Dependência concreta
  }, [essayId, pageNumber]);

  // Auto-save (mistura responsabilidades)
  // Atualização de status (mistura responsabilidades)
  // ...
};
```

**Impacto:**
- Impossível trocar implementação (mock, cache, etc.)
- Difícil de testar
- Violação de **DIP** (depende de implementação concreta, não abstração)

---

#### ❌ Problema 7: Services Não São Abstrações

**Arquivos:** `essayService.js`, `annotationService.js`

**Problema:**
- Services são implementações concretas (objetos literais com métodos)
- Hooks dependem diretamente deles
- Não há interfaces/abstrações
- Violação de **DIP** (Dependency Inversion Principle)

```javascript
// ❌ RUIM - Service concreto, não abstração
export const essayService = {
  async getEssayById(essayId) {
    const response = await api.get(`/essays/${essayId}`); // ⚠️ Implementação concreta
    return response.data.data;
  },
  // ...
};

// ❌ RUIM - Hook depende de implementação concreta
const useEssay = (essayId) => {
  const loadEssay = async () => {
    const data = await essayService.getEssayById(essayId); // ⚠️ Acoplamento direto
  };
};
```

**Impacto:**
- Impossível mockar em testes
- Impossível trocar implementação (cache, offline, etc.)
- Dificulta testes unitários

---

## Soluções Propostas

### Backend

#### ✅ Solução 1: Criar Domain Services

**Objetivo:** Separar lógica de domínio complexa em serviços reutilizáveis.

**Novos serviços:**

1. **AnnotationValidationService**
   - Responsabilidade: Validar estrutura de anotações
   - Métodos:
     - `validateAnnotationData(data)` - Valida formato Konva
     - `validateLine(line, index)` - Valida linha individual
     - `validatePoint(point, lineIndex, pointIndex)` - Valida ponto

2. **PermissionService**
   - Responsabilidade: Validar permissões de acesso
   - Métodos:
     - `canCorrectEssay(userId, userType, essay)` - Pode corrigir?
     - `canViewEssay(userId, userType, essay)` - Pode visualizar?
     - `isTeacherOfClass(teacherId, classId)` - É professor da turma?

3. **EssayCorrectionService**
   - Responsabilidade: Lógica de finalização de correção
   - Métodos:
     - `finalize(essay, grade, feedback)` - Finaliza correção
     - `validateGrade(grade)` - Valida nota (0-10)
     - `canFinalize(essay)` - Pode finalizar? (verifica estado)

**Estrutura:**

```
src/domain/services/
├── AnnotationValidationService.js
├── PermissionService.js
└── EssayCorrectionService.js
```

---

#### ✅ Solução 2: Refatorar Use Cases

**Objetivo:** Use cases devem apenas **orquestrar** domain services e repositories.

**Exemplo - SaveAnnotationsUseCase refatorado:**

```javascript
// ✅ BOM - Use case orquestra domain services
export class SaveAnnotationsUseCase {
  constructor(
    annotationRepository,
    essayRepository,
    taskRepository,
    annotationValidationService, // ⭐ Domain service
    permissionService // ⭐ Domain service
  ) {
    this.annotationRepository = annotationRepository;
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.annotationValidationService = annotationValidationService;
    this.permissionService = permissionService;
  }

  async execute({ essayId, teacherId, annotationData, pageNumber = 1 }) {
    // 1. Buscar entidades
    const essay = await this.essayRepository.findById(essayId);
    if (!essay) throw new NotFoundError('Redação');

    const task = await this.taskRepository.findById(essay.taskId);
    if (!task) throw new NotFoundError('Tarefa');

    // 2. Validar permissões (via domain service)
    const canCorrect = await this.permissionService.canCorrectEssay(
      teacherId,
      'teacher',
      essay,
      task
    );
    if (!canCorrect) {
      throw new ForbiddenError('Você não pode corrigir esta redação');
    }

    // 3. Validar dados (via domain service)
    this.annotationValidationService.validateAnnotationData(annotationData);

    // 4. Salvar (repository)
    const savedAnnotation = await this.annotationRepository.saveOrUpdate(
      essayId,
      annotationData,
      pageNumber
    );

    // 5. Atualizar status se necessário
    if (essay.status === 'pending') {
      await this.essayRepository.updateStatus(essayId, 'correcting');
    }

    return savedAnnotation;
  }
}
```

**Benefícios:**
- Use case tem **apenas orquestração** (SRP ✅)
- Domain services são **reutilizáveis** (DRY ✅)
- Fácil de testar (mockar domain services)
- Fácil de manter

---

### Frontend

#### ✅ Solução 3: Criar Camada de Repository (Abstração HTTP)

**Objetivo:** Desacoplar componentes/hooks da implementação HTTP.

**Arquitetura:**

```
src/features/essays/
├── repositories/                    # ⭐ NOVA CAMADA
│   ├── IEssayRepository.js          # Interface (abstração)
│   ├── HttpEssayRepository.js       # Implementação com axios
│   └── index.js                     # Exports
├── repositories/
│   ├── IAnnotationRepository.js
│   ├── HttpAnnotationRepository.js
│   └── index.js
└── services/                        # ⚠️ DELETAR OU RENOMEAR
    ├── essayService.js              # Vira HttpEssayRepository
    └── annotationService.js         # Vira HttpAnnotationRepository
```

**Exemplo - Interface:**

```javascript
// IEssayRepository.js
/**
 * Interface de repositório de redações
 * Define o contrato que implementações devem seguir
 */
export class IEssayRepository {
  async getById(essayId) {
    throw new Error('Not implemented');
  }

  async uploadEssay(taskId, file) {
    throw new Error('Not implemented');
  }

  async finalizeEssay(essayId, grade, writtenFeedback) {
    throw new Error('Not implemented');
  }

  async deleteEssay(essayId) {
    throw new Error('Not implemented');
  }
}
```

**Exemplo - Implementação:**

```javascript
// HttpEssayRepository.js
import { IEssayRepository } from './IEssayRepository';
import api from '@/shared/services/api';

/**
 * Implementação de repositório de redações usando HTTP
 */
export class HttpEssayRepository extends IEssayRepository {
  async getById(essayId) {
    const response = await api.get(`/essays/${essayId}`);
    return response.data.data;
  }

  async uploadEssay(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await api.post('/essays/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  }

  async finalizeEssay(essayId, grade, writtenFeedback) {
    const response = await api.put(`/essays/${essayId}/finalize`, {
      grade,
      writtenFeedback,
    });
    return response.data.data;
  }

  async deleteEssay(essayId) {
    await api.delete(`/essays/${essayId}`);
  }
}
```

**Exemplo - Provider (Dependency Injection):**

```javascript
// src/features/essays/repositories/index.js
import { HttpEssayRepository } from './HttpEssayRepository';
import { HttpAnnotationRepository } from './HttpAnnotationRepository';

// Singleton instances (ou usar Context API para DI)
export const essayRepository = new HttpEssayRepository();
export const annotationRepository = new HttpAnnotationRepository();
```

**Benefícios:**
- Hooks dependem de **abstração**, não implementação (DIP ✅)
- Fácil trocar implementação (mock, cache, offline)
- Fácil de testar (injetar mock)
- Segue Clean Architecture

---

#### ✅ Solução 4: Refatorar Hooks para Depender de Abstrações

**Objetivo:** Hooks devem receber repository via parâmetro (Dependency Injection).

**Exemplo - useEssay refatorado:**

```javascript
// useEssay.js
import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar estado de redação
 *
 * @param {string} essayId - ID da redação
 * @param {IEssayRepository} essayRepository - Repositório injetado
 */
export const useEssay = (essayId, essayRepository) => { // ⭐ Recebe abstração
  const [essay, setEssay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadEssay = async () => {
      try {
        setIsLoading(true);
        const data = await essayRepository.getById(essayId); // ⭐ Usa abstração
        setEssay(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar redação:', err);
        setError(err.response?.data?.error || 'Erro ao carregar redação');
        toast.error('Erro ao carregar redação');
      } finally {
        setIsLoading(false);
      }
    };

    if (essayId) {
      loadEssay();
    }
  }, [essayId, essayRepository, toast]);

  return { essay, isLoading, error };
};
```

**Uso no componente:**

```javascript
// EssayCorrectPage.jsx
import { useEssay } from '../hooks/useEssay';
import { essayRepository } from '../repositories'; // ⭐ Import singleton

export const EssayCorrectPage = () => {
  const { essayId } = useParams();
  const { essay, isLoading, error } = useEssay(essayId, essayRepository); // ⭐ Injeta

  // Componente só gerencia UI, sem lógica de fetch
  return (
    <div>
      {isLoading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {essay && <EssayAnnotator essayId={essayId} />}
    </div>
  );
};
```

**Benefícios:**
- Hook **não depende de implementação concreta** (DIP ✅)
- Fácil de testar (passar mock repository)
- Reutilizável com diferentes repositories

---

#### ✅ Solução 5: Quebrar EssayAnnotator em Componentes Menores

**Objetivo:** Dividir componente gigante (547 linhas) em componentes com responsabilidades únicas.

**Arquitetura de componentes:**

```
src/features/annotations/components/
├── EssayAnnotator.jsx               # ⭐ Orquestrador (container)
├── ImageCanvas/                     # ⭐ Gerencia imagem
│   ├── ImageCanvas.jsx              # Carrega e exibe imagem
│   └── useImageLoader.js            # Hook de carregamento
├── AnnotationCanvas/                # ⭐ Gerencia desenho
│   ├── AnnotationCanvas.jsx         # Canvas Konva
│   ├── AnnotationLayer.jsx          # Layer de anotações
│   ├── useDrawing.js                # Hook de desenho
│   └── LineRenderer.jsx             # Renderiza linha (perfect-freehand)
├── ToolbarAnnotation.jsx            # Já existe (OK)
├── ZoomControls/                    # ⭐ Gerencia zoom
│   ├── ZoomControls.jsx             # Botões de zoom
│   └── useZoom.js                   # Hook de zoom (já existe: useCanvasZoom)
└── AnnotationProvider.jsx           # ⭐ Context para estado global
```

**Divisão de responsabilidades:**

| Componente | Responsabilidade | Linhas |
|------------|------------------|--------|
| `EssayAnnotator` | Orquestra componentes filhos | ~100 |
| `ImageCanvas` | Carrega e exibe imagem | ~80 |
| `AnnotationCanvas` | Gerencia Konva Stage + desenho | ~150 |
| `LineRenderer` | Renderiza linha com perfect-freehand | ~50 |
| `ToolbarAnnotation` | Ferramentas (já existe) | ~200 |
| `ZoomControls` | Controles de zoom | ~40 |
| `AnnotationProvider` | Gerencia estado global | ~60 |

**Exemplo - EssayAnnotator refatorado:**

```javascript
// EssayAnnotator.jsx (refatorado)
import { AnnotationProvider } from './AnnotationProvider';
import { ImageCanvas } from './ImageCanvas/ImageCanvas';
import { AnnotationCanvas } from './AnnotationCanvas/AnnotationCanvas';
import { ToolbarAnnotation } from './ToolbarAnnotation';
import { ZoomControls } from './ZoomControls/ZoomControls';

/**
 * Componente orquestrador de anotações
 * Responsabilidade: Apenas compor componentes filhos
 */
export const EssayAnnotator = ({ essayId, imageUrl, onFinish, readOnly = false }) => {
  return (
    <AnnotationProvider essayId={essayId} readOnly={readOnly}>
      <div className="flex flex-col h-full bg-gray-100">
        {/* Toolbar */}
        {!readOnly && <ToolbarAnnotation onFinish={onFinish} />}

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Imagem de fundo */}
          <ImageCanvas imageUrl={imageUrl} />

          {/* Anotações (sobrepostas) */}
          <AnnotationCanvas />

          {/* Controles de zoom */}
          <ZoomControls />
        </div>
      </div>
    </AnnotationProvider>
  );
};
```

**Benefícios:**
- Cada componente tem **uma responsabilidade** (SRP ✅)
- Fácil de testar individualmente
- Reutilizável (ex: ImageCanvas pode ser usado em outro lugar)
- Performance (re-renders isolados)

---

#### ✅ Solução 6: Criar Context para Estado Global (Annotations)

**Objetivo:** Centralizar estado de anotações e evitar prop drilling.

**AnnotationProvider.jsx:**

```javascript
// AnnotationProvider.jsx
import { createContext, useContext, useState } from 'react';
import { useAnnotations } from '../hooks/useAnnotations';
import { annotationRepository } from '../repositories';

const AnnotationContext = createContext(null);

export const AnnotationProvider = ({ essayId, readOnly, children }) => {
  // Estado centralizado (via hook)
  const annotations = useAnnotations(essayId, annotationRepository, readOnly);

  // Estado de ferramentas
  const [color, setColor] = useState('#EF4444');
  const [size, setSize] = useState(4);
  const [currentTool, setCurrentTool] = useState('pen');
  const [isEraser, setIsEraser] = useState(false);

  const value = {
    // Estado de anotações
    ...annotations,

    // Estado de ferramentas
    color,
    setColor,
    size,
    setSize,
    currentTool,
    setCurrentTool,
    isEraser,
    setIsEraser,
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
};

// Hook para consumir context
export const useAnnotationContext = () => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotationContext must be used within AnnotationProvider');
  }
  return context;
};
```

**Uso nos componentes:**

```javascript
// AnnotationCanvas.jsx
import { useAnnotationContext } from '../AnnotationProvider';

export const AnnotationCanvas = () => {
  const { lines, updateLines, color, size, currentTool } = useAnnotationContext();

  // Componente usa estado do context, sem prop drilling
  return <Stage>...</Stage>;
};

// ToolbarAnnotation.jsx
import { useAnnotationContext } from '../AnnotationProvider';

export const ToolbarAnnotation = ({ onFinish }) => {
  const { color, setColor, saveAnnotations, undo } = useAnnotationContext();

  // Acessa estado sem precisar receber por props
  return <div>...</div>;
};
```

**Benefícios:**
- Sem **prop drilling** (passar props por vários níveis)
- Estado centralizado e organizado
- Fácil de adicionar novos estados
- Componentes mais limpos

---

## Arquitetura Refatorada

### Backend - Estrutura Final

```
src/
├── domain/
│   ├── entities/
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Essay.js
│   │   └── Annotation.js
│   ├── repositories/                # Interfaces
│   │   ├── IEssayRepository.js
│   │   ├── IAnnotationRepository.js
│   │   └── ...
│   └── services/                    # ⭐ NOVOS Domain Services
│       ├── AnnotationValidationService.js
│       ├── PermissionService.js
│       └── EssayCorrectionService.js
│
├── application/
│   └── use-cases/
│       ├── essays/
│       │   ├── UploadEssayUseCase.js
│       │   ├── GetEssayByIdUseCase.js
│       │   └── FinalizeEssayCorrectionUseCase.js  # ⭐ Refatorado
│       └── annotations/
│           ├── SaveAnnotationsUseCase.js         # ⭐ Refatorado
│           ├── GetAnnotationsUseCase.js
│           └── UpdateEssayStatusUseCase.js
│
└── infrastructure/
    ├── database/
    │   └── repositories/              # Implementações
    │       ├── EssayRepository.js
    │       └── AnnotationRepository.js
    └── http/
        └── controllers/
            ├── EssayController.js
            └── AnnotationController.js
```

---

### Frontend - Estrutura Final

```
src/features/
├── essays/
│   ├── repositories/                 # ⭐ NOVA CAMADA
│   │   ├── IEssayRepository.js
│   │   ├── HttpEssayRepository.js
│   │   └── index.js
│   ├── hooks/                        # ⭐ Refatorados
│   │   ├── useEssay.js               # Depende de IEssayRepository
│   │   └── useEssayFinalization.js   # ⭐ NOVO - Lógica de finalização
│   ├── components/
│   │   ├── FinalizeEssayModal.jsx    # OK (apresentacional)
│   │   └── EssayGradeCard.jsx
│   └── pages/
│       ├── EssayCorrectPage.jsx      # ⭐ Refatorado (apenas UI)
│       └── EssayViewPage.jsx
│
└── annotations/
    ├── repositories/                 # ⭐ NOVA CAMADA
    │   ├── IAnnotationRepository.js
    │   ├── HttpAnnotationRepository.js
    │   └── index.js
    ├── hooks/                        # ⭐ Refatorados
    │   ├── useAnnotations.js         # Depende de IAnnotationRepository
    │   ├── useDrawing.js             # ⭐ NOVO - Lógica de desenho
    │   ├── useAutoSave.js            # ⭐ NOVO - Auto-save separado
    │   ├── useStylus.js              # Já existe (OK)
    │   └── useCanvasZoom.js          # Já existe (OK)
    └── components/
        ├── EssayAnnotator.jsx        # ⭐ Refatorado (orquestrador)
        ├── AnnotationProvider.jsx    # ⭐ NOVO - Context
        ├── ImageCanvas/              # ⭐ NOVO - Componente de imagem
        │   ├── ImageCanvas.jsx
        │   └── useImageLoader.js
        ├── AnnotationCanvas/         # ⭐ NOVO - Componente de desenho
        │   ├── AnnotationCanvas.jsx
        │   ├── AnnotationLayer.jsx
        │   └── LineRenderer.jsx
        ├── ZoomControls/             # ⭐ NOVO - Controles de zoom
        │   └── ZoomControls.jsx
        └── ToolbarAnnotation.jsx     # Já existe (OK)
```

---

## Implementação Passo a Passo

### Backend

#### Passo 1: Criar Domain Services

##### 1.1 - AnnotationValidationService

**Arquivo:** `src/domain/services/AnnotationValidationService.js`

```javascript
import { ValidationError } from '../../utils/errors.js';

/**
 * Domain Service: Validação de Anotações
 *
 * Responsabilidade:
 * - Validar estrutura de dados de anotações (formato Konva)
 * - Validar linhas e pontos
 * - Lógica de domínio reutilizável
 *
 * Segue SOLID:
 * - SRP: Apenas validação de anotações
 * - OCP: Pode ser estendido para validar novos formatos
 */
export class AnnotationValidationService {
  /**
   * Valida estrutura completa de annotation data
   *
   * @param {Object} data - Dados da anotação
   * @throws {ValidationError} Se estrutura for inválida
   */
  validateAnnotationData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Dados de anotação inválidos');
    }

    if (!Array.isArray(data.lines)) {
      throw new ValidationError('Campo "lines" deve ser um array');
    }

    // Valida cada linha
    data.lines.forEach((line, index) => {
      this.validateLine(line, index);
    });
  }

  /**
   * Valida uma linha individual
   *
   * @param {Object} line - Linha a validar
   * @param {number} index - Índice da linha (para mensagem de erro)
   * @throws {ValidationError} Se linha for inválida
   */
  validateLine(line, index) {
    if (!Array.isArray(line.points)) {
      throw new ValidationError(`Linha ${index}: "points" deve ser um array`);
    }

    if (!line.color || typeof line.color !== 'string') {
      throw new ValidationError(`Linha ${index}: "color" deve ser uma string válida`);
    }

    if (typeof line.size !== 'number' || line.size <= 0) {
      throw new ValidationError(`Linha ${index}: "size" deve ser um número positivo`);
    }

    // Valida cada ponto da linha
    line.points.forEach((point, pointIndex) => {
      this.validatePoint(point, index, pointIndex);
    });
  }

  /**
   * Valida um ponto individual
   *
   * @param {Array} point - Ponto [x, y] ou [x, y, pressure]
   * @param {number} lineIndex - Índice da linha
   * @param {number} pointIndex - Índice do ponto
   * @throws {ValidationError} Se ponto for inválido
   */
  validatePoint(point, lineIndex, pointIndex) {
    if (!Array.isArray(point) || (point.length !== 2 && point.length !== 3)) {
      throw new ValidationError(
        `Linha ${lineIndex}, ponto ${pointIndex}: deve ter formato [x, y] ou [x, y, pressure]`
      );
    }

    const [x, y, pressure] = point;

    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new ValidationError(
        `Linha ${lineIndex}, ponto ${pointIndex}: coordenadas devem ser números`
      );
    }

    if (pressure !== undefined && typeof pressure !== 'number') {
      throw new ValidationError(
        `Linha ${lineIndex}, ponto ${pointIndex}: pressure deve ser um número`
      );
    }
  }
}
```

---

##### 1.2 - PermissionService

**Arquivo:** `src/domain/services/PermissionService.js`

```javascript
import { ForbiddenError } from '../../utils/errors.js';

/**
 * Domain Service: Permissões/Autorização
 *
 * Responsabilidade:
 * - Validar se usuário pode acessar/modificar recursos
 * - Centralizar lógica de autorização
 * - Evitar código duplicado em use cases
 *
 * Segue SOLID:
 * - SRP: Apenas autorização
 * - DRY: Lógica centralizada e reutilizável
 */
export class PermissionService {
  /**
   * @param {IClassRepository} classRepository - Para verificar ownership de turmas
   */
  constructor(classRepository) {
    this.classRepository = classRepository;
  }

  /**
   * Verifica se usuário pode corrigir uma redação
   *
   * @param {string} userId - ID do usuário
   * @param {string} userType - Tipo do usuário ('student' ou 'teacher')
   * @param {Object} essay - Entidade Essay
   * @param {Object} task - Entidade Task
   * @returns {Promise<boolean>} True se pode corrigir
   */
  async canCorrectEssay(userId, userType, essay, task) {
    // Apenas professores podem corrigir
    if (userType !== 'teacher') {
      return false;
    }

    // Verificar se professor é dono de pelo menos uma das turmas da tarefa
    const isOwner = await this.isTeacherOfAnyClass(userId, task.classIds);

    return isOwner;
  }

  /**
   * Verifica se usuário pode visualizar uma redação
   *
   * @param {string} userId - ID do usuário
   * @param {string} userType - Tipo do usuário
   * @param {Object} essay - Entidade Essay
   * @param {Object} task - Entidade Task (opcional)
   * @returns {Promise<boolean>} True se pode visualizar
   */
  async canViewEssay(userId, userType, essay, task = null) {
    // Aluno pode ver apenas sua própria redação
    if (userType === 'student') {
      return essay.studentId === userId;
    }

    // Professor pode ver se for dono da turma
    if (userType === 'teacher' && task) {
      return await this.isTeacherOfAnyClass(userId, task.classIds);
    }

    return false;
  }

  /**
   * Verifica se professor é dono de alguma das turmas
   *
   * @param {string} teacherId - ID do professor
   * @param {Array<string>} classIds - IDs das turmas
   * @returns {Promise<boolean>} True se é dono de pelo menos uma
   */
  async isTeacherOfAnyClass(teacherId, classIds) {
    for (const classId of classIds) {
      const classEntity = await this.classRepository.findById(classId);
      if (classEntity && classEntity.teacherId === teacherId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Garante que usuário é professor (lança erro se não for)
   *
   * @param {string} userType - Tipo do usuário
   * @throws {ForbiddenError} Se não for professor
   */
  ensureIsTeacher(userType) {
    if (userType !== 'teacher') {
      throw new ForbiddenError('Apenas professores podem acessar este recurso');
    }
  }

  /**
   * Garante que usuário é aluno (lança erro se não for)
   *
   * @param {string} userType - Tipo do usuário
   * @throws {ForbiddenError} Se não for aluno
   */
  ensureIsStudent(userType) {
    if (userType !== 'student') {
      throw new ForbiddenError('Apenas alunos podem acessar este recurso');
    }
  }
}
```

---

##### 1.3 - EssayCorrectionService

**Arquivo:** `src/domain/services/EssayCorrectionService.js`

```javascript
import { ValidationError } from '../../utils/errors.js';

/**
 * Domain Service: Correção de Redações
 *
 * Responsabilidade:
 * - Lógica de finalização de correção
 * - Validação de nota
 * - Regras de negócio relacionadas a correção
 *
 * Segue SOLID:
 * - SRP: Apenas lógica de correção
 * - DRY: Validações reutilizáveis
 */
export class EssayCorrectionService {
  /**
   * Valida nota de redação
   *
   * @param {number} grade - Nota a validar
   * @throws {ValidationError} Se nota for inválida
   */
  validateGrade(grade) {
    if (grade === null || grade === undefined) {
      throw new ValidationError('Nota é obrigatória');
    }

    if (typeof grade !== 'number' || grade < 0 || grade > 10) {
      throw new ValidationError('Nota deve ser um número entre 0 e 10');
    }

    // Validar precisão (máximo 2 casas decimais)
    const decimalPlaces = (grade.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new ValidationError('Nota deve ter no máximo 2 casas decimais');
    }
  }

  /**
   * Verifica se redação pode ser finalizada
   *
   * @param {Object} essay - Entidade Essay
   * @returns {boolean} True se pode finalizar
   */
  canFinalize(essay) {
    // Pode finalizar se estiver pending ou correcting
    return ['pending', 'correcting'].includes(essay.status);
  }

  /**
   * Prepara dados de finalização
   *
   * @param {number} grade - Nota
   * @param {string} writtenFeedback - Comentários (pode ser null)
   * @returns {Object} Dados formatados
   */
  prepareFinalizationData(grade, writtenFeedback) {
    // Trim feedback
    const feedback = writtenFeedback?.trim() || null;

    return {
      grade,
      writtenFeedback: feedback,
      correctedAt: new Date(),
      status: 'corrected',
    };
  }
}
```

---

#### Passo 2: Refatorar SaveAnnotationsUseCase

**Arquivo:** `src/application/use-cases/annotations/SaveAnnotationsUseCase.js`

```javascript
import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case: Salvar/Atualizar Anotações de Redação (REFATORADO)
 *
 * Responsabilidades:
 * 1. Buscar entidades (essay, task)
 * 2. Delegar validação de permissões para PermissionService
 * 3. Delegar validação de dados para AnnotationValidationService
 * 4. Salvar anotações via repository
 * 5. Atualizar status da redação
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra (não valida internamente)
 * - DIP: Depende de abstrações (repositories, services)
 * - OCP: Extensível via domain services
 */
export class SaveAnnotationsUseCase {
  /**
   * @param {IAnnotationRepository} annotationRepository
   * @param {IEssayRepository} essayRepository
   * @param {ITaskRepository} taskRepository
   * @param {AnnotationValidationService} annotationValidationService - ⭐ Domain service
   * @param {PermissionService} permissionService - ⭐ Domain service
   */
  constructor(
    annotationRepository,
    essayRepository,
    taskRepository,
    annotationValidationService,
    permissionService
  ) {
    this.annotationRepository = annotationRepository;
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.annotationValidationService = annotationValidationService;
    this.permissionService = permissionService;
  }

  /**
   * Executa o salvamento das anotações
   */
  async execute({ essayId, teacherId, annotationData, pageNumber = 1 }) {
    // 1. Buscar redação
    const essay = await this.essayRepository.findById(essayId);
    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Buscar tarefa
    const task = await this.taskRepository.findById(essay.taskId);
    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 3. Validar permissões (via PermissionService)
    const canCorrect = await this.permissionService.canCorrectEssay(
      teacherId,
      'teacher',
      essay,
      task
    );

    if (!canCorrect) {
      throw new ForbiddenError('Você não pode corrigir esta redação');
    }

    // 4. Validar dados (via AnnotationValidationService)
    this.annotationValidationService.validateAnnotationData(annotationData);

    // 5. Salvar anotações
    const savedAnnotation = await this.annotationRepository.saveOrUpdate(
      essayId,
      annotationData,
      pageNumber
    );

    // 6. Atualizar status se necessário
    if (essay.status === 'pending') {
      await this.essayRepository.updateStatus(essayId, 'correcting');
    }

    return savedAnnotation;
  }
}
```

**Mudanças:**
- ❌ Removido método `_validateAnnotationData` (50+ linhas)
- ✅ Usa `annotationValidationService.validateAnnotationData()`
- ✅ Usa `permissionService.canCorrectEssay()`
- ✅ Use case tem apenas **orquestração**

---

#### Passo 3: Refatorar FinalizeEssayCorrectionUseCase

**Arquivo:** `src/application/use-cases/essays/FinalizeEssayCorrectionUseCase.js`

```javascript
import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case: Finalizar Correção de Redação (REFATORADO)
 *
 * Responsabilidades:
 * 1. Buscar entidades
 * 2. Delegar validação de permissões para PermissionService
 * 3. Delegar validação de nota para EssayCorrectionService
 * 4. Finalizar via repository
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra
 * - DIP: Depende de abstrações
 */
export class FinalizeEssayCorrectionUseCase {
  /**
   * @param {IEssayRepository} essayRepository
   * @param {ITaskRepository} taskRepository
   * @param {PermissionService} permissionService - ⭐ Domain service
   * @param {EssayCorrectionService} essayCorrectionService - ⭐ Domain service
   */
  constructor(
    essayRepository,
    taskRepository,
    permissionService,
    essayCorrectionService
  ) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.permissionService = permissionService;
    this.essayCorrectionService = essayCorrectionService;
  }

  async execute({ essayId, grade, writtenFeedback, userId, userType }) {
    // 1. Validar que usuário é professor (via PermissionService)
    this.permissionService.ensureIsTeacher(userType);

    // 2. Validar nota (via EssayCorrectionService)
    this.essayCorrectionService.validateGrade(grade);

    // 3. Buscar redação
    const essay = await this.essayRepository.findById(essayId);
    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 4. Buscar tarefa
    const task = await this.taskRepository.findById(essay.taskId);
    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 5. Validar permissões (via PermissionService)
    const canCorrect = await this.permissionService.canCorrectEssay(
      userId,
      userType,
      essay,
      task
    );

    if (!canCorrect) {
      throw new ForbiddenError('Você não pode finalizar esta correção');
    }

    // 6. Validar que pode finalizar (via EssayCorrectionService)
    if (!this.essayCorrectionService.canFinalize(essay)) {
      throw new ValidationError('Esta redação não pode ser finalizada');
    }

    // 7. Preparar dados (via EssayCorrectionService)
    const finalizationData = this.essayCorrectionService.prepareFinalizationData(
      grade,
      writtenFeedback
    );

    // 8. Finalizar
    const updatedEssay = await this.essayRepository.finalize(
      essayId,
      finalizationData.grade,
      finalizationData.writtenFeedback
    );

    return {
      id: updatedEssay.id,
      taskId: updatedEssay.taskId,
      studentId: updatedEssay.studentId,
      fileUrl: updatedEssay.fileUrl,
      fileType: updatedEssay.fileType,
      status: updatedEssay.status,
      submittedAt: updatedEssay.submittedAt,
      correctedAt: updatedEssay.correctedAt,
      grade: updatedEssay.grade,
      writtenFeedback: updatedEssay.writtenFeedback,
    };
  }
}
```

**Mudanças:**
- ❌ Removido validações inline
- ✅ Usa `permissionService.ensureIsTeacher()`
- ✅ Usa `permissionService.canCorrectEssay()`
- ✅ Usa `essayCorrectionService.validateGrade()`
- ✅ Usa `essayCorrectionService.canFinalize()`

---

#### Passo 4: Injetar Domain Services nos Controllers

**Arquivo:** `src/infrastructure/http/dependencies.js` (NOVO)

```javascript
// Cria instances de domain services
import { ClassRepository } from '../database/repositories/ClassRepository.js';
import { AnnotationValidationService } from '../../domain/services/AnnotationValidationService.js';
import { PermissionService } from '../../domain/services/PermissionService.js';
import { EssayCorrectionService } from '../../domain/services/EssayCorrectionService.js';

// Repositories
const classRepository = new ClassRepository();

// Domain Services
export const annotationValidationService = new AnnotationValidationService();
export const permissionService = new PermissionService(classRepository);
export const essayCorrectionService = new EssayCorrectionService();
```

**Arquivo:** `src/infrastructure/http/controllers/AnnotationController.js`

```javascript
import { SaveAnnotationsUseCase } from '../../../application/use-cases/annotations/SaveAnnotationsUseCase.js';
import { annotationValidationService, permissionService } from '../dependencies.js';

// Injetar domain services no use case
const saveAnnotationsUseCase = new SaveAnnotationsUseCase(
  annotationRepository,
  essayRepository,
  taskRepository,
  annotationValidationService, // ⭐ Injetado
  permissionService // ⭐ Injetado
);

export class AnnotationController {
  // ...
}
```

---

### Frontend

#### Passo 1: Criar Repositories (Abstrações HTTP)

##### 1.1 - IEssayRepository (Interface)

**Arquivo:** `src/features/essays/repositories/IEssayRepository.js`

```javascript
/**
 * Interface de repositório de redações
 * Define o contrato que implementações devem seguir
 *
 * Segue SOLID:
 * - ISP: Interface específica para Essays
 * - DIP: Permite inversão de dependência
 */
export class IEssayRepository {
  /**
   * Busca redação por ID
   * @param {string} essayId
   * @returns {Promise<Object>}
   */
  async getById(essayId) {
    throw new Error('Not implemented');
  }

  /**
   * Faz upload de redação
   * @param {string} taskId
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async uploadEssay(taskId, file) {
    throw new Error('Not implemented');
  }

  /**
   * Finaliza correção de redação
   * @param {string} essayId
   * @param {number} grade
   * @param {string} writtenFeedback
   * @returns {Promise<Object>}
   */
  async finalizeEssay(essayId, grade, writtenFeedback) {
    throw new Error('Not implemented');
  }

  /**
   * Deleta redação
   * @param {string} essayId
   * @returns {Promise<void>}
   */
  async deleteEssay(essayId) {
    throw new Error('Not implemented');
  }
}
```

---

##### 1.2 - HttpEssayRepository (Implementação)

**Arquivo:** `src/features/essays/repositories/HttpEssayRepository.js`

```javascript
import { IEssayRepository } from './IEssayRepository';
import api from '@/shared/services/api';

/**
 * Implementação de repositório de redações usando HTTP
 *
 * Segue SOLID:
 * - SRP: Apenas chamadas HTTP para essays
 * - LSP: Substituível por IEssayRepository
 */
export class HttpEssayRepository extends IEssayRepository {
  async getById(essayId) {
    const response = await api.get(`/essays/${essayId}`);
    return response.data.data;
  }

  async uploadEssay(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await api.post('/essays/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  }

  async finalizeEssay(essayId, grade, writtenFeedback) {
    const response = await api.put(`/essays/${essayId}/finalize`, {
      grade,
      writtenFeedback,
    });
    return response.data.data;
  }

  async deleteEssay(essayId) {
    await api.delete(`/essays/${essayId}`);
  }
}
```

---

##### 1.3 - Export Singleton

**Arquivo:** `src/features/essays/repositories/index.js`

```javascript
import { HttpEssayRepository } from './HttpEssayRepository';

// Singleton instance
// (Pode ser substituído por Context Provider para DI avançado)
export const essayRepository = new HttpEssayRepository();
```

---

##### 1.4 - IAnnotationRepository & HttpAnnotationRepository

(Similar ao Essay, apenas com métodos de annotations)

**Arquivo:** `src/features/annotations/repositories/IAnnotationRepository.js`

```javascript
export class IAnnotationRepository {
  async getAnnotations(essayId, page = null) {
    throw new Error('Not implemented');
  }

  async saveAnnotations(essayId, annotationData, pageNumber = 1) {
    throw new Error('Not implemented');
  }

  async updateEssayStatus(essayId, status) {
    throw new Error('Not implemented');
  }
}
```

**Arquivo:** `src/features/annotations/repositories/HttpAnnotationRepository.js`

```javascript
import { IAnnotationRepository } from './IAnnotationRepository';
import api from '@/shared/services/api';

export class HttpAnnotationRepository extends IAnnotationRepository {
  async getAnnotations(essayId, page = null) {
    const params = page ? { page } : {};
    const response = await api.get(`/essays/${essayId}/annotations`, { params });
    return response.data.data;
  }

  async saveAnnotations(essayId, annotationData, pageNumber = 1) {
    const response = await api.post(`/essays/${essayId}/annotations`, {
      annotationData,
      pageNumber,
    });
    return response.data.data;
  }

  async updateEssayStatus(essayId, status) {
    const response = await api.patch(`/essays/${essayId}/status`, { status });
    return response.data.data;
  }
}
```

**Arquivo:** `src/features/annotations/repositories/index.js`

```javascript
import { HttpAnnotationRepository } from './HttpAnnotationRepository';

export const annotationRepository = new HttpAnnotationRepository();
```

---

#### Passo 2: Refatorar Hooks para Depender de Abstrações

##### 2.1 - useEssay (NOVO Hook)

**Arquivo:** `src/features/essays/hooks/useEssay.js`

```javascript
import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar estado de redação
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia estado de essay
 * - DIP: Depende de abstração (IEssayRepository)
 *
 * @param {string} essayId - ID da redação
 * @param {IEssayRepository} essayRepository - Repositório injetado
 * @returns {Object} { essay, isLoading, error }
 */
export const useEssay = (essayId, essayRepository) => {
  const [essay, setEssay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadEssay = async () => {
      try {
        setIsLoading(true);
        const data = await essayRepository.getById(essayId);
        setEssay(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar redação:', err);
        setError(err.response?.data?.error || 'Erro ao carregar redação');
        toast.error('Erro ao carregar redação');
      } finally {
        setIsLoading(false);
      }
    };

    if (essayId) {
      loadEssay();
    }
  }, [essayId, essayRepository, toast]);

  return { essay, isLoading, error };
};
```

---

##### 2.2 - useAnnotations (Refatorado)

**Arquivo:** `src/features/annotations/hooks/useAnnotations.js`

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar anotações (REFATORADO)
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia estado de anotações
 * - DIP: Depende de abstração (IAnnotationRepository)
 *
 * @param {string} essayId
 * @param {IAnnotationRepository} annotationRepository - ⭐ Injetado
 * @param {boolean} readOnly
 */
export const useAnnotations = (essayId, annotationRepository, readOnly = false) => {
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toast = useToast();
  const lastSavedDataRef = useRef(null);

  /**
   * Carrega anotações do backend
   */
  const loadAnnotations = useCallback(async () => {
    if (!essayId) return;

    try {
      setIsLoading(true);
      const data = await annotationRepository.getAnnotations(essayId); // ⭐ Usa abstração
      const loadedLines = data?.annotationData?.lines || [];
      setLines(loadedLines);
      lastSavedDataRef.current = JSON.stringify(loadedLines);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
      toast.error('Erro ao carregar anotações');
    } finally {
      setIsLoading(false);
    }
  }, [essayId, annotationRepository, toast]);

  /**
   * Salva anotações no backend
   */
  const saveAnnotations = useCallback(
    async (linesToSave = lines, showSuccessToast = true) => {
      if (!essayId || readOnly) return;

      try {
        setIsSaving(true);

        const annotationData = {
          version: '1.0',
          lines: linesToSave,
        };

        await annotationRepository.saveAnnotations(essayId, annotationData); // ⭐ Usa abstração

        lastSavedDataRef.current = JSON.stringify(linesToSave);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        if (showSuccessToast) {
          toast.success('Anotações salvas com sucesso');
        }
      } catch (error) {
        console.error('Erro ao salvar anotações:', error);
        toast.error('Erro ao salvar anotações');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [essayId, lines, readOnly, annotationRepository, toast]
  );

  /**
   * Atualiza linhas
   */
  const updateLines = useCallback((newLines) => {
    setLines(newLines);
    const currentData = JSON.stringify(newLines);
    const hasChanged = currentData !== lastSavedDataRef.current;
    setHasUnsavedChanges(hasChanged);
  }, []);

  /**
   * Limpa anotações
   */
  const clearAnnotations = useCallback(() => {
    updateLines([]);
  }, [updateLines]);

  /**
   * Desfaz última linha
   */
  const undo = useCallback(() => {
    if (lines.length === 0) return;
    updateLines(lines.slice(0, -1));
  }, [lines, updateLines]);

  // Carrega anotações ao montar
  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  return {
    lines,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    updateLines,
    saveAnnotations: () => saveAnnotations(lines, true),
    clearAnnotations,
    undo,
    reload: loadAnnotations,
  };
};
```

**Mudanças:**
- ⭐ Recebe `annotationRepository` como parâmetro (DIP)
- ❌ Removido métodos `updateStatus`, `saveAndFinish` (responsabilidade única)
- ✅ Hook tem apenas gerenciamento de estado de anotações

---

#### Passo 3: Refatorar EssayCorrectPage

**Arquivo:** `src/features/essays/pages/EssayCorrectPage.jsx`

```javascript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEssay } from '../hooks/useEssay';
import { essayRepository } from '../repositories';
import { EssayAnnotator } from '@/features/annotations/components/EssayAnnotator';
import { FinalizeEssayModal } from '../components/FinalizeEssayModal';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Página de correção de redação (REFATORADO)
 *
 * Responsabilidade: Apenas orquestração de UI
 *
 * Segue SOLID:
 * - SRP: Apenas UI/UX
 * - DIP: Depende de hooks e repositories abstratos
 */
export const EssayCorrectPage = () => {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Estado da modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Hook customizado (gerencia estado de essay)
  const { essay, isLoading, error } = useEssay(essayId, essayRepository);

  /**
   * Callback ao clicar em "Finalizar Correção"
   */
  const handleFinish = () => {
    setIsModalOpen(true);
  };

  /**
   * Callback ao submeter o modal
   */
  const handleFinalizeSubmit = async (grade, writtenFeedback) => {
    try {
      setIsFinalizing(true);

      // Chama repository para finalizar
      await essayRepository.finalizeEssay(essayId, grade, writtenFeedback);

      toast.success('Correção finalizada com sucesso!');
      setIsModalOpen(false);

      // Redireciona
      setTimeout(() => {
        if (essay?.task?.id && essay?.task?.classId) {
          navigate(`/classes/${essay.task.classId}/tasks/${essay.task.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      console.error('Erro ao finalizar correção:', err);
      toast.error(err.response?.data?.error || 'Erro ao finalizar correção');
    } finally {
      setIsFinalizing(false);
    }
  };

  /**
   * Voltar
   */
  const handleBack = () => {
    if (essay?.task?.id && essay?.task?.classId) {
      navigate(`/classes/${essay.task.classId}/tasks/${essay.task.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Estados de loading/erro
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando redação...</p>
        </div>
      </div>
    );
  }

  if (error || !essay) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar redação</h2>
          <p className="text-gray-600 mb-6">{error || 'Redação não encontrada'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Voltar
          </button>

          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-xl font-bold text-gray-800">{essay.task?.title || 'Redação'}</h1>
            <p className="text-sm text-gray-600">
              Aluno: <span className="font-medium">{essay.student?.fullName || 'Aluno'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">
              {essay.status === 'pending' && <span className="text-orange-600">Pendente</span>}
              {essay.status === 'correcting' && <span className="text-blue-600">Corrigindo</span>}
              {essay.status === 'corrected' && <span className="text-green-600">Corrigido</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas de anotação */}
      <EssayAnnotator
        essayId={essayId}
        imageUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/essays/${essayId}/image`}
        onFinish={handleFinish}
      />

      {/* Modal de Finalização */}
      <FinalizeEssayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinalize={handleFinalizeSubmit}
        isLoading={isFinalizing}
      />
    </div>
  );
};
```

**Mudanças:**
- ✅ Usa hook `useEssay` (abstração)
- ✅ Componente tem apenas UI/UX
- ❌ Removido lógica de fetch (delegado ao hook)
- ✅ Mais limpo e testável

---

#### Passo 4: Quebrar EssayAnnotator em Componentes Menores

(Por brevidade, vou mostrar apenas a estrutura. Implementação completa seria muito extensa.)

##### 4.1 - AnnotationProvider (Context)

**Arquivo:** `src/features/annotations/components/AnnotationProvider.jsx`

```javascript
import { createContext, useContext, useState } from 'react';
import { useAnnotations } from '../hooks/useAnnotations';
import { annotationRepository } from '../repositories';

const AnnotationContext = createContext(null);

export const AnnotationProvider = ({ essayId, readOnly, children }) => {
  // Estado de anotações (via hook)
  const annotations = useAnnotations(essayId, annotationRepository, readOnly);

  // Estado de ferramentas
  const [color, setColor] = useState('#EF4444');
  const [size, setSize] = useState(4);
  const [currentTool, setCurrentTool] = useState('pen');
  const [isEraser, setIsEraser] = useState(false);

  const value = {
    ...annotations,
    color,
    setColor,
    size,
    setSize,
    currentTool,
    setCurrentTool,
    isEraser,
    setIsEraser,
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
};

export const useAnnotationContext = () => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotationContext must be used within AnnotationProvider');
  }
  return context;
};
```

---

##### 4.2 - EssayAnnotator (Refatorado - Orquestrador)

**Arquivo:** `src/features/annotations/components/EssayAnnotator.jsx`

```javascript
import { AnnotationProvider } from './AnnotationProvider';
import { ImageCanvas } from './ImageCanvas/ImageCanvas';
import { AnnotationCanvas } from './AnnotationCanvas/AnnotationCanvas';
import { ToolbarAnnotation } from './ToolbarAnnotation';
import { ZoomControls } from './ZoomControls/ZoomControls';

/**
 * Componente orquestrador de anotações (REFATORADO)
 *
 * Responsabilidade: Apenas composição de componentes
 *
 * Segue SOLID:
 * - SRP: Apenas composição (não gerencia estado)
 * - OCP: Extensível via componentes filhos
 */
export const EssayAnnotator = ({ essayId, imageUrl, onFinish, readOnly = false, className = '' }) => {
  return (
    <AnnotationProvider essayId={essayId} readOnly={readOnly}>
      <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
        {/* Toolbar */}
        {!readOnly && <ToolbarAnnotation onFinish={onFinish} />}

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Imagem de fundo */}
          <ImageCanvas imageUrl={imageUrl} />

          {/* Anotações (sobrepostas) */}
          <AnnotationCanvas />

          {/* Controles de zoom */}
          <ZoomControls />
        </div>
      </div>
    </AnnotationProvider>
  );
};
```

**Mudanças:**
- ❌ Removido 500+ linhas de lógica
- ✅ Apenas composição de componentes
- ✅ Estado gerenciado por `AnnotationProvider` (Context)
- ✅ Componentes filhos acessam estado via `useAnnotationContext()`

---

##### 4.3 - ImageCanvas (Novo Componente)

**Arquivo:** `src/features/annotations/components/ImageCanvas/ImageCanvas.jsx`

```javascript
import { useEffect, useState } from 'react';
import { Spinner } from '@/shared/components/ui/Spinner';

/**
 * Componente de carregamento e exibição de imagem
 *
 * Responsabilidade: Apenas imagem (não anotações)
 *
 * Segue SOLID:
 * - SRP: Apenas imagem
 */
export const ImageCanvas = ({ imageUrl }) => {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(imageUrl, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const img = new window.Image();
        img.onload = () => {
          setImage(img);
          setIsLoading(false);
        };
        img.onerror = () => {
          setError('Erro ao carregar imagem');
          setIsLoading(false);
        };
        img.src = blobUrl;
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [imageUrl]);

  if (isLoading) return <Spinner />;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img src={image.src} alt="Redação" className="max-w-full max-h-full" />
    </div>
  );
};
```

---

##### 4.4 - AnnotationCanvas (Novo Componente)

**Arquivo:** `src/features/annotations/components/AnnotationCanvas/AnnotationCanvas.jsx`

```javascript
import { Stage, Layer } from 'react-konva';
import { useAnnotationContext } from '../AnnotationProvider';
import { useDrawing } from '../../hooks/useDrawing';
import { LineRenderer } from './LineRenderer';

/**
 * Componente de canvas de anotações (Konva)
 *
 * Responsabilidade: Desenho com Konva
 *
 * Segue SOLID:
 * - SRP: Apenas desenho
 * - DIP: Depende de context (abstração)
 */
export const AnnotationCanvas = () => {
  const { lines, updateLines, color, size, currentTool, isEraser } = useAnnotationContext();

  const {
    currentLine,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDrawing({ lines, updateLines, color, size, currentTool, isEraser });

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
      >
        <Layer>
          {/* Linhas finalizadas */}
          {lines.map((line, i) => (
            <LineRenderer key={i} line={line} />
          ))}

          {/* Linha sendo desenhada */}
          {currentLine && <LineRenderer line={currentLine} />}
        </Layer>
      </Stage>
    </div>
  );
};
```

---

##### 4.5 - useDrawing (Novo Hook)

**Arquivo:** `src/features/annotations/hooks/useDrawing.js`

```javascript
import { useState, useCallback } from 'react';

/**
 * Hook para lógica de desenho
 *
 * Responsabilidade: Gerenciar desenho (início, movimento, fim)
 *
 * Segue SOLID:
 * - SRP: Apenas desenho
 */
export const useDrawing = ({ lines, updateLines, color, size, currentTool, isEraser }) => {
  const [currentLine, setCurrentLine] = useState(null);

  const handleMouseDown = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const pressure = e.evt.pressure || 0.5;

    setCurrentLine({
      points: [[pos.x, pos.y, pressure]],
      color: isEraser ? '#FFFFFF' : color,
      size: isEraser ? size * 2 : size,
      tool: isEraser ? 'eraser' : currentTool,
    });
  }, [color, size, currentTool, isEraser]);

  const handleMouseMove = useCallback((e) => {
    if (!currentLine) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const pressure = e.evt.pressure || 0.5;

    setCurrentLine((prev) => ({
      ...prev,
      points: [...prev.points, [pos.x, pos.y, pressure]],
    }));
  }, [currentLine]);

  const handleMouseUp = useCallback(() => {
    if (!currentLine) return;

    if (currentLine.points.length > 1) {
      updateLines([...lines, currentLine]);
    }

    setCurrentLine(null);
  }, [currentLine, lines, updateLines]);

  return {
    currentLine,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
```

---

## Checklist de Migração

### Backend

- [ ] **Criar Domain Services**
  - [ ] AnnotationValidationService
  - [ ] PermissionService
  - [ ] EssayCorrectionService

- [ ] **Refatorar Use Cases**
  - [ ] SaveAnnotationsUseCase
  - [ ] FinalizeEssayCorrectionUseCase
  - [ ] GetAnnotationsUseCase (opcional)

- [ ] **Atualizar Dependency Injection**
  - [ ] Criar `dependencies.js`
  - [ ] Injetar domain services em controllers
  - [ ] Atualizar testes (mockar domain services)

- [ ] **Testes**
  - [ ] Testar domain services isoladamente
  - [ ] Testar use cases com domain services mockados

---

### Frontend

- [ ] **Criar Camada de Repository**
  - [ ] IEssayRepository + HttpEssayRepository
  - [ ] IAnnotationRepository + HttpAnnotationRepository
  - [ ] Export singletons

- [ ] **Criar/Refatorar Hooks**
  - [ ] useEssay (novo)
  - [ ] useAnnotations (refatorar para receber repository)
  - [ ] useDrawing (novo)
  - [ ] useAutoSave (opcional, separar de useAnnotations)

- [ ] **Quebrar EssayAnnotator**
  - [ ] AnnotationProvider (Context)
  - [ ] ImageCanvas + useImageLoader
  - [ ] AnnotationCanvas + useDrawing
  - [ ] LineRenderer
  - [ ] ZoomControls (extrair de EssayAnnotator)
  - [ ] EssayAnnotator (orquestrador)

- [ ] **Refatorar EssayCorrectPage**
  - [ ] Usar hook useEssay
  - [ ] Remover lógica de fetch
  - [ ] Manter apenas UI/UX

- [ ] **Deletar Services Antigos**
  - [ ] Deletar ou renomear `essayService.js`
  - [ ] Deletar ou renomear `annotationService.js`
  - [ ] Atualizar imports

- [ ] **Testes**
  - [ ] Testar hooks com repositories mockados
  - [ ] Testar componentes isoladamente
  - [ ] Testar context provider

---

## Benefícios da Refatoração

### Princípios SOLID Aplicados

| Princípio | Como foi aplicado |
|-----------|-------------------|
| **SRP** | Use cases apenas orquestram; Domain services têm lógica; Componentes têm UMA responsabilidade |
| **OCP** | Pode adicionar novos domain services sem modificar use cases; Componentes extensíveis via props |
| **LSP** | Repositories são intercambiáveis (HTTP, Mock, Cache); Domain services podem ter implementações alternativas |
| **ISP** | Interfaces pequenas e específicas (IEssayRepository, IAnnotationRepository) |
| **DIP** | Use cases dependem de abstrações (repositories, services); Hooks dependem de abstrações (repositories) |

---

### Manutenibilidade

- ✅ **Fácil encontrar código:** Lógica de validação → Domain service; Fetch HTTP → Repository
- ✅ **Fácil modificar:** Mudar validação de nota → EssayCorrectionService (um lugar)
- ✅ **Fácil adicionar features:** Novo tipo de anotação → Novo domain service

---

### Testabilidade

- ✅ **Backend:** Testar domain services isoladamente; Mockar repositories e services em use cases
- ✅ **Frontend:** Testar hooks com repositories mockados; Testar componentes com context mockado

---

### Reutilização

- ✅ **Domain services:** Podem ser usados em múltiplos use cases
- ✅ **Hooks:** Podem ser usados em múltiplos componentes
- ✅ **Componentes:** ImageCanvas, AnnotationCanvas reutilizáveis

---

## Conclusão

Esta refatoração transforma o código atual (acoplado, com violações de SOLID) em uma arquitetura limpa, desacoplada e extensível.

**Próximos passos:**
1. Implementar backend (Domain Services + refatorar Use Cases)
2. Implementar frontend (Repositories + refatorar Hooks + quebrar componentes)
3. Escrever testes
4. Atualizar documentação (CLAUDE.md)
5. Deploy e validação

**Tempo estimado:**
- Backend: 2-3 horas
- Frontend: 4-5 horas
- Testes: 2 horas
- Total: **8-10 horas de trabalho focado**

**ROI (Return on Investment):**
- Redução de bugs (validação centralizada)
- Velocidade de desenvolvimento futuro (componentes reutilizáveis)
- Onboarding mais fácil (código organizado)
- Manutenção simplificada (fácil encontrar e modificar)
