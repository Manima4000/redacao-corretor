# Sistema de Correção de Redações

Sistema completo para professores corrigirem redações de alunos com anotações usando caneta de tablet.

## Stack Tecnológica

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT para autenticação
- Socket.io para notificações em tempo real
- Clean Architecture + SOLID

### Frontend (em desenvolvimento)
- React + Vite
- Fabric.js para anotações
- Axios para API
- React Router

## 🐳 Rodando com Docker

### Pré-requisitos
- Docker
- Docker Compose

### Iniciando o projeto

```bash
# Clonar repositório
git clone <seu-repo>
cd redação-corretor

# Iniciar todos os serviços (PostgreSQL + Backend)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Parar e remover volumes (apaga banco de dados)
docker-compose down -v
```

### Serviços rodando

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Health check**: http://localhost:3000/api/health
- **📖 Documentação Swagger**: http://localhost:3000/api-docs

### Endpoints disponíveis

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Dados do usuário autenticado

**📌 Acesse a documentação interativa completa no Swagger:** http://localhost:3000/api-docs

## 📁 Estrutura do Projeto

```
redação-corretor/
├── docker-compose.yml          # Configuração Docker
├── redacao-corretor-backend/   # Backend API
│   ├── src/
│   │   ├── application/        # Use Cases e DTOs
│   │   ├── domain/             # Entidades e Interfaces
│   │   ├── infrastructure/     # Implementações concretas
│   │   ├── config/             # Configurações
│   │   ├── utils/              # Utilitários
│   │   └── server.js           # Entry point
│   ├── Dockerfile
│   └── package.json
└── redacao-corretor-frontend/  # Frontend (em desenvolvimento)
```

## 🗄️ Banco de Dados

O banco PostgreSQL será criado automaticamente com as seguintes tabelas:
- `students` - Alunos
- `teachers` - Professores
- `classes` - Turmas
- `class_students` - Relação aluno-turma (many-to-many)
- `tasks` - Tarefas/temas de redação
- `essays` - Redações enviadas
- `annotations` - Anotações da professora (JSONB)
- `comments` - Chat entre professora e aluno
- `notifications` - Notificações

## 🔧 Desenvolvimento

### Backend

```bash
cd redacao-corretor-backend

# Instalar dependências
npm install

# Rodar migrations
npm run migrate

# Modo desenvolvimento
npm run dev

# Testes
npm test
```

## Princípios SOLID

O projeto segue rigorosamente os princípios SOLID:
- **SRP**: Cada classe tem uma responsabilidade única
- **OCP**: Aberto para extensão, fechado para modificação
- **LSP**: Interfaces substituíveis
- **ISP**: Interfaces segregadas
- **DIP**: Dependência de abstrações

## Licença

MIT
