# Guia de Teste - Upload de Redações

Este guia explica como testar o endpoint de upload de redações.

---

## Pré-requisitos

Antes de testar, você precisa:

1. ✅ Docker rodando com os containers up
2. ✅ Google Drive configurado (veja GOOGLE_DRIVE_SETUP.md)
3. ✅ Banco de dados com dados de teste (turma, tarefa, alunos)
4. ✅ Token de autenticação de um aluno

---

## Passo 1: Preparar Dados de Teste

### Criar Professora, Turma e Tarefa

```bash
# Dentro do container ou localmente
npm run seed
```

Ou manualmente via API/Swagger:

**1. Registrar Professora:**
```bash
POST /api/auth/register
{
  "email": "professora@exemplo.com",
  "password": "senha123",
  "fullName": "Maria Silva",
  "type": "teacher",
  "specialization": "Redação ENEM"
}
```

**2. Fazer Login (Professora):**
```bash
POST /api/auth/login
{
  "email": "professora@exemplo.com",
  "password": "senha123"
}
# Salve o accessToken (ou o cookie será enviado automaticamente)
```

**3. Criar Turma:**
```bash
POST /api/classes
Cookie: accessToken=eyJhbGc...
{
  "name": "Turma AFA 2025",
  "description": "Turma preparatória para AFA"
}
# Salve o "id" da turma (classId)
```

**4. Criar Tarefa:**
```bash
POST /api/tasks
Cookie: accessToken=eyJhbGc...
{
  "classId": "uuid-da-turma",
  "title": "Redação - Desigualdade Social",
  "description": "Escreva uma redação dissertativa sobre desigualdade social no Brasil",
  "deadline": "2025-12-31T23:59:59.000Z"
}
# Salve o "id" da tarefa (taskId)
```

### Criar Aluno

**5. Registrar Aluno:**
```bash
POST /api/auth/register
{
  "email": "joao@exemplo.com",
  "password": "senha123",
  "fullName": "João Santos",
  "type": "student",
  "enrollmentNumber": "2025001"
}
```

**6. Adicionar Aluno à Turma:**

Você precisa atualizar o aluno para associá-lo à turma. Execute no banco ou crie um endpoint para isso:

```sql
UPDATE students
SET class_id = 'uuid-da-turma'
WHERE email = 'joao@exemplo.com';
```

**7. Fazer Login (Aluno):**
```bash
POST /api/auth/login
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
# Cookies serão setados automaticamente
```

---

## Passo 2: Preparar Arquivo de Teste

Crie ou baixe arquivos para teste:

### Imagem de Teste (JPEG/PNG)
- Baixe uma imagem qualquer ou tire uma foto
- Tamanho: entre 100KB e 10MB
- Formato: JPEG ou PNG
- Dimensões mínimas: 100x100px

### PDF de Teste
- Crie um PDF simples
- Tamanho: máximo 10MB
- Sem JavaScript incorporado

---

## Passo 3: Testar o Upload

### Opção 1: Usando Postman

1. **Abra o Postman**

2. **Configure a requisição:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/essays/upload`
   - Headers:
     - O cookie `accessToken` será enviado automaticamente se você fez login antes
     - Ou adicione manualmente: `Cookie: accessToken=seu-token-aqui`

3. **Configure o Body:**
   - Selecione `form-data`
   - Adicione os campos:
     - Key: `taskId` | Type: Text | Value: `uuid-da-tarefa`
     - Key: `file` | Type: File | Value: Selecione o arquivo

4. **Envie a requisição**

5. **Resposta esperada (201):**
```json
{
  "success": true,
  "message": "Redação enviada com sucesso",
  "data": {
    "essay": {
      "id": "uuid-da-redacao",
      "taskId": "uuid-da-tarefa",
      "studentId": "uuid-do-aluno",
      "fileUrl": "google-drive-file-id",
      "status": "pending",
      "submittedAt": "2025-12-16T10:30:00.000Z",
      "publicUrl": "https://drive.google.com/file/d/..."
    }
  }
}
```

### Opção 2: Usando cURL

```bash
# Primeiro, faça login e capture o cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"senha123"}' \
  -c cookies.txt

# Depois, faça o upload
curl -X POST http://localhost:3000/api/essays/upload \
  -b cookies.txt \
  -F "taskId=uuid-da-tarefa" \
  -F "file=@/caminho/para/sua/redacao.jpg"
```

### Opção 3: Usando Thunder Client (VS Code)

1. **Instale a extensão Thunder Client**

2. **Crie uma nova requisição:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/essays/upload`

3. **Configure Auth (se usar Bearer Token):**
   - Ou use cookies automaticamente se fez login antes

4. **Configure Body:**
   - Selecione `Form`
   - Adicione:
     - `taskId`: valor do UUID da tarefa
     - `file`: Selecione o arquivo

5. **Envie**

### Opção 4: Usando Swagger UI

1. **Acesse:** http://localhost:3000/api-docs

2. **Faça login primeiro:**
   - Expanda `POST /api/auth/login`
   - Clique em "Try it out"
   - Preencha credenciais do aluno
   - Execute
   - Os cookies serão setados automaticamente

3. **Teste o upload:**
   - Expanda `POST /api/essays/upload`
   - Clique em "Try it out"
   - Preencha `taskId`
   - Clique em "Choose File" e selecione o arquivo
   - Execute

---

## Passo 4: Validações Esperadas

### ✅ Upload com Sucesso (201)

Quando tudo está correto, você recebe:
```json
{
  "success": true,
  "message": "Redação enviada com sucesso",
  "data": { ... }
}
```

### ❌ Erros Comuns

#### 1. Token não fornecido (401)
```json
{
  "success": false,
  "error": "Token não fornecido"
}
```
**Solução:** Faça login primeiro ou inclua o cookie/token.

#### 2. Apenas alunos podem enviar (403)
```json
{
  "success": false,
  "error": "Apenas alunos podem enviar redações"
}
```
**Solução:** Use token de um aluno, não de professor.

#### 3. Arquivo não enviado (400)
```json
{
  "success": false,
  "error": "Nenhum arquivo foi enviado"
}
```
**Solução:** Certifique-se de incluir o campo `file` no form-data.

#### 4. Arquivo muito grande (400)
```json
{
  "success": false,
  "error": "Arquivo muito grande. Tamanho máximo: 10MB"
}
```
**Solução:** Use um arquivo menor que 10MB.

#### 5. Tipo de arquivo não permitido (400)
```json
{
  "success": false,
  "error": "Tipo de arquivo não permitido: image/gif. Apenas JPEG, PNG e PDF são aceitos."
}
```
**Solução:** Use apenas JPEG, PNG ou PDF.

#### 6. Arquivo corrompido (400)
```json
{
  "success": false,
  "error": "Não foi possível determinar o tipo do arquivo. O arquivo pode estar corrompido."
}
```
**Solução:** Use um arquivo válido e não corrompido.

#### 7. Imagem muito pequena (400)
```json
{
  "success": false,
  "error": "Imagem muito pequena. Dimensões mínimas: 100x100px"
}
```
**Solução:** Use uma imagem com pelo menos 100x100 pixels.

#### 8. PDF com JavaScript (400)
```json
{
  "success": false,
  "error": "PDF contém JavaScript. Por segurança, PDFs com scripts não são permitidos."
}
```
**Solução:** Use um PDF sem scripts incorporados.

#### 9. Aluno não pertence à turma (400)
```json
{
  "success": false,
  "error": "Você não está matriculado na turma desta tarefa"
}
```
**Solução:** Associe o aluno à turma da tarefa (UPDATE students SET class_id).

#### 10. Já enviou redação (409)
```json
{
  "success": false,
  "error": "Você já enviou uma redação para esta tarefa. Para reenviar, delete a redação anterior."
}
```
**Solução:** Delete a redação existente primeiro (endpoint DELETE ainda não implementado).

#### 11. Tarefa não encontrada (404)
```json
{
  "success": false,
  "error": "Tarefa não encontrada"
}
```
**Solução:** Verifique se o `taskId` está correto e a tarefa existe.

#### 12. Google Drive não configurado (500)
```json
{
  "success": false,
  "error": "Falha ao fazer upload para Google Drive: ..."
}
```
**Solução:** Configure o Google Drive seguindo GOOGLE_DRIVE_SETUP.md.

---

## Passo 5: Verificar Upload no Google Drive

Após um upload bem-sucedido:

1. **Acesse o Google Drive** da conta do Service Account
2. Navegue até a pasta configurada (ou "root")
3. Você deve ver uma pasta com o `classId` (UUID da turma)
4. Dentro dela, o arquivo com formato:
   ```
   {studentId}_{taskId}_{timestamp}_{originalname}
   ```

**Exemplo:**
```
550e8400-e29b-41d4-a716-446655440000_660e8400-e29b-41d4-a716-446655440001_1702345678_redacao.jpg
```

---

## Passo 6: Verificar no Banco de Dados

```sql
-- Ver todas as redações
SELECT
  e.id,
  e.file_url,
  e.status,
  e.submitted_at,
  s.full_name as student_name,
  t.title as task_title
FROM essays e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN tasks t ON e.task_id = t.id;
```

---

## Script de Teste Automatizado (Node.js)

Crie um arquivo `test-upload.js`:

```javascript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testUpload() {
  try {
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'joao@exemplo.com',
      password: 'senha123',
    }, {
      withCredentials: true,
    });

    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Login realizado');

    // 2. Upload
    console.log('\n2. Fazendo upload da redação...');
    const form = new FormData();
    form.append('taskId', 'uuid-da-tarefa-aqui');
    form.append('file', fs.createReadStream('./test-image.jpg'));

    const uploadResponse = await axios.post(`${API_URL}/essays/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: cookies.join('; '),
      },
      withCredentials: true,
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('Resposta:', JSON.stringify(uploadResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testUpload();
```

Execute:
```bash
node test-upload.js
```

---

## Troubleshooting

### Container não está rodando

```bash
docker-compose up -d
docker-compose logs -f backend
```

### Google Drive retorna erro de autenticação

```bash
# Ver logs do backend
docker-compose logs backend | grep "GOOGLE DRIVE"
```

Verifique:
- [ ] Arquivo de credenciais existe em `./credentials/`
- [ ] Caminho no `.env` está correto
- [ ] Service Account tem permissões
- [ ] Pasta do Drive foi compartilhada com o service account

### Arquivo de credenciais não encontrado no Docker

```bash
# Verifique se o volume está montado
docker-compose exec backend ls -la /app/credentials
```

Se vazio:
- Verifique o `.gitignore` (credentials/ não deve estar commitado)
- Verifique o volume no docker-compose.yml
- Recrie os containers: `docker-compose down && docker-compose up --build`

---

## Próximos Passos

Após testar o upload com sucesso:

1. [ ] Implementar frontend de upload
2. [ ] Implementar endpoint para listar redações
3. [ ] Implementar endpoint para deletar redações
4. [ ] Implementar preview de redações
5. [ ] Adicionar sistema de anotações

---

**Última atualização:** 2025-12-16
