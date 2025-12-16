# Redação Corretor - Backend

Backend do sistema de correção de redações seguindo Clean Architecture e princípios SOLID.

## Stack Tecnológica

- **Node.js** com Express.js
- **PostgreSQL** para banco de dados
- **JWT** para autenticação
- **Socket.io** para notificações em tempo real
- **Multer** para upload de arquivos

## Estrutura do Projeto

```
src/
├── application/        # Casos de uso (lógica de negócio)
├── domain/             # Entidades e interfaces
├── infrastructure/     # Implementações concretas
├── config/             # Configurações
└── utils/              # Utilitários
```

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrations
npm run migrate

# Popular banco com dados de exemplo (opcional)
npm run seed

# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

## Variáveis de Ambiente

Veja o arquivo `.env.example` para todas as variáveis necessárias.

## Princípios SOLID

- **SRP:** Cada classe tem uma responsabilidade única
- **OCP:** Aberto para extensão, fechado para modificação
- **LSP:** Substituição de Liskov através de interfaces
- **ISP:** Interfaces segregadas e específicas
- **DIP:** Dependência de abstrações, não de implementações

## API Endpoints

Documentação completa em: **http://localhost:3000/api-docs**

### Autenticação
- `POST /api/auth/register` - Registro de usuário (aluno ou professor)
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Dados do usuário autenticado

### Turmas ✅ IMPLEMENTADO
- `GET /api/classes` - Listar turmas
- `GET /api/classes/:id` - Buscar turma por ID
- `POST /api/classes` - Criar turma (apenas professores)
- `PUT /api/classes/:id` - Atualizar turma (apenas o dono)
- `DELETE /api/classes/:id` - Deletar turma (apenas o dono)

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `POST /api/tasks` - Criar tarefa (apenas professora)
- `GET /api/tasks/:id` - Detalhes da tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa

### Redações
- `POST /api/essays` - Upload de redação
- `GET /api/essays/:id` - Ver redação
- `PUT /api/essays/:id/annotations` - Salvar anotações
- `GET /api/essays/:id/annotations` - Buscar anotações

### Comentários
- `GET /api/essays/:id/comments` - Listar comentários
- `POST /api/essays/:id/comments` - Adicionar comentário

### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida

## Dados de Exemplo (Seed)

Para facilitar o desenvolvimento, você pode popular o banco com dados de exemplo:

```bash
npm run seed
```

**Dados criados:**

👩‍🏫 **Professora:**
- Email: `professora@exemplo.com`
- Senha: `senha123`

🎓 **Turmas:**
- Turma AFA
- Turma EFOMM
- Turma ENEM
- Turma ESA

👨‍🎓 **Alunos** (todos com senha `senha123`):
- `joao.silva@exemplo.com` - Turma AFA
- `maria.santos@exemplo.com` - Turma AFA
- `pedro.oliveira@exemplo.com` - Turma EFOMM
- `ana.costa@exemplo.com` - Turma EFOMM
- `lucas.lima@exemplo.com` - Turma ENEM
- `juliana.pereira@exemplo.com` - Turma ESA

## Docker

### Setup completo com Docker Compose:

```bash
# Resetar banco de dados (⚠️ deleta todos os dados!)
docker-compose down -v

# Subir serviços e aplicar migrations
docker-compose up --build

# Após o banco estar pronto, popular com dados de exemplo
docker-compose exec backend npm run seed
```

## License

MIT
