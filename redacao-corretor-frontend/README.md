# Redação Corretor - Frontend

> Sistema web para correção de redações com anotações digitais usando caneta de tablet

**Stack:** React 19 + Vite + Tailwind CSS + Zustand + React Router + Axios + Konva + Perfect-Freehand

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Setup e Instalação](#setup-e-instalação)
- [Autenticação com Cookies HttpOnly](#autenticação-com-cookies-httponly)
- [Sistema de Anotações](#sistema-de-anotações)
- [Upload de Redações](#upload-de-redações)
- [Sistema de Toast](#sistema-de-toast)
- [Rotas e Navegação](#rotas-e-navegação)
- [Componentes Principais](#componentes-principais)
- [Docker](#docker)
- [Scripts Disponíveis](#scripts-disponíveis)

---

## Visão Geral

Frontend do sistema de correção de redações, permitindo que:
- **Professores:** Gerenciem turmas, criem tarefas, recebam redações e façam anotações com caneta de tablet
- **Alunos:** Visualizem tarefas, enviem redações (fotos/PDFs) e recebam feedback com anotações

### Features Implementadas

**✅ Fase 1 - Autenticação e Segurança**
- Autenticação com cookies httpOnly (mais seguro que localStorage)
- Sistema de rotas protegidas (PrivateRoute + RequireTeacher)
- Estado global com Zustand (auth + toast)
- Refresh token automático
- Logout com limpeza de cookies

**✅ Fase 2 - Interface do Professor**
- Dashboard (placeholder)
- CRUD de turmas
- Listagem de Tarefas por Turma (Em Andamento / Encerradas)
- Detalhes da Tarefa com Lista de Alunos (Entregas/Pendentes)
- Estatísticas de Entrega (Total, Entregas, Pendentes, Taxa)

**✅ Fase 3 - Interface do Aluno**
- StudentHomePage - Visualização de tarefas pendentes e concluídas
- Tarefas movem automaticamente para "Concluídas" após envio
- Status visual com ícones Bootstrap Icons
- Sidebar com menus específicos para alunos
- Proteção de rotas de professores

**✅ Fase 4 - Upload de Redações**
- Componente UploadEssayForm com drag & drop
- Suporte a JPEG, PNG e PDF (máx 10MB)
- Preview de arquivos antes do upload
- Integração com Google Drive (backend)
- Visualização de redações enviadas
- Delete com modal de confirmação
- Sistema de status (pending, correcting, corrected)

**✅ Fase 5 - Sistema de Anotações (COMPLETO)**
- **EssayAnnotator** - Componente de anotação completo
- **Detecção de stylus** - Caneta desenha, dedo faz pan
- **Perfect-freehand** - Rabiscos realistas com pressão
- **Zoom e Pan** - Pinch zoom + controles de zoom
- **Toolbar** - Cores, tamanhos, borracha, desfazer, limpar
- **Auto-save** - Salva automaticamente (desabilitado por padrão)
- **Save manual** - Botão de salvar com feedback visual
- **Finalizar correção** - Muda status para "corrected"
- **Read-only mode** - Alunos visualizam anotações sem editar
- **Proxy de imagens** - Contorna CORS do Google Drive

**✅ UX e Componentes**
- Sistema de Toast com Zustand (success, error, warning, info)
- ConfirmationModal reutilizável (substitui alerts nativos)
- Design responsivo com Tailwind CSS
- Bootstrap Icons para ícones
- Loading states e spinners

---

## Tecnologias

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19.2.0 | Framework UI |
| Vite | 7.2.4 | Build tool & dev server |
| Tailwind CSS | 4.1.18 | Styling (utility-first) |
| React Router DOM | 7.10.1 | Roteamento SPA |
| Zustand | 5.0.9 | Estado global (leve) |
| Axios | 1.13.2 | HTTP client |
| React-Konva | 19.2.1 | Canvas 2D para anotações |
| Konva | 10.0.12 | Engine de canvas performático |
| Perfect-Freehand | 1.2.2 | Desenho suave com simulação de pressão |
| Bootstrap Icons | 1.11.3 | Ícones |

---

## Estrutura do Projeto

```
src/
├── app/                          # Configuração global
│   └── router/
│       ├── AppRouter.jsx         # Configuração de rotas
│       └── PrivateRoute.jsx      # HOC para rotas protegidas
│
├── features/                     # Features (domínios)
│   ├── auth/                     # Autenticação
│   │   ├── components/
│   │   │   └── RequireTeacher.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── store/
│   │   │   └── authStore.js      # Zustand (user, isAuthenticated)
│   │   └── pages/
│   │       └── LoginPage.jsx
│   │
│   ├── classes/                  # Gerenciamento de turmas (Professores)
│   │   ├── components/
│   │   │   └── ClassCard.jsx
│   │   ├── hooks/
│   │   │   └── useClasses.js
│   │   ├── services/
│   │   │   └── classService.js
│   │   └── pages/
│   │       ├── ClassesPage.jsx
│   │       └── ClassTasksPage.jsx
│   │
│   ├── tasks/                    # Gerenciamento de tarefas (Professores)
│   │   ├── components/
│   │   │   ├── TaskCard.jsx
│   │   │   └── StudentListItem.jsx
│   │   ├── hooks/
│   │   │   └── useTaskStudents.js
│   │   ├── services/
│   │   │   └── taskService.js
│   │   └── pages/
│   │       └── TaskStudentsPage.jsx
│   │
│   ├── essays/                   # Redações
│   │   ├── components/
│   │   │   └── UploadEssayForm.jsx # Upload com drag & drop
│   │   ├── services/
│   │   │   └── essayService.js     # API de redações
│   │   └── pages/
│   │       ├── EssayCorrectPage.jsx  # Correção (Professor)
│   │       └── EssayViewPage.jsx     # Visualização (Aluno)
│   │
│   ├── annotations/              # ⭐ Sistema de anotações
│   │   ├── components/
│   │   │   ├── EssayAnnotator.jsx    # Canvas principal (produção)
│   │   │   └── ToolbarAnnotation.jsx # Toolbar de ferramentas
│   │   ├── hooks/
│   │   │   ├── useStylus.js          # Detecção de caneta/dedo/mouse
│   │   │   ├── useCanvasZoom.js      # Zoom e pan
│   │   │   └── useAnnotations.js     # Estado e API de anotações
│   │   ├── services/
│   │   │   └── annotationService.js  # API de anotações
│   │   └── utils/
│   │       └── freehandHelper.js     # Helper perfect-freehand
│   │
│   ├── students/                 # Interface do Aluno
│   │   ├── components/
│   │   │   └── StudentTaskCard.jsx   # Card com badges de status
│   │   ├── hooks/
│   │   │   ├── useStudentTasks.js    # Separa pendentes/concluídas
│   │   │   └── useTaskDetail.js      # Detalhes da tarefa
│   │   └── pages/
│   │       ├── StudentHomePage.jsx   # Home com tarefas
│   │       └── TaskDetailPage.jsx    # Detalhes + Upload
│   │
│   └── dashboard/                # Dashboard (Professores)
│       └── pages/
│           └── DashboardPage.jsx
│
└── shared/                       # Compartilhado
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx           # Menu lateral com ícones
    │   │   └── MainLayout.jsx        # Layout wrapper
    │   └── ui/
    │       ├── Button.jsx            # Botão com variants
    │       ├── Card.jsx              # Container
    │       ├── Spinner.jsx           # Loading
    │       ├── ConfirmationModal.jsx # ⭐ Modal de confirmação
    │       └── ToastContainer.jsx    # ⭐ Sistema de notificações
    ├── hooks/
    │   └── useToast.js               # ⭐ Hook de toast (Zustand)
    ├── services/
    │   └── api.js                    # Axios com interceptors
    └── constants/
        └── routes.js                 # Constantes de rotas
```

### Padrão de Organização

**Feature-based architecture:**
- Cada feature é independente e auto-contida
- Facilita escalabilidade e manutenção
- Componentes compartilhados em `shared/`

---

## Setup e Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend rodando em `http://localhost:3000`

### Instalação Local

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd redacao-corretor-frontend

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local:
# VITE_API_URL=http://localhost:3000/api

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse http://localhost:5173
```

### Variáveis de Ambiente

`.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
```

⚠️ **Importante:** Variáveis no Vite DEVEM começar com `VITE_`.

---

## Autenticação com Cookies HttpOnly

### Por Que Cookies HttpOnly?

**Vantagens:**
- ✅ **Mais seguro:** Não acessível via JavaScript (previne XSS)
- ✅ **Automático:** Browser envia em todas requisições
- ✅ **Flags de segurança:** `secure`, `sameSite=strict`

**Tokens:**
- `accessToken` - 15 minutos
- `refreshToken` - 7 dias

### Fluxo de Autenticação

**1. Login:**
```javascript
POST /api/auth/login
Body: { email, password }

// Backend:
// - Define cookies httpOnly (accessToken, refreshToken)
// - Retorna apenas dados do usuário

Response: {
  success: true,
  data: {
    user: { id, email, fullName, type }
  }
}
```

**2. Requisições Autenticadas:**
```javascript
// Axios configurado com withCredentials: true
GET /api/classes

// Cookies enviados automaticamente:
Cookie: accessToken=eyJhbGc...
```

**3. Refresh Automático:**
```javascript
// Interceptor detecta 401
// Chama POST /api/auth/refresh
// Retenta requisição original
// Se falhar → logout
```

### Configuração Axios

```javascript
// src/shared/services/api.js
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // ⚠️ CRUCIAL
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      await axios.post('/auth/refresh', {}, { withCredentials: true });
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

---

## Sistema de Anotações

### Visão Geral

Sistema completo de anotações digitais com suporte a stylus/caneta de tablet.

**Componentes:**
- `EssayAnnotator` - Canvas principal com desenho
- `ToolbarAnnotation` - Ferramentas (cores, tamanhos, etc)
- `useAnnotations` - Hook de estado e API
- `useStylus` - Detecção de caneta vs dedo
- `useCanvasZoom` - Zoom e pan

### Features

**✅ Detecção de Entrada:**
- Caneta/Stylus → Desenha
- Dedo → Pan (quando em zoom)
- Mouse → Desenha (desktop)

**✅ Ferramentas:**
- 4 Cores (vermelho, azul, verde, amarelo)
- 3 Tamanhos (fino, médio, grosso)
- Borracha
- Desfazer última linha
- Limpar tudo (com confirmação)

**✅ Zoom e Pan:**
- Botões +/- para zoom
- Pinch zoom (dois dedos)
- Pan com dedo (quando zoom > 1x)
- Reset zoom

**✅ Persistência:**
- Salvar manual com botão
- Auto-save a cada 5s (desabilitado)
- Carrega anotações ao abrir
- Formato JSONB no backend

**✅ Finalização:**
- Botão "Finalizar Correção"
- Salva anotações
- Muda status da redação para "corrected"
- Redireciona para lista de alunos

### Uso

**Professor - Corrigir Redação:**
```jsx
<EssayCorrectPage />
  └── <EssayAnnotator
        essayId={essayId}
        imageUrl={proxyUrl}
        onFinish={handleFinish}
      />
```

**Aluno - Visualizar Correção:**
```jsx
<EssayViewPage />
  └── <EssayAnnotator
        essayId={essayId}
        imageUrl={proxyUrl}
        readOnly={true}
      />
```

### Formato de Dados

Anotações salvas como JSONB no PostgreSQL:

```json
{
  "version": "1.0",
  "lines": [
    {
      "points": [[x, y, pressure], ...],
      "color": "#EF4444",
      "size": 4
    }
  ]
}
```

### Proxy de Imagens

Para contornar CORS do Google Drive:

```javascript
// Backend endpoint
GET /api/essays/:essayId/image

// Baixa arquivo do Google Drive
// Retorna buffer com Content-Type correto
```

```javascript
// Frontend
const imageUrl = `${apiUrl}/essays/${essayId}/image`;

// Cria blob URL para exibir:
const response = await fetch(imageUrl, { credentials: 'include' });
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);
```

---

## Upload de Redações

### Componente UploadEssayForm

**Features:**
- Drag & drop de arquivos
- Suporte a JPEG, PNG, PDF
- Máximo 10MB
- Preview antes do upload
- Validação de tipo e tamanho
- Loading state
- Toast de sucesso/erro

**Uso:**
```jsx
<UploadEssayForm
  taskId={taskId}
  onUploadSuccess={() => {
    // Atualiza lista
  }}
/>
```

### TaskDetailPage (Aluno)

**Features:**
- Exibe detalhes da tarefa
- Mostra prazo e status
- Upload de redação (se prazo aberto)
- Badge visual: "Redação Enviada" com ícone verde
- Botão "Ver Correção" (se corrigida)
- Botão "Visualizar Original"
- Botão "Deletar e reenviar" (se pending)
- Modal de confirmação para delete

**Status Automático:**
- Tarefa pendente → Aluno não enviou E prazo aberto
- Tarefa concluída → Aluno enviou OU prazo encerrado

---

## Sistema de Toast

### Zustand Store

```javascript
// src/shared/hooks/useToast.js
export const useToast = () => {
  return {
    success: (message, duration) => { /* ... */ },
    error: (message, duration) => { /* ... */ },
    warning: (message, duration) => { /* ... */ },
    info: (message, duration) => { /* ... */ },
  };
};
```

### Uso

```javascript
const toast = useToast();

// Sucesso
toast.success('Anotações salvas!');

// Erro
toast.error('Erro ao salvar');

// Com duração customizada
toast.success('Feito!', 5000);
```

### ToastContainer

Renderizado em `App.jsx`:

```jsx
<App>
  <AppRouter />
  <ToastContainer />
</App>
```

---

## Rotas e Navegação

### Rotas Públicas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | LoginPage | Login de aluno/professor |

### Rotas Privadas - Alunos

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | StudentHomePage | Tarefas pendentes/concluídas |
| `/tasks/:taskId` | TaskDetailPage | Detalhes + Upload |
| `/essays/:essayId/view` | EssayViewPage | ⭐ Visualizar correção (read-only) |

### Rotas Privadas - Professores

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/dashboard` | DashboardPage | Dashboard |
| `/classes` | ClassesPage | Listagem de turmas |
| `/classes/:id` | ClassTasksPage | Tarefas da turma |
| `/classes/:classId/tasks/:taskId` | TaskStudentsPage | Alunos da tarefa |
| `/essays/:essayId/correct` | EssayCorrectPage | ⭐ Corrigir redação (fullscreen) |

### Proteção de Rotas

```jsx
// Rota de aluno (apenas autenticação)
<Route path="/" element={
  <PrivateRoute>
    <MainLayout>
      <StudentHomePage />
    </MainLayout>
  </PrivateRoute>
} />

// Rota de professor (autenticação + RequireTeacher)
<Route path="/essays/:essayId/correct" element={
  <PrivateRoute>
    <RequireTeacher>
      <EssayCorrectPage />
    </RequireTeacher>
  </PrivateRoute>
} />
```

---

## Componentes Principais

### ConfirmationModal

Modal reutilizável para confirmações (substitui `window.confirm`).

**Props:**
- `isOpen` - boolean
- `onClose` - function
- `onConfirm` - function
- `title` - string
- `message` - string
- `confirmText` - string (default: "Confirmar")
- `cancelText` - string (default: "Cancelar")
- `variant` - 'danger' | 'primary' | 'success'
- `isLoading` - boolean

**Exemplo:**
```jsx
const [showModal, setShowModal] = useState(false);

<ConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDelete}
  title="Deletar Redação"
  message="Esta ação não pode ser desfeita."
  confirmText="Deletar"
  variant="danger"
  isLoading={isDeleting}
/>
```

### Button

Botão com variants, loading state e ícones.

**Props:**
- `variant` - 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
- `size` - 'sm' | 'md' | 'lg'
- `isLoading` - boolean
- `disabled` - boolean

**Exemplo:**
```jsx
<Button variant="primary" isLoading={isSaving}>
  <i className="bi bi-save" /> Salvar
</Button>
```

### StudentTaskCard

Card de tarefa com badges visuais.

**Badges:**
- ⚠️ Prazo encerrando em breve (laranja)
- ✅ Redação Enviada (verde)
- ❌ Prazo encerrado (vermelho/cinza)

**Exemplo:**
```jsx
<StudentTaskCard
  task={task}
  isPending={!task.hasSubmitted && deadlineOpen}
/>
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```bash
# Subir todos os serviços
docker-compose up

# Rebuild
docker-compose up --build

# Parar
docker-compose down
```

---

## Scripts Disponíveis

```bash
# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## Troubleshooting

### CORS Error

```javascript
// Backend deve ter:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // IMPORTANTE!
}));
```

### Cookies Não Enviados

1. Verifique `withCredentials: true` no Axios
2. Backend: `credentials: true` no CORS
3. Backend: Use `cookie-parser`
4. Use `localhost` (não `127.0.0.1`)

### Toasts Não Aparecem

1. Verifique se `<ToastContainer />` está em `App.jsx`
2. Use `toast.success()` não `toast.showToast()`
3. Não inclua `toast` em dependências de `useCallback`

---

## Contribuindo

1. Siga feature-based architecture
2. Use Tailwind CSS
3. Componentes reutilizáveis em `shared/`
4. Atualize documentação
5. Use ícones do Bootstrap Icons
6. Use ConfirmationModal ao invés de `window.confirm`

---

## Próximas Implementações

### ✅ COMPLETO
- [x] Autenticação com cookies httpOnly
- [x] CRUD de turmas e tarefas
- [x] Upload de redações
- [x] Sistema de anotações completo
- [x] Status automático de tarefas
- [x] Toast system
- [x] Modal de confirmação

### 🚧 EM PLANEJAMENTO
- [ ] Chat entre professor e aluno
- [ ] Notificações em tempo real (Socket.io)
- [ ] Dashboard com gráficos
- [ ] Exportar redações corrigidas (PDF)
- [ ] Sistema de notas/competências

---

**Última atualização:** 2025-12-17
**Versão:** 2.0.0
**Status:** ✅ Todas as fases completas | Sistema de Anotações 100% funcional
