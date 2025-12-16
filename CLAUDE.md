# CLAUDE.md - Contexto do Projeto

> **IMPORTANTE**: Este arquivo deve ser atualizado sempre que houver mudanças significativas no projeto.

---

## 📋 Sobre o Projeto

Sistema web para correção de redações onde professores podem criar tarefas, alunos enviam redações (fotos/PDFs), e professores corrigem usando anotações com caneta de tablet.

### Stack Tecnológica

**Backend:**
- Node.js + Express.js
- PostgreSQL
- JWT (autenticação)
- Socket.io (notificações em tempo real)
- Multer (upload de arquivos)
- Docker + Docker Compose

**Frontend (em desenvolvimento):**
- React + Vite
- Fabric.js (anotações com caneta)
- Axios
- React Router

---

## 🏗️ Arquitetura - Clean Architecture + SOLID

### Princípio Fundamental: SEMPRE SEGUIR SOLID

**Toda mudança no código DEVE seguir os princípios SOLID:**

1. **Single Responsibility Principle (SRP)**
   - Cada classe/função tem UMA responsabilidade
   - Use Cases fazem apenas uma coisa
   - Controllers apenas recebem requests e delegam
   - Repositories apenas acessam banco de dados

2. **Open/Closed Principle (OCP)**
   - Aberto para extensão, fechado para modificação
   - Use interfaces para permitir diferentes implementações
   - Exemplo: `IStudentRepository` pode ter implementação PostgreSQL, MongoDB, etc

3. **Liskov Substitution Principle (LSP)**
   - Qualquer implementação de interface pode substituir outra
   - `StudentRepository` e `TeacherRepository` podem ser trocados sem quebrar código

4. **Interface Segregation Principle (ISP)**
   - Interfaces pequenas e específicas
   - Não force dependências desnecessárias

5. **Dependency Inversion Principle (DIP)**
   - Dependa de abstrações, não de implementações concretas
   - Use Cases recebem interfaces via Dependency Injection
   - Exemplo: `constructor(studentRepository, authService)` - não instancia dentro

---

## 📁 Estrutura do Backend

```
redacao-corretor-backend/
├── src/
│   ├── application/              # Camada de Aplicação
│   │   ├── use-cases/            # Casos de uso (lógica de negócio)
│   │   │   ├── auth/             # RegisterUseCase, LoginUseCase, RefreshTokenUseCase
│   │   │   ├── tasks/            # (a implementar)
│   │   │   ├── essays/           # (a implementar)
│   │   │   ├── classes/          # (a implementar)
│   │   │   ├── notifications/    # (a implementar)
│   │   │   └── comments/         # (a implementar)
│   │   └── dtos/                 # Data Transfer Objects (validação)
│   │
│   ├── domain/                   # Camada de Domínio (regras de negócio)
│   │   ├── entities/             # Entidades do domínio
│   │   │   ├── Student.js        # ✅ Aluno
│   │   │   ├── Teacher.js        # ✅ Professor
│   │   │   ├── Class.js          # ✅ Turma
│   │   │   ├── Task.js           # ✅ Tarefa
│   │   │   ├── Essay.js          # ✅ Redação
│   │   │   ├── Annotation.js     # ✅ Anotação
│   │   │   ├── Comment.js        # ✅ Comentário
│   │   │   └── Notification.js   # ✅ Notificação
│   │   ├── repositories/         # Interfaces (contratos)
│   │   │   ├── IStudentRepository.js
│   │   │   ├── ITeacherRepository.js
│   │   │   └── (outras interfaces...)
│   │   └── services/             # Interfaces de serviços
│   │       ├── IAuthService.js
│   │       ├── IFileStorageService.js
│   │       └── INotificationService.js
│   │
│   ├── infrastructure/           # Camada de Infraestrutura (implementações)
│   │   ├── database/
│   │   │   ├── config/
│   │   │   │   └── database.js   # Pool de conexões PostgreSQL
│   │   │   ├── migrations/       # 7 migrations (students, teachers, classes, etc)
│   │   │   │   ├── 001_create_students_teachers.js  # ✅
│   │   │   │   ├── 002_create_classes.js            # ✅
│   │   │   │   ├── 003_create_tasks.js              # ✅
│   │   │   │   ├── 004_create_essays.js             # ✅
│   │   │   │   ├── 005_create_annotations.js        # ✅
│   │   │   │   ├── 006_create_comments.js           # ✅
│   │   │   │   └── 007_create_notifications.js      # ✅
│   │   │   └── repositories/     # Implementações concretas
│   │   │       ├── StudentRepository.js  # ✅
│   │   │       └── TeacherRepository.js  # ✅
│   │   ├── services/
│   │   │   ├── AuthService.js             # ✅ JWT + bcrypt
│   │   │   ├── FileStorageService.js      # (a implementar)
│   │   │   └── NotificationService.js     # (a implementar)
│   │   └── http/
│   │       ├── middleware/
│   │       │   ├── authMiddleware.js      # ✅ Verifica JWT
│   │       │   ├── roleMiddleware.js      # ✅ Verifica tipo (student/teacher)
│   │       │   ├── errorHandler.js        # ✅ Tratamento global de erros
│   │       │   └── validationMiddleware.js # ✅ Validação com Joi
│   │       ├── controllers/
│   │       │   └── AuthController.js      # ✅
│   │       ├── routes/
│   │       │   ├── auth.routes.js         # ✅
│   │       │   └── index.js               # ✅
│   │       └── validators/
│   │           └── authValidators.js      # ✅ Schemas Joi
│   │
│   ├── config/
│   │   └── env.js                # Configurações centralizadas
│   ├── utils/
│   │   ├── errors.js             # Classes de erro customizadas
│   │   └── logger.js             # Winston logger
│   └── server.js                 # ✅ Entry point
│
├── Dockerfile                    # ✅
├── .dockerignore                 # ✅
├── .env                          # ✅
└── package.json                  # ✅
```

---

## 🗄️ Modelo de Dados (PostgreSQL)

### Tabelas Principais

**students** - Tabela de alunos
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `enrollment_number` (VARCHAR, opcional)
- `created_at`, `updated_at`

**teachers** - Tabela de professores
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `specialization` (VARCHAR, opcional)
- `created_at`, `updated_at`

**classes** - Turmas (AFA, EFFOM, etc)
- `id` (UUID, PK)
- `name` (VARCHAR) - Ex: "Turma AFA"
- `description` (TEXT)
- `teacher_id` (FK → teachers)
- `created_at`, `updated_at`

**class_students** - Relação many-to-many
- `class_id` (FK → classes)
- `student_id` (FK → students)
- `enrolled_at`

**tasks** - Tarefas/temas de redação
- `id` (UUID, PK)
- `title`, `description`
- `class_id` (FK → classes)
- `teacher_id` (FK → teachers)
- `deadline` (TIMESTAMP)
- `created_at`, `updated_at`

**essays** - Redações enviadas
- `id` (UUID, PK)
- `task_id` (FK → tasks)
- `student_id` (FK → students)
- `file_url` (VARCHAR) - URL do arquivo
- `file_type` (VARCHAR) - MIME type
- `status` (ENUM: pending, correcting, corrected)
- `submitted_at`, `corrected_at`
- UNIQUE(task_id, student_id) - Um aluno só pode enviar uma redação por tarefa

**annotations** - Anotações da professora
- `id` (UUID, PK)
- `essay_id` (FK → essays)
- `annotation_data` (JSONB) - Serialização do Fabric.js
- `page_number` (INTEGER) - Para PDFs com múltiplas páginas
- `created_at`, `updated_at`

**comments** - Chat entre professora e aluno
- `id` (UUID, PK)
- `essay_id` (FK → essays)
- `author_id` (UUID) - ID do autor
- `author_type` (ENUM: student, teacher) - Tipo do autor
- `content` (TEXT)
- `created_at`

**notifications** - Notificações
- `id` (UUID, PK)
- `recipient_id` (UUID) - ID do destinatário
- `recipient_type` (ENUM: student, teacher) - Tipo do destinatário
- `type` (VARCHAR) - Tipo de notificação
- `title`, `message`
- `related_id` (UUID) - ID relacionado (task, essay, etc)
- `is_read` (BOOLEAN)
- `created_at`

---

## 🔐 Sistema de Autenticação

### JWT com Access + Refresh Token

**Access Token:**
- Duração: 15 minutos
- Payload: `{ id, email, userType, tokenType: 'access' }`
- Usado em todas as requisições autenticadas

**Refresh Token:**
- Duração: 7 dias
- Payload: `{ id, tokenType: 'refresh' }`
- Usado para renovar access token

### Fluxo de Autenticação

1. **Registro:** `POST /api/auth/register`
   - Aceita: `{ email, password, fullName, type, enrollmentNumber?, specialization? }`
   - Retorna: `{ user, accessToken, refreshToken }`
   - Cria Student OU Teacher baseado no `type`

2. **Login:** `POST /api/auth/login`
   - Aceita: `{ email, password }`
   - Busca em ambas tabelas (students e teachers)
   - Retorna: `{ user, accessToken, refreshToken }`

3. **Refresh:** `POST /api/auth/refresh`
   - Aceita: `{ refreshToken }`
   - Retorna: `{ accessToken, user }`

4. **Me:** `GET /api/auth/me`
   - Header: `Authorization: Bearer <accessToken>`
   - Retorna: `{ user }` (dados do usuário logado)

---

## 📖 Documentação da API (Swagger)

### Acessar Documentação

Quando o servidor estiver rodando, acesse:

- **Interface Swagger UI:** http://localhost:3000/api-docs
- **JSON OpenAPI:** http://localhost:3000/api-docs.json

### Como Documentar Novos Endpoints

**OBRIGATÓRIO:** Sempre adicione documentação Swagger ao criar novos endpoints!

**Exemplo de documentação em routes:**

```javascript
/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Criar nova turma
 *     description: Cria uma nova turma (apenas professores)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Turma AFA
 *               description:
 *                 type: string
 *                 example: Turma preparatória para AFA
 *     responses:
 *       201:
 *         description: Turma criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Apenas professores podem criar turmas
 */
router.post('/classes', authMiddleware, requireTeacher, classController.create);
```

### Estrutura da Documentação

**Tags disponíveis:**
- `Auth` - Autenticação
- `Classes` - Turmas
- `Tasks` - Tarefas/Temas
- `Essays` - Redações
- `Annotations` - Anotações
- `Comments` - Chat
- `Notifications` - Notificações

**Schemas principais:**
- `Student` - Dados do aluno
- `Teacher` - Dados do professor
- `AuthResponse` - Resposta de autenticação
- `Error` - Padrão de erro

**Security Schemes:**
- `bearerAuth` - Token JWT no header `Authorization: Bearer <token>`

### Regras para Documentação

1. **Sempre documente** todos os endpoints
2. **Inclua exemplos** em todos os campos
3. **Especifique tipos** e validações (required, minLength, etc)
4. **Documente erros** possíveis (400, 401, 403, 404, 500)
5. **Use schemas** reutilizáveis (defina em `src/config/swagger.js`)
6. **Adicione descrições** claras do que o endpoint faz

### Como Testar via Swagger

1. Acesse http://localhost:3000/api-docs
2. Expanda o endpoint desejado
3. Clique em "Try it out"
4. Preencha os parâmetros
5. Para endpoints autenticados:
   - Clique no botão "Authorize" (cadeado)
   - Cole o access token
   - Clique em "Authorize"
6. Execute a requisição

---

## 🐳 Docker

### Como Rodar

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down

# Rebuild (após mudanças)
docker-compose up --build --force-recreate
```

### Serviços

- **postgres** - PostgreSQL 15 (porta 5432)
- **backend** - API Node.js (porta 3000)

---

## ✅ Status Atual do Projeto

### Implementado (Backend)

- ✅ Estrutura completa de pastas (Clean Architecture)
- ✅ Docker + Docker Compose
- ✅ PostgreSQL com 7 migrations
- ✅ Entidades de domínio (Student, Teacher, Class, Task, Essay, etc)
- ✅ Repositories (StudentRepository, TeacherRepository)
- ✅ AuthService (JWT + bcrypt)
- ✅ Use Cases de autenticação (Register, Login, Refresh)
- ✅ Controllers e rotas de autenticação
- ✅ Middleware (auth, role, error handling, validation)
- ✅ Sistema de erros customizados
- ✅ Logger (Winston)
- ✅ Validação com Joi

### Próximas Implementações

**Fase 2 - Turmas e Tarefas:**
- ❌ ClassRepository
- ❌ TaskRepository
- ❌ Use Cases de turmas (CRUD)
- ❌ Use Cases de tarefas (CRUD)
- ❌ Controllers e rotas

**Fase 3 - Upload e Redações:**
- ❌ FileStorageService (Multer + S3 ou local)
- ❌ EssayRepository
- ❌ Use Cases de redações
- ❌ Upload middleware
- ❌ Controllers e rotas

**Fase 4 - Anotações (Core Feature):**
- ❌ AnnotationRepository
- ❌ Use Cases de anotações
- ❌ Controllers e rotas
- ❌ Frontend: Integração Fabric.js

**Fase 5 - Notificações:**
- ❌ NotificationService (Socket.io)
- ❌ NotificationRepository
- ❌ Use Cases de notificações
- ❌ WebSocket server

**Fase 6 - Chat:**
- ❌ CommentRepository
- ❌ Use Cases de comentários
- ❌ Real-time chat com Socket.io

**Fase 7 - Frontend:**
- ❌ Estrutura React
- ❌ AuthContext
- ❌ Páginas de login/registro
- ❌ Dashboard aluno/professor
- ❌ Componente de anotações (Fabric.js)

---

## 📝 REGRAS DE DESENVOLVIMENTO

### 🚨 SEMPRE FAZER (OBRIGATÓRIO)

1. **Seguir Princípios SOLID**
   - Toda nova classe/função deve seguir SRP
   - Use Dependency Injection
   - Dependa de interfaces, não implementações

2. **Atualizar Documentação**
   - Após QUALQUER mudança significativa, atualize:
     - ✅ `CLAUDE.md` (este arquivo)
     - ✅ `README.md` (instruções de uso)
     - ✅ Swagger/OpenAPI (quando implementado)
   - Adicione comentários JSDoc nas funções públicas

3. **Estrutura de Código**
   - **Use Case** para lógica de negócio
   - **Repository** para acesso a dados
   - **Controller** apenas delega para Use Cases
   - **DTO** para validação de entrada
   - **Entity** para regras de domínio

4. **Tratamento de Erros**
   - Use classes de erro customizadas (`AppError`, `ValidationError`, etc)
   - Sempre propague erros para o middleware global
   - Não use `console.log` - use `logger`

5. **Validação**
   - Use Joi para validação de entrada
   - DTOs devem validar dados
   - Entidades devem validar regras de negócio

6. **Testes**
   - Escreva testes para Use Cases
   - Testes de integração para Controllers
   - Testes E2E para fluxos completos

### 🚫 NUNCA FAZER

1. **Não quebrar SOLID**
   - Não coloque lógica de negócio em Controllers
   - Não acesse banco direto de Controllers
   - Não instancie dependências dentro de classes

2. **Não usar `role` - use `type`**
   - Temos entidades separadas: Student e Teacher
   - Não existe mais campo `role`
   - Use `userType` no JWT

3. **Não misturar camadas**
   - Domain não conhece Infrastructure
   - Application não conhece HTTP
   - Infrastructure implementa interfaces do Domain

4. **Não commitar**
   - `.env` com secrets reais
   - `node_modules/`
   - Logs
   - Uploads

---

## 🔄 Fluxo de Implementação de Nova Feature

### Exemplo: Implementar CRUD de Turmas

1. **Domain Layer**
   ```javascript
   // 1. Entidade já existe: src/domain/entities/Class.js ✅

   // 2. Criar interface
   // src/domain/repositories/IClassRepository.js
   export class IClassRepository {
     async create(classData) { throw new Error('Not implemented'); }
     async findById(id) { throw new Error('Not implemented'); }
     // ... outros métodos
   }
   ```

2. **Infrastructure Layer**
   ```javascript
   // 3. Implementar repository
   // src/infrastructure/database/repositories/ClassRepository.js
   export class ClassRepository extends IClassRepository {
     async create(classData) {
       // Implementação com PostgreSQL
     }
   }
   ```

3. **Application Layer**
   ```javascript
   // 4. Criar DTO
   // src/application/dtos/CreateClassDTO.js
   export class CreateClassDTO {
     constructor({ name, description, teacherId }) {
       this.validate();
     }
   }

   // 5. Criar Use Case
   // src/application/use-cases/classes/CreateClassUseCase.js
   export class CreateClassUseCase {
     constructor(classRepository) { // DI!
       this.classRepository = classRepository;
     }

     async execute(createClassDTO) {
       // Lógica de negócio
     }
   }
   ```

4. **HTTP Layer**
   ```javascript
   // 6. Criar validator
   // src/infrastructure/http/validators/classValidators.js

   // 7. Criar controller
   // src/infrastructure/http/controllers/ClassController.js

   // 8. Criar rotas
   // src/infrastructure/http/routes/classes.routes.js

   // 9. Registrar no index
   // src/infrastructure/http/routes/index.js
   router.use('/classes', classRoutes);
   ```

5. **Documentação**
   ```markdown
   // 10. Atualizar CLAUDE.md (este arquivo)
   // 11. Atualizar README.md
   // 12. Adicionar no Swagger
   ```

---

## 🧪 Testes

### Como Testar

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Estrutura de Testes

```
tests/
├── unit/              # Testes unitários (Use Cases, Entities)
├── integration/       # Testes de integração (Repositories, Controllers)
└── e2e/               # Testes end-to-end (fluxos completos)
```

---

## 📚 Referências Úteis

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🤝 Contribuindo

Ao fazer mudanças:
1. Siga os princípios SOLID
2. Mantenha a estrutura de Clean Architecture
3. Adicione testes
4. Atualize documentação (CLAUDE.md, README.md, Swagger)
5. Use commits semânticos

---

**Última atualização:** 2025-12-16
**Versão do Backend:** 1.0.0 (Autenticação + Swagger implementados)
**Status:** ✅ Backend Phase 1 completo - Pronto para Phase 2 (Turmas e Tarefas)
