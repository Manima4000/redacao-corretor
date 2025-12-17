import { SearchStudentsUseCase } from '../../../application/use-cases/students/SearchStudentsUseCase.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';

export class StudentController {
  constructor() {
    const studentRepository = new StudentRepository();
    this.searchStudentsUseCase = new SearchStudentsUseCase(studentRepository);
  }

  search = async (req, res, next) => {
    try {
      const { query } = req.query;
      const students = await this.searchStudentsUseCase.execute(query);

      res.status(200).json({
        success: true,
        data: students,
      });
    } catch (error) {
      next(error);
    }
  };
}
