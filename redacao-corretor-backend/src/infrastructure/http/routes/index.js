import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classRoutes from './classes.routes.js';

const router = Router();

/**
 * Rotas da aplicação
 */
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);

// Rotas futuras serão adicionadas aqui:
// router.use('/tasks', taskRoutes);
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
