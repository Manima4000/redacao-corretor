# Documentação Swagger - Guia Rápido

## 📖 Acessar a Documentação

Com o servidor rodando, acesse: **http://localhost:3000/api-docs**

---

## 🎯 Como Usar

### 1. Testar Endpoints Públicos (sem autenticação)

Exemplo: **POST /api/auth/register** ou **POST /api/auth/login**

1. Acesse http://localhost:3000/api-docs
2. Encontre a seção **Auth**
3. Clique em **POST /api/auth/register**
4. Clique em **Try it out**
5. Preencha o exemplo JSON:
```json
{
  "email": "joao@exemplo.com",
  "password": "senha123",
  "fullName": "João Silva",
  "type": "student",
  "enrollmentNumber": "2024001"
}
```
6. Clique em **Execute**
7. Veja a resposta abaixo

### 2. Testar Endpoints Autenticados

Exemplo: **GET /api/auth/me**

**Passo 1: Fazer login e obter o token**

1. Execute **POST /api/auth/login** conforme acima
2. Na resposta, copie o valor de `accessToken`:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  ← COPIE ISSO
    "refreshToken": "...",
    "user": { ... }
  }
}
```

**Passo 2: Autorizar no Swagger**

1. No topo da página, clique no botão **Authorize** (cadeado)
2. Cole o `accessToken` no campo **Value**
3. Clique em **Authorize**
4. Clique em **Close**

**Passo 3: Testar endpoint autenticado**

1. Encontre **GET /api/auth/me**
2. Clique em **Try it out**
3. Clique em **Execute**
4. Veja seus dados de usuário na resposta

---

## 🔧 Como Documentar Novos Endpoints

Ao criar um novo endpoint, **sempre adicione documentação Swagger!**

### Exemplo Completo

**Arquivo:** `src/infrastructure/http/routes/classes.routes.js`

```javascript
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Criar nova turma
 *     description: Cria uma nova turma no sistema (apenas professores)
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
 *                 minLength: 2
 *                 example: Turma AFA
 *               description:
 *                 type: string
 *                 example: Turma preparatória para concurso AFA
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
 *                 message:
 *                   type: string
 *                   example: Turma criada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Apenas professores podem criar turmas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/classes', authMiddleware, requireTeacher, classController.create);

export default router;
```

### Elementos Importantes

1. **tags**: Categoria do endpoint (Auth, Classes, Tasks, etc)
2. **security**: Se requer autenticação, adicione `bearerAuth`
3. **requestBody**: Esquema do corpo da requisição
4. **responses**: Todas as respostas possíveis (200, 201, 400, 401, 403, 404, 500)
5. **examples**: Sempre forneça exemplos!

---

## 📚 Tags Disponíveis

Use estas tags para organizar seus endpoints:

- `Auth` - Autenticação e autorização
- `Classes` - Gerenciamento de turmas
- `Tasks` - Gerenciamento de tarefas/temas
- `Essays` - Upload e gerenciamento de redações
- `Annotations` - Anotações nas redações
- `Comments` - Chat entre professora e aluno
- `Notifications` - Notificações do sistema

---

## 🔐 Schemas Reutilizáveis

Schemas já definidos em `src/config/swagger.js`:

- `#/components/schemas/Error` - Padrão de erro
- `#/components/schemas/Student` - Dados do aluno
- `#/components/schemas/Teacher` - Dados do professor
- `#/components/schemas/AuthResponse` - Resposta de autenticação

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
      example: 'Turma preparatória',
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

Depois use como referência:

```javascript
$ref: '#/components/schemas/Class'
```

---

## ✅ Checklist para Documentação

Ao criar um novo endpoint, verifique:

- [ ] Adicionou comentário `@swagger` na rota
- [ ] Especificou a tag correta
- [ ] Definiu `security: bearerAuth` se for endpoint autenticado
- [ ] Documentou todos os campos do requestBody
- [ ] Incluiu exemplos em todos os campos
- [ ] Documentou TODAS as respostas possíveis (200, 201, 400, 401, 403, 404, 500)
- [ ] Usou schemas reutilizáveis quando possível
- [ ] Testou no Swagger UI após implementar

---

## 🚀 Dicas

1. **Sempre teste no Swagger** após adicionar documentação
2. **Use exemplos reais** que funcionam
3. **Documente erros** - ajuda outros desenvolvedores
4. **Seja específico** nas descrições
5. **Reutilize schemas** - não repita código

---

## 📝 Referências

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor Online](https://editor.swagger.io/)
- Configuração: `src/config/swagger.js`
- Documentação atual: http://localhost:3000/api-docs
- JSON da API: http://localhost:3000/api-docs.json
