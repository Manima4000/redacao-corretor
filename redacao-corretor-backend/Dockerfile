# Imagem base do Node.js
FROM node:24-alpine

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código fonte
COPY . .

# Criar diretório para logs e uploads
RUN mkdir -p logs uploads

# Expor porta
EXPOSE 3000

# Variável de ambiente
ENV NODE_ENV=production

# Comando para iniciar
CMD ["node", "src/server.js"]
