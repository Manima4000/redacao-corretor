# Configuração do Google Drive API

Este guia mostra como configurar o Google Drive API para armazenar as redações dos alunos.

---

## Por Que Google Drive?

- ✅ **Grátis:** 15GB de armazenamento gratuito por conta
- ✅ **Escalável:** Pode expandir com Google Workspace
- ✅ **Confiável:** Infraestrutura do Google
- ✅ **Fácil Compartilhamento:** Links públicos para visualização
- ✅ **Organização:** Pastas por turma/tarefa

---

## Pré-requisitos

- Conta Google
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

---

## Método 1: Service Account (Recomendado)

### 1. Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" → "New Project"
3. Nome do projeto: `redacao-corretor`
4. Clique em "Create"

### 2. Ativar Google Drive API

1. No menu lateral, vá em "APIs & Services" → "Library"
2. Busque por "Google Drive API"
3. Clique em "Enable"

### 3. Criar Service Account

1. No menu lateral, vá em "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "Service Account"
3. Preencha:
   - **Service account name:** `redacao-corretor-service`
   - **Service account ID:** (auto-preenchido)
   - **Description:** Service account para armazenar redações
4. Clique em "Create and Continue"
5. **Role:** Selecione "Basic" → "Editor" (ou crie role customizado com apenas Drive)
6. Clique em "Continue" → "Done"

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique no service account criado
2. Vá na aba "Keys"
3. Clique em "Add Key" → "Create new key"
4. Selecione "JSON"
5. Clique em "Create"
6. Um arquivo JSON será baixado automaticamente

### 5. Configurar Projeto

1. Crie uma pasta `credentials` na raiz do projeto backend:
   ```bash
   mkdir redacao-corretor-backend/credentials
   ```

2. Mova o arquivo JSON baixado para esta pasta:
   ```bash
   mv ~/Downloads/redacao-corretor-*.json redacao-corretor-backend/credentials/google-drive-service-account.json
   ```

3. **IMPORTANTE:** Adicione a pasta ao `.gitignore`:
   ```bash
   echo "credentials/" >> redacao-corretor-backend/.gitignore
   ```

4. Configure as variáveis de ambiente no `.env`:
   ```env
   UPLOAD_STORAGE_TYPE=google_drive
   GOOGLE_DRIVE_AUTH_TYPE=service_account
   GOOGLE_DRIVE_CREDENTIALS_PATH=./credentials/google-drive-service-account.json
   GOOGLE_DRIVE_FOLDER_ID=root
   ```

### 6. Criar Pasta no Google Drive (Opcional)

Para organizar melhor os arquivos:

1. Acesse [Google Drive](https://drive.google.com/)
2. Crie uma pasta "Redações - Sistema"
3. Clique com botão direito na pasta → "Share" → "Share"
4. Cole o email do service account (está no JSON baixado, campo `client_email`)
5. Dê permissão de "Editor"
6. Copie o ID da pasta (está na URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`)
7. Configure no `.env`:
   ```env
   GOOGLE_DRIVE_FOLDER_ID=seu-folder-id-aqui
   ```

---

## Método 2: OAuth2 (Alternativo)

### 1. Criar OAuth2 Credentials

1. No Google Cloud Console, vá em "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth client ID"
3. Se solicitado, configure a "OAuth consent screen":
   - User Type: **External**
   - App name: `Redação Corretor`
   - User support email: seu email
   - Developer contact: seu email
4. Em "Scopes", adicione:
   - `https://www.googleapis.com/auth/drive.file`
5. Em "Test users", adicione seu email
6. Volte para "Credentials" → "Create OAuth client ID"
7. Application type: **Web application**
8. Authorized redirect URIs: `http://localhost:3000/oauth2callback`
9. Clique em "Create"
10. Copie **Client ID** e **Client Secret**

### 2. Obter Refresh Token

Execute este script Node.js para obter o refresh token:

```javascript
// getRefreshToken.js
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const CLIENT_ID = 'seu-client-id';
const CLIENT_SECRET = 'seu-client-secret';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Acesse esta URL no navegador:');
console.log(authUrl);

// Criar servidor temporário para receber o código
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  const code = url.searchParams.get('code');

  if (code) {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh Token:', tokens.refresh_token);
    res.end('Autenticação concluída! Verifique o terminal.');
    server.close();
  }
});

server.listen(3000);
```

Execute:
```bash
node getRefreshToken.js
```

### 3. Configurar Variáveis de Ambiente

```env
UPLOAD_STORAGE_TYPE=google_drive
GOOGLE_DRIVE_AUTH_TYPE=oauth2
GOOGLE_DRIVE_CLIENT_ID=seu-client-id
GOOGLE_DRIVE_CLIENT_SECRET=seu-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=seu-refresh-token
GOOGLE_DRIVE_FOLDER_ID=root
```

---

## Teste de Configuração

Execute o backend e verifique os logs:

```bash
npm run dev
```

Você deve ver:
```
[GOOGLE DRIVE] Inicializado com sucesso
[GOOGLE DRIVE] Tipo de autenticação: service_account
[GOOGLE DRIVE] Pasta raiz: root
[GOOGLE DRIVE] Service Account autenticado: redacao-corretor-service@...
[GOOGLE DRIVE] Conexão testada com sucesso
```

---

## Estrutura de Pastas Sugerida

```
Google Drive/
└── Redações - Sistema/
    ├── [Class ID 1]/
    │   ├── student1_task1_timestamp_file.jpg
    │   ├── student2_task1_timestamp_file.pdf
    │   └── ...
    ├── [Class ID 2]/
    │   └── ...
    └── ...
```

Os arquivos são organizados automaticamente por turma usando o `classId` da tarefa.

---

## Segurança

### ⚠️ IMPORTANTE: Proteja suas credenciais!

1. **NUNCA** commite o arquivo JSON de credenciais no Git
2. Adicione `credentials/` ao `.gitignore`
3. Em produção, use variáveis de ambiente ou secrets manager
4. Rotacione chaves periodicamente
5. Use service account com permissões mínimas necessárias

### Exemplo de .gitignore

```gitignore
# Credenciais
credentials/
*.json
!package.json
!package-lock.json

# Environment
.env
.env.local
.env.production
```

---

## Troubleshooting

### Erro: "Credentials not found"

- Verifique se o caminho em `GOOGLE_DRIVE_CREDENTIALS_PATH` está correto
- O caminho deve ser relativo à raiz do projeto backend

### Erro: "Permission denied"

- Verifique se compartilhou a pasta com o email do service account
- Dê permissão de "Editor" (não apenas "Viewer")

### Erro: "API not enabled"

- Verifique se a Google Drive API está habilitada no projeto
- Pode levar alguns minutos após habilitar

### Erro: "Invalid grant"

(OAuth2 apenas)
- O refresh token pode ter expirado
- Gere um novo refresh token seguindo o processo novamente

---

## Alternativas

Se você preferir não usar Google Drive:

1. **AWS S3:** Configure variáveis `AWS_*` no `.env`
2. **Local Storage:** Configure `UPLOAD_STORAGE_TYPE=local` (apenas desenvolvimento)

O sistema usa **Dependency Injection**, então trocar a implementação é simples:

```javascript
// No arquivo essays.routes.js
// Trocar de GoogleDriveStorageService para S3StorageService
const fileStorageService = new S3StorageService();
```

---

## Limites e Quotas

**Google Drive API (conta gratuita):**
- 15 GB de armazenamento
- 20.000 requests/100 segundos
- 1.000 requests/100 segundos/usuário

Para projetos maiores, considere:
- Google Workspace (armazenamento ilimitado)
- AWS S3 (paga por uso)

---

## Referências

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [OAuth2 for Apps](https://developers.google.com/identity/protocols/oauth2)

---

**Última atualização:** 2025-12-16
