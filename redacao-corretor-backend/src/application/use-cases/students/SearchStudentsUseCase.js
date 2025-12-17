export class SearchStudentsUseCase {
  constructor(studentRepository) {
    this.studentRepository = studentRepository;
  }

  async execute(query) {
    if (!query || query.length < 3) {
      return [];
    }

    const students = await this.studentRepository.findByName(query);
    return students.map(student => student.toPublicData());
  }
}
