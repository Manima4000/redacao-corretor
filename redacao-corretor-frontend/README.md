# Redação Corretor - Frontend

> Sistema web para correção de redações com anotações digitais usando caneta de tablet

**Stack:** React 19 + Vite + Tailwind CSS + Zustand + React Router + Axios

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Setup e Instalação](#setup-e-instalação)
- [Autenticação com Cookies HttpOnly](#autenticação-com-cookies-httponly)
- [Rotas e Navegação](#rotas-e-navegação)
- [Componentes Principais](#componentes-principais)
- [Docker](#docker)
- [Scripts Disponíveis](#scripts-disponíveis)

---

## Visão Geral

Frontend do sistema de correção de redações, permitindo que:
- **Professores:** Gerenciem turmas, criem tarefas, recebam redações e façam anotações com caneta de tablet
- **Alunos:** Visualizem tarefas, enviem redações e recebam feedback

### Features Implementadas (Fase 1 e 2)

- ✅ Autenticação com cookies httpOnly (mais seguro)
- ✅ Sidebar com navegação e botões de retorno
- ✅ Dashboard (placeholder)
- ✅ CRUD de turmas para professores
- ✅ Listagem de Tarefas por Turma (Em Andamento / Encerradas)
- ✅ Detalhes da Tarefa com Lista de Alunos (Entregas/Pendentes)
- ✅ Estatísticas de Entrega (Total, Entregas, Pendentes, Taxa)
- ✅ Sistema de rotas protegidas
- ✅ Estado global com Zustand
- ✅ Design responsivo com Tailwind CSS

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
| Konva + React-Konva | 10.0.12 / 19.2.1 | Canvas 2D (anotações) |
| Perfect-Freehand | 1.2.2 | Desenho suave de anotações |

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
│   │   ├── hooks/
│   │   │   └── useAuth.js        # Hook para acessar AuthStore
│   │   ├── services/
│   │   │   └── authService.js    # API calls (login, logout, refresh)
│   │   ├── store/
│   │   │   └── authStore.js      # Zustand store (apenas user, sem tokens)
│   │   └── pages/
│   │       └── LoginPage.jsx     # Página de login
│   │
│   ├── classes/                  # Gerenciamento de turmas
│   │   ├── components/
│   │   │   └── ClassCard.jsx     # Card de turma
│   │   ├── hooks/
│   │   │   ├── useClasses.js     # Hook para buscar turmas
│   │   │   └── useClassDetails.js  # Hook para detalhes da turma
│   │   ├── services/
│   │   │   └── classService.js   # API calls
│   │   └── pages/
│   │       ├── ClassesPage.jsx   # Página de turmas (grid + modal)
│   │       └── ClassTasksPage.jsx# Detalhes da turma + Tarefas
│   │
│   ├── tasks/                    # Gerenciamento de tarefas
│   │   ├── components/
│   │   │   └── StudentListItem.jsx # Card de aluno com status
│   │   ├── hooks/
│   │   │   └── useTaskStudents.js # Hook para buscar alunos da tarefa
│   │   ├── services/
│   │   │   └── taskService.js    # API calls
│   │   └── pages/
│   │       └── TaskStudentsPage.jsx # Detalhes da tarefa + Lista de alunos  
│   │
│   ├── dashboard/
│   │   └── pages/
│   │       └── DashboardPage.jsx # Dashboard (placeholder)
│   │
│   └── annotations/              # Sistema de anotações
│       ├── components/
│       │   └── AnnotationDemo.jsx # Demo de anotações com Konva
│       ├── hooks/
│       │   ├── useStylus.js      # Detecção de caneta/touch/mouse
│       │   └── useCanvasZoom.js  # Zoom e pan
│       └── utils/
│           └── freehandHelper.js # Utilitários perfect-freehand
│
└── shared/                       # Compartilhado
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx       # Menu lateral fixo
    │   │   └── MainLayout.jsx    # Layout com sidebar + content
    │   └── ui/
    │       ├── Button.jsx        # Botão reutilizável (4 variants)
    │       ├── Card.jsx          # Card reutilizável
    │       └── Spinner.jsx       # Loading spinner
    ├── services/
    │   └── api.js                # Instância Axios configurada
    └── constants/
        └── routes.js             # Constantes de rotas
```

### Padrão de Organização

**Feature-based architecture:**
- Cada feature é independente e auto-contida
- Facilita escalabilidade e manutenção
- Componentes compartilhados em `shared/`

**Estrutura típica de uma feature:**
```
features/nome-da-feature/
├── components/        # Componentes React específicos
├── hooks/            # Custom hooks
├── services/         # API calls
├── pages/            # Páginas (rotas)
└── utils/            # Funções utilitárias
```

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
# Edite .env.local e configure VITE_API_URL

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse http://localhost:5173
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL da API backend
VITE_API_URL=http://localhost:3000/api
```

⚠️ **Importante:** Variáveis no Vite DEVEM começar com `VITE_` para serem expostas ao cliente.

---

## Autenticação com Cookies HttpOnly

### Por Que Cookies HttpOnly?

O sistema usa **cookies httpOnly** ao invés de localStorage para armazenar tokens JWT.

**Vantagens:**
- ✅ **Mais seguro:** Cookies httpOnly não podem ser acessados por JavaScript (previne XSS)
- ✅ **Automático:** Browser envia cookies em todas as requisições automaticamente
- ✅ **Flags de segurança:** `secure` (HTTPS), `sameSite=strict` (previne CSRF)

**Tokens:**
- `accessToken` - 15 minutos (para requisições autenticadas)
- `refreshToken` - 7 dias (para renovar accessToken)

### Como Funciona

**1. Login/Register:**
```javascript
// Frontend envia credenciais
POST /api/auth/login
{
  "email": "professor@exemplo.com",
  "password": "senha123"
}

// Backend responde:
// - Define cookies httpOnly (accessToken, refreshToken)
// - Retorna apenas dados do usuário (SEM tokens no body)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "professor@exemplo.com",
      "fullName": "Nome Professor",
      "type": "teacher"
    }
  }
}

// Frontend salva user no Zustand
// Tokens ficam nos cookies (inacessíveis via JS)
```

**2. Requisições Autenticadas:**
```javascript
// Frontend faz requisição
GET /api/classes

// Axios envia cookies automaticamente (withCredentials: true)
Cookie: accessToken=eyJhbGc...

// Backend lê token do cookie
// Valida e retorna dados
```

**3. Refresh Token Automático:**
```javascript
// 1. Token expira → API retorna 401
// 2. Interceptor detecta 401
// 3. Chama POST /api/auth/refresh (refreshToken no cookie)
// 4. Backend define novo accessToken
// 5. Retenta requisição original
// 6. Se refresh falhar → redireciona para /login
```

### Configuração Axios

```javascript
// src/shared/services/api.js
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // ⚠️ CRUCIAL: Envia cookies
});

// Response interceptor para refresh automático
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Tenta refresh
      await axios.post('/auth/refresh', {}, { withCredentials: true });
      // Retenta requisição original
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### Zustand Store

**⚠️ IMPORTANTE:** O store NÃO armazena tokens (estão em cookies httpOnly).

```javascript
// src/features/auth/store/authStore.js
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,              // Dados do usuário (não sensível)
      isAuthenticated: false,  // Flag de autenticação

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Helpers
      isTeacher: () => get().user?.type === 'teacher',
      isStudent: () => get().user?.type === 'student',
    }),
    { name: 'auth-storage' } // Persiste em localStorage
  )
);
```

**O que é persistido:**
- ✅ `user` - Dados públicos do usuário
- ✅ `isAuthenticated` - Flag booleana
- ❌ `accessToken` - NÃO (está em cookie httpOnly)
- ❌ `refreshToken` - NÃO (está em cookie httpOnly)

---

## Rotas e Navegação

### Rotas Públicas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | LoginPage | Login de aluno/professor |
| `/register` | RegisterPage | Registro (futura implementação) |

### Rotas Privadas (Requer autenticação)

| Rota | Componente | Proteção | Descrição |
|------|------------|----------|-----------|
| `/dashboard` | DashboardPage | Auth | Dashboard com estatísticas |
| `/classes` | ClassesPage | Auth + Teacher | Listagem de turmas |
| `/classes/:id` | ClassTasksPage | Auth + Teacher | Tarefas da turma (Em Andamento/Encerradas) |
| `/classes/:classId/tasks/:taskId` | TaskStudentsPage | Auth + Teacher | Detalhes da tarefa + Lista de alunos |
| `/profile` | ProfilePage | Auth | Perfil do usuário (futuro) |

### Proteção de Rotas

```javascript
// src/app/router/PrivateRoute.jsx
export const PrivateRoute = ({ children, requireTeacher = false }) => {
  const { isAuthenticated, user } = useAuth();

  // Não autenticado → redireciona para /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Requer professor mas é aluno → redireciona para /dashboard
  if (requireTeacher && user?.type !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
```

**Uso:**
```jsx
<Route
  path="/classes"
  element={
    <PrivateRoute requireTeacher={true}>
      <MainLayout>
        <ClassesPage />
      </MainLayout>
    </PrivateRoute>
  }
/>
```

---

## Componentes Principais

### Button

Botão reutilizável com variants e loading state.

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'`
- `size`: `'sm' | 'md' | 'lg'`
- `isLoading`: boolean
- `disabled`: boolean

**Exemplo:**
```jsx
<Button variant="primary" size="md" isLoading={false}>
  Enviar
</Button>
```

### Card

Container com sombra e bordas arredondadas.

**Props:**
- `onClick`: function (opcional, torna clicável)
- `className`: string (classes adicionais)

**Exemplo:**
```jsx
<Card onClick={() => navigate('/details')}>
  <h3>Título</h3>
  <p>Conteúdo</p>
</Card>
```

### Sidebar

Menu lateral fixo com navegação e logout.

**Features:**
- Detecta tipo de usuário (Professor/Aluno)
- Navegação com NavLink (destaque na rota ativa)
- Botão de logout com confirmação
- Design responsivo

### MainLayout

Layout wrapper que adiciona Sidebar + área de conteúdo.

**Exemplo:**
```jsx
<MainLayout>
  <YourPageContent />
</MainLayout>
```

---

## Docker

### Dockerfile (Produção)

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ""
      POSTGRES_USER: ""
      POSTGRES_PASSWORD: ""

  backend:
    build: ./redacao-corretor-backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: ""

  frontend:
    build: ./redacao-corretor-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:3000/api
```

**Comandos:**
```bash
# Subir todos os serviços
docker-compose up

# Rebuild após mudanças
docker-compose up --build

# Parar
docker-compose down

# Ver logs
docker-compose logs -f frontend
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

## Estrutura de Dados do Backend

### User Types

O sistema usa entidades **separadas** (não há campo `role`):
- ✅ `Student` (tabela `students`)
- ✅ `Teacher` (tabela `teachers`)
- ❌ `User` com `role` - NÃO EXISTE!

**JWT Payload:**
```javascript
{
  id: "uuid",
  email: "user@exemplo.com",
  userType: "teacher", // ou "student"
  tokenType: "access"
}
```

### Relacionamentos

```
teachers (1) ──────< (N) classes
                           │
                           ├──< (N) students
                           │
                           └──< (N) tasks
                                    │
                                    └──< (N) essays ──< (N) annotations
```

---

## Próximas Implementações

### Fase 2 - Tasks ✅ COMPLETA
- [x] Página de detalhes da turma
- [x] CRUD de tarefas
- [x] Listagem de tasks separada: "Em Andamento" / "Concluídas"
- [x] Página de detalhes da tarefa com lista de alunos
- [x] Estatísticas de entrega (Total, Entregas, Pendentes, Taxa)
- [x] Separação visual: Entregas Realizadas vs Pendentes

### Fase 3 - Essays (EM ANDAMENTO)
- [ ] Integração com Google Drive para storage de imagens
- [ ] Validação de arquivos (tipo, tamanho, metadados)
- [ ] Upload de redações (JPEG, PNG, PDF)
- [ ] Preview de redações
- [ ] Atualização de status de entrega em tempo real

### Fase 4 - Annotations
- [ ] Integrar AnnotationDemo com essays
- [ ] Toolbar de anotações (cores, espessuras)
- [ ] Salvar anotações no backend
- [ ] Exportar redações corrigidas

### Fase 5 - Real-time
- [ ] Socket.io para notificações
- [ ] Chat entre professor e aluno
- [ ] Notificações de novas tarefas/correções

---

## Troubleshooting

### CORS Error

**Problema:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solução:** Certifique-se de que o backend tem:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // IMPORTANTE!
}));
```

### Cookies Não Sendo Enviados

**Problema:** Cookies não aparecem nas requisições

**Solução:**
1. Verifique `withCredentials: true` no Axios
2. Backend deve ter `credentials: true` no CORS
3. Backend deve usar `cookie-parser` middleware
4. Cookies só funcionam com `http://localhost` ou HTTPS (não `127.0.0.1`)

### Redirect Loop no Login

**Problema:** Redireciona infinitamente entre login e dashboard

**Solução:**
1. Limpe localStorage: `localStorage.clear()`
2. Limpe cookies do navegador
3. Faça login novamente

---

## Contribuindo

Ao fazer mudanças:
1. Siga a estrutura feature-based
2. Use Tailwind CSS (evite CSS customizado)
3. Crie componentes reutilizáveis em `shared/`
4. Atualize este README se adicionar features importantes
5. Use commits semânticos

---

## Suporte

- **Backend API:** http://localhost:3000/api-docs (Swagger)
- **Issues:** <link-do-repo>/issues

---

**Última atualização:** 2025-12-16
**Versão:** 1.0.0
**Status:** ✅ Fase 1 Completa (Auth + Dashboard + Turmas)
