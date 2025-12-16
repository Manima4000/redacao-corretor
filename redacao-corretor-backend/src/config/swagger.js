import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Redação Corretor API',
      version: '1.0.0',
      description: 'Sistema de correção de redações com anotações em tablet',
      contact: {
        name: 'API Support',
        email: 'support@redacaocorretor.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://api.redacaocorretor.com',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de autenticação (access token)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detalhes adicionais do erro (apenas em erros de validação)',
            },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'aluno@exemplo.com',
            },
            fullName: {
              type: 'string',
              example: 'João Silva Santos',
            },
            enrollmentNumber: {
              type: 'string',
              example: '2024001',
              nullable: true,
            },
            classId: {
              type: 'string',
              format: 'uuid',
              description: 'ID da turma que o aluno pertence',
              example: '456e7890-e89b-12d3-a456-426614174000',
              nullable: true,
            },
            type: {
              type: 'string',
              enum: ['student'],
              example: 'student',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Teacher: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'professora@exemplo.com',
            },
            fullName: {
              type: 'string',
              example: 'Maria Silva',
            },
            specialization: {
              type: 'string',
              example: 'Língua Portuguesa',
              nullable: true,
            },
            type: {
              type: 'string',
              enum: ['teacher'],
              example: 'teacher',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '789e0123-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Turma AFA',
            },
            description: {
              type: 'string',
              example: 'Turma preparatória para concurso AFA',
              nullable: true,
            },
            teacherId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'abc12345-e89b-12d3-a456-426614174000',
            },
            title: {
              type: 'string',
              example: 'Redação sobre Meio Ambiente',
            },
            description: {
              type: 'string',
              example: 'Escreva uma redação dissertativa-argumentativa sobre os impactos da poluição nos oceanos.',
            },
            teacherId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-31T23:59:59.000Z',
              nullable: true,
            },
            classIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              example: ['789e0123-e89b-12d3-a456-426614174000'],
            },
            isOverdue: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login realizado com sucesso',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  oneOf: [
                    { $ref: '#/components/schemas/Student' },
                    { $ref: '#/components/schemas/Teacher' },
                  ],
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação',
      },
      {
        name: 'Classes',
        description: 'Gerenciamento de turmas',
      },
      {
        name: 'Tasks',
        description: 'Gerenciamento de tarefas/temas',
      },
      {
        name: 'Essays',
        description: 'Upload e gerenciamento de redações',
      },
      {
        name: 'Annotations',
        description: 'Anotações nas redações',
      },
      {
        name: 'Comments',
        description: 'Chat entre professora e aluno',
      },
      {
        name: 'Notifications',
        description: 'Notificações do sistema',
      },
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.js'], // Caminho para os arquivos com anotações JSDoc
};

export const swaggerSpec = swaggerJsdoc(options);
