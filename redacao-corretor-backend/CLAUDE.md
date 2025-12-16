# Redação Corretor - Documentação para IA

> **IMPORTANTE:** Este arquivo contém contexto essencial para qualquer IA trabalhando neste projeto. SEMPRE leia este arquivo antes de fazer alterações e SEMPRE o atualize quando o projeto evoluir.

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Princípios SOLID](#princípios-solid)
3. [Arquitetura Clean Architecture](#arquitetura-clean-architecture)
4. [Modelo de Dados](#modelo-de-dados)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Regras de Desenvolvimento](#regras-de-desenvolvimento)
7. [Documentação Swagger](#documentação-swagger)
8. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral do Projeto

### Propósito
Sistema web para professora corrigir redações de alunos de diferentes turmas, com anotações usando caneta de tablet.

### Funcionalidades Principais
- **Professora:** Criar turmas e tarefas, receber redações dos alunos, fazer anotações com caneta de tablet, enviar feedback
- **Aluno:** Ver tarefas da sua turma, enviar redações (fotos/PDF), receber correções com anotações

### Stack Tecnológica
- **Backend:** Node.js + Express.js + PostgreSQL
- **Frontend:** React (repositório separado)
- **Autenticação:** JWT (access token + refresh token)
- **Anotações:** Fabric.js (suporte a stylus pressure)
- **Notificações:** Socket.io (WebSocket)
- **Deploy:** Docker + Docker Compose

---

## Princípios SOLID

**Este projeto DEVE seguir RIGOROSAMENTE os princípios SOLID em TODAS as implementações.**

### S - Single Responsibility Principle (Princípio da Responsabilidade Única)
> "Uma classe deve ter um, e somente um, motivo para mudar."

**Como aplicamos:**
- **Use Cases:** Cada caso de uso faz UMA operação de negócio
  - ✅ `RegisterUseCase` - apenas registra usuários
  - ✅ `LoginUseCase` - apenas faz login
  - ❌ `AuthUseCase` - NÃO! Faz muitas coisas
- **Repositories:** Apenas acesso a dados, sem lógica de negócio
- **Controllers:** Apenas recebem requisições e chamam use cases
- **Services:** Cada serviço tem uma responsabilidade específica (AuthService, FileStorageService, NotificationService)

**Exemplo:**
```javascript
// ✅ BOM - Responsabilidade única
export class CreateTaskUseCase {
  constructor(taskRepository, notificationService) {
    this.taskRepository = taskRepository;
    this.notificationService = notificationService;
  }

  async execute(taskDTO) {
    // Apenas cria task e notifica alunos
    const task = await this.taskRepository.create(taskDTO);
    await this.notificationService.notifyStudentsOfNewTask(task);
    return task;
  }
}

// ❌ RUIM - Múltiplas responsabilidades
export class TaskManager {
  async createTask() { /* ... */ }
  async uploadEssay() { /* ... */ }  // Deveria ser outro use case!
  async sendNotification() { /* ... */ }  // Deveria ser no NotificationService!
}
```

### O - Open/Closed Principle (Princípio Aberto/Fechado)
> "Entidades devem estar abertas para extensão, mas fechadas para modificação."

**Como aplicamos:**
- Usamos **interfaces** para permitir diferentes implementações SEM modificar código existente
- Use Cases dependem de abstrações (interfaces), não implementações concretas

**Exemplo:**
```javascript
// Interface (abstração)
export class IFileStorageService {
  async upload(file) { throw new Error('Not implemented'); }
  async delete(fileUrl) { throw new Error('Not implemented'); }
}

// Implementação 1: Local
export class LocalFileStorageService extends IFileStorageService {
  async upload(file) { /* salva localmente */ }
  async delete(fileUrl) { /* deleta arquivo local */ }
}

// Implementação 2: AWS S3
export class S3FileStorageService extends IFileStorageService {
  async upload(file) { /* upload para S3 */ }
  async delete(fileUrl) { /* deleta do S3 */ }
}

// Use Case NÃO precisa mudar ao trocar implementação!
export class UploadEssayUseCase {
  constructor(essayRepository, fileStorageService) { // Interface!
    this.essayRepository = essayRepository;
    this.fileStorageService = fileStorageService; // Pode ser Local OU S3
  }

  async execute(file) {
    const fileUrl = await this.fileStorageService.upload(file);
    return await this.essayRepository.create({ fileUrl });
  }
}
```

### L - Liskov Substitution Principle (Princípio da Substituição de Liskov)
> "Subclasses devem ser substituíveis por suas classes base."

**Como aplicamos:**
- Qualquer implementação de `IStudentRepository` deve funcionar da mesma forma
- Se trocarmos `LocalFileStorageService` por `S3FileStorageService`, o sistema continua funcionando

**Exemplo:**
```javascript
// Use Case aceita QUALQUER implementação de IStudentRepository
export class GetStudentUseCase {
  constructor(studentRepository) { // IStudentRepository
    this.studentRepository = studentRepository;
  }

  async execute(studentId) {
    return await this.studentRepository.findById(studentId);
  }
}

// Ambas as implementações funcionam igualmente
const useCase1 = new GetStudentUseCase(new PostgresStudentRepository());
const useCase2 = new GetStudentUseCase(new MongoStudentRepository());
// Comportamento idêntico!
```

### I - Interface Segregation Principle (Princípio da Segregação de Interfaces)
> "Clientes não devem ser forçados a depender de interfaces que não usam."

**Como aplicamos:**
- Interfaces pequenas e específicas
- Se um use case só precisa buscar usuário por email, não force ele a depender de TODA a interface do repository

**Exemplo:**
```javascript
// ✅ BOM - Interfaces pequenas e específicas
export class IUserFinder {
  async findByEmail(email) { throw new Error('Not implemented'); }
}

export class IUserCreator {
  async create(userData) { throw new Error('Not implemented'); }
}

// Use Case só depende do que realmente usa
export class LoginUseCase {
  constructor(userFinder, authService) { // Só precisa de findByEmail
    this.userFinder = userFinder;
    this.authService = authService;
  }
}

// ❌ RUIM - Interface inchada
export class IUserRepository {
  async create() {}
  async findById() {}
  async findByEmail() {}
  async findAll() {}
  async update() {}
  async delete() {}
  async countByClass() {}
  async getStatistics() {}
  // LoginUseCase é forçado a depender de TUDO isso!
}
```

### D - Dependency Inversion Principle (Princípio da Inversão de Dependência)
> "Dependa de abstrações, não de implementações concretas."

**Como aplicamos:**
- Use Cases recebem **interfaces** via construtor (Dependency Injection)
- NUNCA instanciam dependências internamente com `new`

**Exemplo:**
```javascript
// ✅ BOM - Dependency Injection com interfaces
export class RegisterUseCase {
  constructor(studentRepository, teacherRepository, authService) { // Abstrações injetadas
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.authService = authService;
  }

  async execute(registerDTO) {
    // Usa as abstrações injetadas
    const student = await this.studentRepository.create(registerDTO);
    const token = this.authService.generateAccessToken(student);
    return { student, token };
  }
}

// ❌ RUIM - Instancia dependências concretas
export class RegisterUseCase {
  async execute(registerDTO) {
    const repo = new StudentRepository(); // Dependência concreta!
    const auth = new AuthService(); // Dependência concreta!
    // Impossível testar ou trocar implementação
  }
}

// Injeção de dependências no controller
const studentRepo = new StudentRepository();
const teacherRepo = new TeacherRepository();
const authService = new AuthService();
const registerUseCase = new RegisterUseCase(studentRepo, teacherRepo, authService);
```

---

## Arquitetura Clean Architecture

### Estrutura de Camadas

```
src/
├── domain/                    # Camada de Domínio (Regras de Negócio)
│   ├── entities/              # Entidades de negócio
│   │   ├── Student.js         # Aluno (NÃO User com role!)
│   │   ├── Teacher.js         # Professor (NÃO User com role!)
│   │   ├── Class.js           # Turma
│   │   ├── Task.js            # Tarefa/Tema
│   │   ├── Essay.js           # Redação
│   │   └── Annotation.js      # Anotações
│   ├── repositories/          # INTERFACES de repositórios
│   │   ├── IStudentRepository.js
│   │   ├── ITeacherRepository.js
│   │   ├── IClassRepository.js
│   │   └── ...
│   └── services/              # INTERFACES de serviços
│       ├── IAuthService.js
│       ├── IFileStorageService.js
│       └── INotificationService.js
│
├── application/               # Camada de Aplicação (Casos de Uso)
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── RegisterUseCase.js
│   │   │   ├── LoginUseCase.js
│   │   │   ├── RefreshTokenUseCase.js
│   │   │   └── GetCurrentUserUseCase.js
│   │   ├── classes/
│   │   │   ├── CreateClassUseCase.js
│   │   │   └── ...
│   │   ├── tasks/
│   │   ├── essays/
│   │   └── annotations/
│   └── dtos/                  # Data Transfer Objects
│       ├── RegisterDTO.js
│       ├── LoginDTO.js
│       └── ...
│
└── infrastructure/            # Camada de Infraestrutura (Implementações)
    ├── database/
    │   ├── config/
    │   │   └── database.js    # Pool PostgreSQL
    │   ├── migrations/        # Migrations
    │   │   ├── 001_create_teachers.js
    │   │   ├── 002_create_classes.js
    │   │   ├── 003_create_students.js
    │   │   ├── 004_create_tasks.js
    │   │   ├── 005_create_essays.js
    │   │   ├── 006_create_annotations.js
    │   │   └── 007_create_comments_and_notifications.js
    │   └── repositories/      # Implementações dos repositórios
    │       ├── StudentRepository.js
    │       ├── TeacherRepository.js
    │       └── ...
    ├── services/              # Implementações dos serviços
    │   ├── AuthService.js     # JWT + bcrypt
    │   ├── FileStorageService.js
    │   └── NotificationService.js
    └── http/
        ├── middleware/
        │   ├── authMiddleware.js
        │   ├── requireTeacher.js
        │   ├── errorHandler.js
        │   └── validate.js
        ├── controllers/
        │   ├── AuthController.js
        │   ├── ClassController.js
        │   └── ...
        ├── routes/
        │   ├── auth.routes.js
        │   ├── classes.routes.js
        │   └── ...
        └── validators/
            ├── authSchemas.js
            └── ...
```

### Fluxo de Dados

```
Request → Routes → Middleware → Controller → Use Case → Repository → Database
                                    ↓
                                 Response
```

**Exemplo completo de fluxo:**

1. **Route** (`auth.routes.js`):
```javascript
router.post('/register', validate(registerSchema), authController.register);
```

2. **Controller** (`AuthController.js`):
```javascript
async register(req, res, next) {
  try {
    const registerDTO = new RegisterDTO(req.body);
    const result = await this.registerUseCase.execute(registerDTO);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

3. **Use Case** (`RegisterUseCase.js`):
```javascript
async execute(registerDTO) {
  // Lógica de negócio
  const existingStudent = await this.studentRepository.findByEmail(registerDTO.email);
  if (existingStudent) throw new ConflictError('Email já cadastrado');

  const passwordHash = await this.authService.hashPassword(registerDTO.password);
  const student = await this.studentRepository.create({ ...registerDTO, passwordHash });

  const accessToken = this.authService.generateAccessToken(student);
  const refreshToken = this.authService.generateRefreshToken(student);

  return { student: student.toPublicData(), accessToken, refreshToken };
}
```

4. **Repository** (`StudentRepository.js`):
```javascript
async create(studentData) {
  const sql = `INSERT INTO students (...) VALUES (...) RETURNING *`;
  const result = await query(sql, values);
  return this._mapToEntity(result.rows[0]);
}
```

---

## Modelo de Dados

### ⚠️ ATENÇÃO: NÃO usamos `role`!

**IMPORTANTE:** Este projeto NÃO usa um modelo `User` com campo `role`. Usamos entidades SEPARADAS:
- ✅ `Student` (tabela `students`)
- ✅ `Teacher` (tabela `teachers`)
- ❌ `User` com `role` - NÃO EXISTE!

### Schema do Banco de Dados (PostgreSQL)

```sql
-- 1. TEACHERS (professores)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLASSES (turmas)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,              -- Ex: "Turma AFA", "Turma EFFOM"
  description TEXT,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS (alunos) - ⚠️ Cada aluno pertence a UMA turma específica
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  enrollment_number VARCHAR(50),           -- Matrícula
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,  -- ⚠️ ONE-TO-MANY!
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TASKS (tarefas/temas) - Cada task pertence a uma turma
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,               -- Tema da redação
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ESSAYS (redações)
CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,          -- URL do arquivo (S3 ou local)
  status VARCHAR(20) DEFAULT 'pending',    -- pending, correcting, corrected
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  corrected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ANNOTATIONS (anotações da professora)
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
  annotation_data JSONB NOT NULL,          -- Serialização do Fabric.js
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. COMMENTS (chat professora-aluno)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,                 -- ID do student OU teacher
  author_type VARCHAR(10) NOT NULL,        -- 'student' ou 'teacher'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                   -- ID do student OU teacher
  user_type VARCHAR(10) NOT NULL,          -- 'student' ou 'teacher'
  type VARCHAR(50) NOT NULL,               -- 'new_task', 'essay_submitted', etc
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relacionamentos

```
teachers (1) ──────< (N) classes
                           │
                           ├──< (N) students  ⚠️ ONE-TO-MANY!
                           │
                           └──< (N) tasks
                                    │
                                    └──< (N) essays ──< (N) annotations
                                                │
                                                └──< (N) comments
```

**⚠️ MUDANÇA IMPORTANTE:**
- Antes: `class_students` (many-to-many) - aluno podia estar em várias turmas
- Agora: `students.class_id` (one-to-many) - aluno tem UMA turma específica

---

## Autenticação e Autorização

### Estratégia: JWT com Refresh Token

**⚠️ IMPORTANTE:** NÃO usamos campo `role`! Usamos campo `type` com valores `'student'` ou `'teacher'`.

### Fluxo de Registro

```javascript
// DTO
export class RegisterDTO {
  constructor({ email, password, fullName, type, enrollmentNumber, specialization }) {
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.type = type; // ⚠️ 'student' ou 'teacher' (NÃO 'role'!)
    this.enrollmentNumber = enrollmentNumber; // Apenas para students
    this.specialization = specialization; // Apenas para teachers
  }

  isStudent() {
    return this.type === 'student';
  }

  isTeacher() {
    return this.type === 'teacher';
  }
}

// Use Case
export class RegisterUseCase {
  async execute(registerDTO) {
    // Verifica email em AMBAS as tabelas
    const existingStudent = await this.studentRepository.findByEmail(registerDTO.email);
    const existingTeacher = await this.teacherRepository.findByEmail(registerDTO.email);

    if (existingStudent || existingTeacher) {
      throw new ConflictError('Email já cadastrado');
    }

    const passwordHash = await this.authService.hashPassword(registerDTO.password);

    let user;
    if (registerDTO.isStudent()) {
      user = await this.studentRepository.create({
        email: registerDTO.email,
        passwordHash,
        fullName: registerDTO.fullName,
        enrollmentNumber: registerDTO.enrollmentNumber,
      });
    } else if (registerDTO.isTeacher()) {
      user = await this.teacherRepository.create({
        email: registerDTO.email,
        passwordHash,
        fullName: registerDTO.fullName,
        specialization: registerDTO.specialization,
      });
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return {
      user: user.toPublicData(),
      accessToken,
      refreshToken,
    };
  }
}
```

### Fluxo de Login

```javascript
export class LoginUseCase {
  async execute(loginDTO) {
    // Busca em AMBAS as tabelas
    let user = await this.studentRepository.findByEmail(loginDTO.email);
    if (!user) {
      user = await this.teacherRepository.findByEmail(loginDTO.email);
    }

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const isPasswordValid = await this.authService.comparePassword(
      loginDTO.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return {
      user: user.toPublicData(),
      accessToken,
      refreshToken,
    };
  }
}
```

### JWT Payload

```javascript
// AuthService.js
generateAccessToken(user) {
  const publicData = user.toPublicData();
  const payload = {
    id: publicData.id,
    email: publicData.email,
    userType: publicData.type, // ⚠️ 'student' ou 'teacher' (NÃO 'role'!)
    tokenType: 'access',
  };

  return jwt.sign(payload, this.jwtSecret, {
    expiresIn: '15m',
    issuer: 'redacao-corretor-api',
    audience: 'redacao-corretor-frontend',
  });
}
```

### Middleware de Autenticação

```javascript
// authMiddleware.js
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType, // ⚠️ 'student' ou 'teacher'
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Token inválido'));
  }
};

// requireTeacher.js
export const requireTeacher = (req, res, next) => {
  if (req.user.userType !== 'teacher') {
    return next(new ForbiddenError('Apenas professores podem acessar este recurso'));
  }
  next();
};
```

---

## Regras de Desenvolvimento

### 1. SEMPRE Siga SOLID

- ✅ Use Cases recebem dependências via construtor (DIP)
- ✅ Cada classe tem UMA responsabilidade (SRP)
- ✅ Use interfaces para abstrações (OCP, LSP, ISP)
- ❌ NUNCA instancie dependências com `new` dentro de use cases
- ❌ NUNCA coloque lógica de negócio em controllers ou repositories

### 2. SEMPRE Use `type`, NUNCA Use `role`

- ✅ `RegisterDTO.type` → `'student'` ou `'teacher'`
- ✅ `req.user.userType` → `'student'` ou `'teacher'`
- ✅ Entidades separadas: `Student` e `Teacher`
- ❌ `User` com campo `role`
- ❌ Tabela `users` com campo `role`

### 3. SEMPRE Atualize a Documentação

Quando você fizer QUALQUER mudança no projeto, você DEVE atualizar:

- ✅ **CLAUDE.md** (este arquivo) - Se mudar arquitetura, modelo de dados, ou regras
- ✅ **README.md** - Se mudar setup, comandos, ou endpoints
- ✅ **Swagger** - Se criar/modificar endpoints (veja seção abaixo)

### 4. Validação e Tratamento de Erros

```javascript
// DTOs fazem validação
export class RegisterDTO {
  validate() {
    if (!this.email || !this.email.includes('@')) {
      throw new ValidationError('Email inválido');
    }

    if (!this.password || this.password.length < 6) {
      throw new ValidationError('Senha deve ter pelo menos 6 caracteres');
    }

    if (!['student', 'teacher'].includes(this.type)) {
      throw new ValidationError('Tipo deve ser student ou teacher');
    }
  }
}

// Use Cases lançam erros específicos
throw new NotFoundError('Aluno');
throw new ConflictError('Email já cadastrado');
throw new UnauthorizedError('Credenciais inválidas');
throw new ForbiddenError('Apenas professores podem criar turmas');

// errorHandler middleware captura e formata
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  // ...
};
```

### 5. Nomenclatura

- **Entidades:** PascalCase, singular (`Student`, `Teacher`, `Class`)
- **Tabelas:** snake_case, plural (`students`, `teachers`, `classes`)
- **Campos DB:** snake_case (`full_name`, `created_at`, `class_id`)
- **Campos JS:** camelCase (`fullName`, `createdAt`, `classId`)
- **Use Cases:** PascalCase + "UseCase" (`RegisterUseCase`, `CreateTaskUseCase`)
- **Repositories:** PascalCase + "Repository" (`StudentRepository`)
- **Controllers:** PascalCase + "Controller" (`AuthController`)

---

## Documentação Swagger

### SEMPRE Documente Novos Endpoints!

Quando você criar ou modificar um endpoint, você DEVE adicionar documentação Swagger.

### Estrutura Básica

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     summary: Breve descrição
 *     description: Descrição detalhada do que o endpoint faz
 *     tags: [NomeDaTag]
 *     security:
 *       - bearerAuth: []    # Se requer autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campo1
 *             properties:
 *               campo1:
 *                 type: string
 *                 example: Exemplo do campo
 *     responses:
 *       201:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.post('/endpoint', authMiddleware, controller.method);
```

### Tags Disponíveis

Use estas tags para organizar endpoints:
- `Auth` - Autenticação e autorização
- `Classes` - Gerenciamento de turmas
- `Tasks` - Gerenciamento de tarefas/temas
- `Essays` - Upload e gerenciamento de redações
- `Annotations` - Anotações nas redações
- `Comments` - Chat entre professora e aluno
- `Notifications` - Notificações do sistema

### Schemas Reutilizáveis

Definidos em `src/config/swagger.js`:
- `#/components/schemas/Student` - Dados públicos do aluno
- `#/components/schemas/Teacher` - Dados públicos do professor
- `#/components/schemas/AuthResponse` - Resposta de autenticação
- `#/components/schemas/Error` - Padrão de erro

### Exemplo Completo

```javascript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria um novo aluno ou professor no sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@exemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *                 example: João Silva
 *               type:
 *                 type: string
 *                 enum: [student, teacher]
 *                 example: student
 *               enrollmentNumber:
 *                 type: string
 *                 description: Matrícula do aluno (apenas para type=student)
 *                 example: "2024001"
 *               specialization:
 *                 type: string
 *                 description: Especialização do professor (apenas para type=teacher)
 *                 example: Redação ENEM
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(registerSchema), authController.register);
```

### Checklist para Documentação

Ao criar um novo endpoint:
- [ ] Adicionou comentário `@swagger` na rota
- [ ] Especificou a tag correta
- [ ] Definiu `security: bearerAuth` se for endpoint autenticado
- [ ] Documentou todos os campos do requestBody
- [ ] Incluiu exemplos em todos os campos
- [ ] Documentou TODAS as respostas possíveis (200, 201, 400, 401, 403, 404, 500)
- [ ] Usou schemas reutilizáveis quando possível
- [ ] Testou no Swagger UI (http://localhost:3000/api-docs)

### Como Adicionar Novo Schema

Edite `src/config/swagger.js` e adicione em `components.schemas`:

```javascript
Class: {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
      example: 'Turma AFA',
    },
    description: {
      type: 'string',
      example: 'Turma preparatória para concurso AFA',
    },
    teacherId: {
      type: 'string',
      format: 'uuid',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
},
```

---

## Variáveis de Ambiente

### Backend (.env)

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=redacao_corretor
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/redacao_corretor

# JWT
JWT_SECRET=seu-secret-super-secreto-mude-em-producao
JWT_REFRESH_SECRET=seu-refresh-secret-super-secreto-mude-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Upload
UPLOAD_STORAGE_TYPE=local  # ou 's3'
UPLOAD_DIR=uploads
UPLOAD_MAX_SIZE=10485760  # 10MB

# AWS S3 (se UPLOAD_STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=redacao-corretor-files
```

---

## Comandos Úteis

### Docker

```bash
# Subir serviços
docker-compose up

# Subir com rebuild (após mudanças)
docker-compose up --build --force-recreate

# Parar serviços
docker-compose down

# Resetar banco de dados (⚠️ deleta todos os dados!)
docker-compose down -v
docker-compose up --build
```

### Migrations

```bash
# Rodar migrations
npm run migrate

# Rollback última migration
npm run migrate:rollback

# Resetar banco (rollback all + migrate)
npm run migrate:reset
```

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (hot reload)
npm run dev

# Modo produção
npm start
```

---

## Próximas Fases de Desenvolvimento

### ✅ Fase 1: Fundação (COMPLETO)
- [x] Estrutura de pastas Clean Architecture
- [x] Configuração PostgreSQL + Docker
- [x] Migrations (teachers, classes, students com class_id)
- [x] Autenticação completa (register, login, refresh)
- [x] Middleware (auth, requireTeacher, errorHandler, validate)
- [x] Documentação Swagger completa para Auth

### 🚧 Fase 2: Turmas e Tarefas (EM ANDAMENTO)
- [ ] CRUD de turmas (apenas professores)
- [ ] Listar alunos de uma turma
- [ ] CRUD de tarefas (por turma)
- [ ] Listar tarefas da turma do aluno

### 📋 Fase 3: Upload e Visualização
- [ ] Configurar multer + FileStorageService
- [ ] Upload de redações (JPEG, PNG, PDF)
- [ ] Visualização de redações
- [ ] Status tracking (pending/correcting/corrected)

### 🎨 Fase 4: Anotações (Core Feature)
- [ ] Integrar Fabric.js no frontend
- [ ] Componente AnnotatorCanvas com toolbar
- [ ] Suporte a stylus pressure
- [ ] Serialização → JSONB
- [ ] Auto-save a cada 5s

### 🔔 Fase 5: Notificações e Chat
- [ ] Configurar Socket.io
- [ ] NotificationService
- [ ] Sistema de comentários

### 📊 Fase 6: Dashboard e Relatórios
- [ ] Dashboard professor
- [ ] Dashboard aluno
- [ ] Gráficos com Recharts

---

## Lembre-se

1. **SEMPRE siga SOLID** em todas as implementações
2. **NÃO use `role`**, use `type` com entidades separadas (Student/Teacher)
3. **Cada aluno pertence a UMA turma** (students.class_id, não many-to-many)
4. **Cada tarefa é de uma turma** (todos os alunos da turma devem enviar)
5. **SEMPRE atualize documentação** (CLAUDE.md, README.md, Swagger)
6. **Use Dependency Injection** em todos os use cases
7. **Valide com DTOs**, trate erros com classes específicas
8. **Teste no Swagger** após criar endpoints

---

**Última atualização:** 2025-12-16
