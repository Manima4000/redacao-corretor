export class DashboardController {
  constructor(getTeacherDashboardStatsUseCase, getStudentDashboardStatsUseCase) {
    this.getTeacherDashboardStatsUseCase = getTeacherDashboardStatsUseCase;
    this.getStudentDashboardStatsUseCase = getStudentDashboardStatsUseCase;
  }

  async getStats(req, res, next) {
    try {
      const { userType, id } = req.user;
      let stats;

      if (userType === 'teacher') {
        stats = await this.getTeacherDashboardStatsUseCase.execute(id);
      } else if (userType === 'student') {
        stats = await this.getStudentDashboardStatsUseCase.execute(id);
      } else {
         return res.status(400).json({ success: false, error: 'Invalid user type' });
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
