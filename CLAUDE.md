# Redação Corretor - Documentação para IA

> **IMPORTANTE:** Este arquivo contém contexto essencial para qualquer IA trabalhando neste projeto. SEMPRE leia este arquivo antes de fazer alterações e SEMPRE o atualize quando o projeto evoluir.

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Princípios SOLID](#princípios-solid)
3. [Arquitetura Clean Architecture](#arquitetura-clean-architecture)
4. [Modelo de Dados](#modelo-de-dados)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Upload de Arquivos e Google Drive](#upload-de-arquivos-e-google-drive)
7. [Regras de Desenvolvimento](#regras-de-desenvolvimento)
8. [Documentação Swagger](#documentação-swagger)
9. [Variáveis de Ambiente](#variáveis-de-ambiente)

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
- **Autenticação:** JWT (access token + refresh token em cookies httpOnly)
- **Storage:** Google Drive API (redações dos alunos)
- **Upload:** Multer + Sharp (validação e processamento de imagens)
- **Validação:** file-type (verificação de assinatura binária)
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
- **Services:** Cada serviço tem uma responsabilidade específica (AuthService, FileStorageService)

**Exemplo:**
```javascript
// ✅ BOM - Responsabilidade única
export class CreateTaskUseCase {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskDTO) {
    // Apenas cria task
    const task = await this.taskRepository.create(taskDTO);
    return task;
  }
}

// ❌ RUIM - Múltiplas responsabilidades
export class TaskManager {
  async createTask() { /* ... */ }
  async uploadEssay() { /* ... */ }  // Deveria ser outro use case!
  async deleteTask() { /* ... */ }  // Deveria ser outro use case!
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
│       └── IFileStorageService.js
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
    │   │   └── 006_create_annotations.js
    │   └── repositories/      # Implementações dos repositórios
    │       ├── StudentRepository.js
    │       ├── TeacherRepository.js
    │       └── ...
    ├── services/              # Implementações dos serviços
    │   ├── AuthService.js     # JWT + bcrypt
    │   └── FileStorageService.js
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
  file_type VARCHAR(50) NOT NULL,          -- Tipo do arquivo (image/jpeg, image/png, application/pdf)
  status VARCHAR(20) DEFAULT 'pending',    -- pending, correcting, corrected
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  corrected_at TIMESTAMP,
  grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),  -- Nota da redação (0-10)
  written_feedback TEXT,                   -- Comentários escritos da professora
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

### ⚠️ IMPORTANTE: Tokens em Cookies HttpOnly (Atualizado em 2025-12-16)

**Mudança de Segurança:** Os tokens JWT agora são enviados via **cookies httpOnly** ao invés do body da resposta.

**Motivos:**
- ✅ **Mais seguro:** Cookies httpOnly não podem ser acessados por JavaScript (previne XSS)
- ✅ **Enviados automaticamente:** Browser envia cookies em todas as requisições
- ✅ **Flags de segurança:** `secure`, `sameSite=strict` para proteção adicional

**Como Funciona:**

```javascript
// AuthController.js - Helper para definir cookies
_setTokenCookies(res, accessToken, refreshToken) {
  // Access token (15 minutos)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,                             // Não acessível via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    sameSite: 'strict',                         // Previne CSRF
    maxAge: 15 * 60 * 1000,                    // 15 minutos em ms
  });

  // Refresh token (7 dias)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 dias em ms
  });
}

// Login/Register - Define cookies e retorna APENAS dados do usuário
async login(req, res, next) {
  try {
    const result = await this.loginUseCase.execute(loginDTO);

    // Define tokens em cookies httpOnly
    this._setTokenCookies(res, result.accessToken, result.refreshToken);

    // Retorna apenas dados do usuário (SEM tokens)
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: result.user, // ⚠️ Apenas user, sem tokens!
      },
    });
  } catch (error) {
    next(error);
  }
}

// Refresh - Lê refreshToken do cookie
async refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken; // ⚠️ Lê do cookie!

    const result = await this.refreshTokenUseCase.execute(refreshToken);

    // Define novo accessToken no cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    next(error);
  }
}

// Logout - Limpa cookies
async logout(req, res, next) {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
}
```

**Endpoints Atualizados:**
- `POST /api/auth/register` - Define cookies, retorna `{ user }`
- `POST /api/auth/login` - Define cookies, retorna `{ user }`
- `POST /api/auth/refresh` - Lê refreshToken do cookie, define novo accessToken
- `POST /api/auth/logout` - ⭐ **NOVO** - Limpa cookies
- `GET /api/auth/me` - Lê accessToken do cookie (authMiddleware)

**CORS Configurado:**
```javascript
// server.js
app.use(cors({
  origin: config.frontend.url,
  credentials: true, // ⚠️ IMPORTANTE: Permite cookies cross-origin
}));

app.use(cookieParser()); // ⚠️ OBRIGATÓRIO: Parser de cookies
```

**Frontend Deve:**
- Configurar Axios com `withCredentials: true`
- NÃO armazenar tokens em localStorage/sessionStorage
- Cookies são enviados automaticamente em todas as requisições

### Middleware de Autenticação

```javascript
// authMiddleware.js - ⚠️ ATUALIZADO para ler cookies
export const authMiddleware = async (req, res, next) => {
  try {
    // Lê accessToken do cookie ao invés do header Authorization
    const token = req.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedError('Token não fornecido');
    }

    // Verificar e decodificar token
    const decoded = authService.verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType, // ⚠️ 'student' ou 'teacher'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
    });
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

## Upload de Arquivos e Google Drive

### Visão Geral

O sistema usa **Google Drive** para armazenar as redações enviadas pelos alunos. Esta escolha foi feita por:

- ✅ **Gratuito:** 15GB de armazenamento grátis
- ✅ **Escalável:** Pode expandir com Google Workspace
- ✅ **Confiável:** Infraestrutura do Google
- ✅ **Organização:** Pastas por turma automaticamente

### Arquitetura de Upload

O sistema segue **Clean Architecture** e **SOLID** para upload de arquivos:

```
Aluno → Frontend → API → Middleware → Use Case → Repository + Storage Service → Google Drive + PostgreSQL
```

**Fluxo Completo:**

1. **Multer Middleware:** Recebe arquivo e valida tipo MIME
2. **Validação de Metadados:** Verifica integridade, dimensões, tipo real
3. **Use Case (UploadEssayUseCase):** Orquestra lógica de negócio
4. **Google Drive Service:** Faz upload para o Google Drive
5. **Essay Repository:** Salva registro no PostgreSQL com ID do arquivo

### Validação de Arquivos

**⚠️ SEGURANÇA É CRÍTICA!** O sistema implementa múltiplas camadas de validação:

#### 1. Validação de Tipo MIME (Multer)

```javascript
// uploadValidation.js
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
```

#### 2. Validação de Tamanho

- **Máximo:** 10MB por arquivo
- **Mínimo:** Imagens devem ter pelo menos 100x100px

#### 3. Validação de Tipo Real (file-type)

Verifica a **assinatura binária** do arquivo, não apenas a extensão:

```javascript
const fileType = await fileTypeFromBuffer(buffer);

if (fileType.mime !== mimetype) {
  throw new ValidationError('Possível tentativa de spoofing');
}
```

#### 4. Validação de Metadados de Imagem (Sharp)

Para imagens (JPEG, PNG):

```javascript
const metadata = await sharp(buffer).metadata();

// Verifica:
// - Dimensões mínimas/máximas
// - Formato real da imagem
// - Densidade de pixels (previne decompression bombs)
```

#### 5. Validação de PDF

Para PDFs:

```javascript
// Verifica assinatura: %PDF-
// Verifica EOF: %%EOF
// Bloqueia PDFs com JavaScript (segurança)
```

### Interface IFileStorageService

Seguindo **OCP (Open/Closed Principle)**, usamos interface para abstrair storage:

```javascript
export class IFileStorageService {
  async upload(buffer, metadata) { /* ... */ }
  async delete(fileIdentifier) { /* ... */ }
  async getPublicUrl(fileIdentifier) { /* ... */ }
  async exists(fileIdentifier) { /* ... */ }
  async getMetadata(fileIdentifier) { /* ... */ }
}
```

**Implementações disponíveis:**
- ✅ `GoogleDriveStorageService` (atual)
- 🔜 `S3StorageService` (futuro)
- 🔜 `LocalStorageService` (desenvolvimento apenas)

### GoogleDriveStorageService

Implementação que usa Google Drive API v3:

```javascript
export class GoogleDriveStorageService extends IFileStorageService {
  async upload(buffer, metadata) {
    // 1. Converter buffer para stream
    const stream = Readable.from(buffer);

    // 2. Configurar metadados
    const fileMetadata = {
      name: this._sanitizeFilename(metadata.filename),
      parents: [metadata.folder || 'root'],
    };

    // 3. Fazer upload
    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: { mimeType: metadata.mimetype, body: stream },
      fields: 'id, name, webViewLink',
    });

    // 4. Tornar público (permissão de leitura)
    await this._makePublic(response.data.id);

    return response.data.id;
  }
}
```

**Características:**

- **Autenticação:** Service Account (JWT)
- **Organização:** Arquivos organizados por `classId` (turma)
- **Permissões:** Público para leitura (qualquer um com link)
- **Naming:** `{studentId}_{taskId}_{timestamp}_{originalname}`

### Configuração do Google Drive

Veja o arquivo **GOOGLE_DRIVE_SETUP.md** para instruções detalhadas.

**Resumo:**

1. Criar projeto no Google Cloud Console
2. Ativar Google Drive API
3. Criar Service Account
4. Baixar arquivo JSON de credenciais
5. Configurar variáveis de ambiente:

```env
UPLOAD_STORAGE_TYPE=google_drive
GOOGLE_DRIVE_AUTH_TYPE=service_account
GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials/google-drive-service-account.json
GOOGLE_DRIVE_FOLDER_ID=root
```

### Upload de Redações (Essays)

**Endpoint:** `POST /api/essays/upload`

**Middleware Chain:**

```javascript
router.post(
  '/upload',
  authMiddleware,              // 1. Verifica autenticação
  upload.single('file'),       // 2. Multer recebe arquivo
  handleMulterError,           // 3. Trata erros do Multer
  validateFileMetadata,        // 4. Valida metadados
  essayController.upload       // 5. Chama controller
);
```

**Use Case: UploadEssayUseCase**

```javascript
export class UploadEssayUseCase {
  constructor(essayRepository, taskRepository, studentRepository, fileStorageService) {
    // Dependency Injection (DIP)
  }

  async execute({ taskId, studentId, fileBuffer, fileMetadata }) {
    // 1. Validar que tarefa existe
    // 2. Validar que aluno existe
    // 3. Validar que aluno pertence à turma
    // 4. Verificar se já enviou redação (evitar duplicatas)
    // 5. Fazer upload para Google Drive
    // 6. Salvar registro no banco
    // 7. Retornar redação com URL pública
  }
}
```

### Modelo de Dados (Essay)

```sql
CREATE TABLE essays (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES students(id),
  file_url VARCHAR(500),        -- ID do arquivo no Google Drive
  status VARCHAR(20),            -- pending, correcting, corrected
  submitted_at TIMESTAMP,
  corrected_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Campos importantes:**

- `file_url`: Armazena **ID do arquivo no Google Drive** (não URL completa)
- `status`: Workflow da correção
  - `pending`: Aguardando correção
  - `correcting`: Professora está corrigindo
  - `corrected`: Correção finalizada

### Segurança

**⚠️ IMPORTANTE: Prevenção de Ataques**

1. **Upload Bombs:** Validação de dimensões e densidade de pixels
2. **Type Spoofing:** Verificação de assinatura binária
3. **Malicious PDFs:** Bloqueio de PDFs com JavaScript
4. **Path Traversal:** Sanitização de nomes de arquivo
5. **Rate Limiting:** Limite de requests por usuário
6. **Size Limits:** Máximo 10MB por arquivo

**Exemplo de Sanitização:**

```javascript
_sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')  // Remove caracteres inválidos
    .replace(/\s+/g, '_')                     // Substitui espaços
    .replace(/_+/g, '_');                     // Remove underscores duplicados
}
```

### Tratamento de Erros

```javascript
// Erros específicos do domínio
throw new ValidationError('Arquivo muito pequeno');
throw new ConflictError('Você já enviou redação para esta tarefa');
throw new NotFoundError('Tarefa');

// Middleware de erro converte para HTTP
400 - Validation Error
404 - Not Found
409 - Conflict
500 - Internal Server Error
```

### Organização no Google Drive

```
Google Drive/
└── [Pasta Raiz - configurável]/
    ├── [Class ID - Turma 1]/
    │   ├── student1_task1_1702345678_redacao.jpg
    │   ├── student2_task1_1702345679_redacao.pdf
    │   └── ...
    ├── [Class ID - Turma 2]/
    │   └── ...
    └── ...
```

### Próximos Passos (Essays)

- [ ] Implementar `GetEssaysByTaskUseCase` (listar redações por tarefa)
- [ ] Implementar `GetMyEssaysUseCase` (listar redações do aluno)
- [ ] Implementar `DeleteEssayUseCase` (deletar redação + arquivo)
- [ ] Adicionar compressão de imagens antes do upload (Sharp)
- [ ] Implementar preview de PDFs no frontend
- [ ] Sistema de versionamento (permitir reenvio)

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

## Sistema de Notificações por Email

### Visão Geral

O sistema implementa notificações automáticas por email para:
1. **Lembretes de prazo próximo** - Alunos que não enviaram redação quando o prazo está acabando
2. **Correção finalizada** - Notifica aluno quando professora finaliza correção

### Arquitetura

**Seguindo SOLID e Clean Architecture:**

```
Scheduler (node-cron) → Use Case → Repository + Email Service → SMTP → Aluno
```

**Componentes:**

```
src/
├── domain/
│   └── services/
│       └── IEmailService.js              # Interface (abstração)
├── application/
│   └── use-cases/
│       └── emails/
│           ├── SendDeadlineReminderUseCase.js
│           └── SendCorrectionCompletedUseCase.js
└── infrastructure/
    ├── services/
    │   ├── EmailService.js               # Implementação (Nodemailer)
    │   └── email/
    │       └── templates/
    │           ├── deadlineReminder.js   # Template HTML
    │           └── correctionCompleted.js # Template HTML
    └── schedulers/
        └── emailScheduler.js             # Cron jobs
```

### Interface IEmailService

```javascript
export class IEmailService {
  async sendDeadlineReminder({ to, studentName, taskTitle, className, deadline }) {}
  async sendCorrectionCompleted({ to, studentName, taskTitle, className, grade, writtenFeedback, essayUrl }) {}
  async verifyConnection() {}
}
```

### Implementação com Nodemailer

```javascript
export class EmailService extends IEmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendDeadlineReminder({ to, studentName, taskTitle, className, deadline }) {
    const template = deadlineReminderTemplate({ studentName, taskTitle, className, deadline });
    return this._sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
  }

  // ...
}
```

### Use Cases

#### 1. SendDeadlineReminderUseCase

**Responsabilidade:** Busca tarefas com prazo próximo e envia lembretes para alunos que não enviaram redação.

```javascript
export class SendDeadlineReminderUseCase {
  constructor(taskRepository, studentRepository, essayRepository, emailService) {
    // DIP: Depende de abstrações
  }

  async execute({ hoursBeforeDeadline = 24 }) {
    // 1. Buscar tarefas com prazo nas próximas X horas
    const upcomingTasks = await this.taskRepository.findUpcomingDeadlines({
      startDate: now,
      endDate: deadlineWindow,
    });

    // 2. Para cada tarefa, verificar alunos que não enviaram
    // 3. Enviar email de lembrete
  }
}
```

#### 2. SendCorrectionCompletedUseCase

**Responsabilidade:** Envia email quando professora finaliza correção de uma redação.

```javascript
export class SendCorrectionCompletedUseCase {
  constructor(essayRepository, studentRepository, taskRepository, emailService) {
    // DIP: Depende de abstrações
  }

  async execute({ essayId }) {
    // 1. Buscar redação, aluno, tarefa e turma
    // 2. Montar dados do email
    // 3. Enviar email com nota e feedback
  }
}
```

### Scheduler Automático (node-cron)

**Arquivo:** `src/infrastructure/schedulers/emailScheduler.js`

```javascript
export class EmailScheduler {
  async start() {
    // Verificação diária às 9h
    cron.schedule('0 9 * * *', async () => {
      await this._sendDeadlineReminders();
    });

    console.log('✅ Scheduler configurado: verificação diária às 9h');
  }

  async _sendDeadlineReminders() {
    const stats = await this.sendDeadlineReminderUseCase.execute({
      hoursBeforeDeadline: 24,
    });
  }
}
```

**Inicialização no server.js:**

```javascript
import { emailScheduler } from './infrastructure/schedulers/emailScheduler.js';

async function startServer() {
  // ...
  await emailScheduler.start();
  // ...
}
```

### Templates de Email

**Características:**
- ✅ HTML responsivo e bonito
- ✅ Versão texto alternativa (fallback)
- ✅ Emojis para melhor UX
- ✅ Links para frontend
- ✅ Informações completas (turma, tarefa, prazo, nota, feedback)

**Exemplo de Template (Deadline Reminder):**

```javascript
export const deadlineReminderTemplate = ({ studentName, taskTitle, className, deadline }) => {
  return {
    subject: `⏰ Lembrete: Prazo próximo para "${taskTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <!-- HTML bem formatado com CSS inline -->
        <div class="alert-box">
          <p>⚠️ Atenção: O prazo está próximo!</p>
        </div>
        <!-- ... -->
      </html>
    `,
    text: `Olá, ${studentName}! O prazo para "${taskTitle}" está próximo...`,
  };
};
```

### Integração com FinalizeEssayCorrectionUseCase

**Quando a professora finaliza uma correção, o email é enviado automaticamente:**

```javascript
export class FinalizeEssayCorrectionUseCase {
  constructor(essayRepository, taskRepository, sendCorrectionCompletedUseCase) {
    // Injeção do use case de email
  }

  async execute({ essayId, grade, writtenFeedback, userId, userType }) {
    // 1. Validar e finalizar correção
    const updatedEssay = await this.essayRepository.finalize(essayId, grade, writtenFeedback);

    // 2. Enviar email (não bloqueia se falhar)
    if (this.sendCorrectionCompletedUseCase) {
      this.sendCorrectionCompletedUseCase
        .execute({ essayId: updatedEssay.id })
        .catch((error) => {
          console.error('⚠️  Erro ao enviar email:', error.message);
          // Não lançar erro - email é funcionalidade secundária
        });
    }

    return updatedEssay;
  }
}
```

### Configuração (Variáveis de Ambiente)

```env
# Email Service (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM_NAME=Sistema de Redações
```

**Para Gmail:**
1. Ative "Verificação em duas etapas" na conta Google
2. Gere "Senha de app" em https://myaccount.google.com/apppasswords
3. Use a senha de app no `EMAIL_PASSWORD`

**Outros provedores SMTP:**
- SendGrid: `smtp.sendgrid.net` (porta 587)
- Mailgun: `smtp.mailgun.org` (porta 587)
- Outlook: `smtp-mail.outlook.com` (porta 587)

### Novos Métodos em TaskRepository

```javascript
/**
 * Busca tarefas com prazos próximos
 */
async findUpcomingDeadlines({ startDate, endDate }) {
  // SQL com WHERE deadline BETWEEN startDate AND endDate
}

/**
 * Busca turma de uma tarefa
 */
async getClassByTaskId(taskId) {
  // JOIN com task_classes e classes
}
```

### Segurança e Boas Práticas

✅ **Emails não bloqueiam operações principais** - Executam em background
✅ **Validação de conexão SMTP** - Verifica configuração na inicialização
✅ **Logs detalhados** - Rastreamento de emails enviados/falhados
✅ **Templates seguros** - Sem injeção de HTML (dados escapados)
✅ **Graceful degradation** - Sistema funciona mesmo se email falhar

### Testando o Sistema

**Execução manual do scheduler:**

```javascript
import { emailScheduler } from './infrastructure/schedulers/emailScheduler.js';

// Executar manualmente (útil para testes)
await emailScheduler.executeManually();
```

**Logs esperados:**

```
📅 Iniciando scheduler de emails...
✅ Serviço de email conectado e pronto
✅ Scheduler configurado: verificação diária às 9h

🔔 Executando verificação de prazos próximos...
   Encontradas 3 tarefas com prazo próximo
   Tarefa "Redação ENEM 2024": 5 alunos sem envio
   ✅ Email enviado com sucesso: Lembrete de prazo para joao@exemplo.com
   📊 Estatísticas:
      - Tarefas verificadas: 3
      - Emails enviados: 5
      - Emails com erro: 0
```

### Fluxo Completo

**1. Lembrete de Prazo:**
```
Cron (diário 9h) → SendDeadlineReminderUseCase
  → TaskRepository.findUpcomingDeadlines()
  → StudentRepository.findByClassId()
  → EssayRepository.findByTaskId()
  → Filtrar alunos sem envio
  → EmailService.sendDeadlineReminder()
  → SMTP → Email do aluno
```

**2. Correção Finalizada:**
```
Professora → PUT /api/essays/:id/finalize
  → FinalizeEssayCorrectionUseCase
  → EssayRepository.finalize()
  → SendCorrectionCompletedUseCase (background)
  → EmailService.sendCorrectionCompleted()
  → SMTP → Email do aluno
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

### ✅ Fase 2: Turmas e Tarefas (COMPLETO)
- [x] CRUD de turmas (apenas professores)
- [x] Listar alunos de uma turma
- [x] CRUD de tarefas (por turma)
- [x] Listar tarefas da turma do aluno
- [x] Sistema de status de tarefas (em andamento/encerradas)
- [x] Listagem de alunos por tarefa com status de entrega

### ✅ Fase 3: Upload e Visualização (COMPLETO)
- [x] Configurar multer + GoogleDriveStorageService
- [x] Validação avançada de arquivos (tipo, tamanho, metadados)
- [x] Upload de redações (JPEG, PNG, PDF) para Google Drive
- [x] Repository e Use Cases de essays
- [x] Status tracking (pending/correcting/corrected)
- [x] Documentação Swagger para Essays
- [x] Sistema de finalização de correção com nota e comentários escritos
  - [x] Migration 007: Campos `grade` e `written_feedback` na tabela `essays`
  - [x] FinalizeEssayCorrectionUseCase
  - [x] Endpoint `PUT /api/essays/:essayId/finalize` (apenas professores)
  - [x] Validação de nota (0-10) obrigatória
  - [x] Comentários escritos opcionais
- [x] Sistema de atualização de comentários em tempo real (rascunho antes de finalizar)
  - [x] UpdateEssayCommentsUseCase - Permite atualizar comentários sem finalizar correção
  - [x] EssayRepository.updateComments() - Método para atualizar apenas written_feedback
  - [x] Endpoint `PATCH /api/essays/:essayId/comments` (apenas professores)
  - [x] Permite que professor escreva comentários enquanto faz anotações visuais
  - [x] Comentários salvos como rascunho (não altera status nem nota)
  - [x] Ao finalizar, comentários já estão preenchidos e podem ser editados

### 🎨 Fase 4: Anotações (Core Feature)
- [x] Integrar Konva.js no frontend
- [x] Componente EssayAnnotator com toolbar
- [x] Suporte a stylus pressure
- [x] Diferentes ferramentas (caneta, marca-texto, marcador)
- [x] Serialização → JSONB
- [x] Auto-save a cada 5s

### 📧 Fase 5: Notificações por Email (COMPLETO)
- [x] Interface IEmailService e implementação com Nodemailer
- [x] Templates HTML responsivos (deadline reminder, correction completed)
- [x] SendDeadlineReminderUseCase - Lembretes automáticos de prazo
- [x] SendCorrectionCompletedUseCase - Notificação de correção finalizada
- [x] Scheduler automático com node-cron (verificação diária às 9h)
- [x] Integração com FinalizeEssayCorrectionUseCase
- [x] Novos métodos em TaskRepository (findUpcomingDeadlines, getClassByTaskId)
- [x] Configuração SMTP (Gmail, SendGrid, Mailgun, etc.)
- [x] Logs detalhados e graceful degradation

### 📊 Fase 6: Dashboard e Relatórios (Futuro)
- [ ] Dashboard professor (estatísticas de turmas e tarefas)
- [ ] Dashboard aluno (progresso e notas)
- [ ] Gráficos com Recharts (evolução de notas, taxa de entrega)
- [ ] Relatórios exportáveis (PDF, Excel)

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

**Última atualização:** 2025-12-30
