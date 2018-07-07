import { BaseModel, Entity, Column, ManyToMany } from "../../dist/orm";
import Student from "./Student";

@Entity()
export default class Teacher extends BaseModel {
  @Column() subject: string;

  @ManyToMany({
    type: () => Student,
    eager: true,
    throughName: "TeacherStudent"
  })
  students: Student[];
}
