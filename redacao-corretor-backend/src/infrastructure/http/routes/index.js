import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classRoutes from './classes.routes.js';
import taskRoutes from './tasks.routes.js';

const router = Router();

/**
 * Rotas da aplicação
 */
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/tasks', taskRoutes);

// Rotas futuras serão adicionadas aqui:
// router.use('/essays', essayRoutes);
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
