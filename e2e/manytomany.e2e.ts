import {
  BaseModel,
  Entity,
  Column,
  ManyToMany,
  init,
  transaction,
  end
} from "../dist/orm";
import ModelManager from "../dist/modelmanager";
import config from "./config";
import Teacher from "./testclasses/Teacher";
import Student from "./testclasses/Student";

beforeAll(async () => {
  init(config);
  await transaction(async () => {
    if (ModelManager.getModel("TeacherStudent")) {
      await ModelManager.getModel("TeacherStudent").drop();
    }
    await Student.drop();
    await Teacher.drop();
    await Student.sync();
    await Teacher.sync();
    await ModelManager.getModel("TeacherStudent").sync();
  });
});

afterAll(end);

describe("Many To Many", () => {
  it("allows a student to have many teachers", async () => {
    await transaction(async () => {
      const student = new Student({ name: "Student1" });

      const teacher1 = new Teacher({ subject: "maths" });
      const teacher2 = new Teacher({ subject: "compsci" });

      student.teachers = [teacher1, teacher2];
      await student.save();

      const foundStudent = await Student.get<Student>(student.id);

      expect(foundStudent.toJSON()).toEqual(student.toJSON());
      expect(foundStudent.teachers).toContainEqual(teacher1);
      expect(foundStudent.teachers).toContainEqual(teacher2);
    });
  });

  it("allows a teacher to have many students", async () => {
    await transaction(async () => {
      const student1 = new Student({ name: "Student1" });
      const student2 = new Student({ name: "Student2" });

      const teacher = new Teacher({ subject: "maths" });

      teacher.students = [student1, student2];
      await teacher.save();

      const foundTeacher = await Teacher.get<Teacher>(teacher.id);

      expect(foundTeacher.toJSON()).toEqual(teacher.toJSON());
      expect(foundTeacher.students).toContainEqual(student1);
      expect(foundTeacher.students).toContainEqual(student2);
    });
  });

  it("allows a teacher with students to be deleted", async () => {
    await transaction(async () => {
      const student1 = new Student({ name: "Student1" });
      const student2 = new Student({ name: "Student2" });

      const teacher = new Teacher({ subject: "maths" });

      teacher.students = [student1, student2];
      await teacher.save();

      const id = teacher.id;

      const foundTeachers1 = await Teacher.findAll<Teacher>({ id });
      expect(foundTeachers1.length).toEqual(1);

      teacher.delete();

      const foundTeachers2 = await Teacher.findAll<Teacher>({ id });
      expect(foundTeachers2.length).toEqual(0);
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js manytomany.e2e.ts
