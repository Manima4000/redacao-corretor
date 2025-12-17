import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classRoutes from './classes.routes.js';
import taskRoutes from './tasks.routes.js';
import essayRoutes from './essays.routes.js';
import testRoutes from './test.routes.js';
import studentRoutes from './students.routes.js';

const router = Router();

/**
 * Rotas da aplicação
 */
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/tasks', taskRoutes);
router.use('/essays', essayRoutes);

// Rotas de teste (apenas para desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.use('/test', testRoutes);
}

// Rotas futuras serão adicionadas aqui:
// router.use('/notifications', notificationRoutes);
// router.use('/comments', commentRoutes);

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
  });
});

export default router;
