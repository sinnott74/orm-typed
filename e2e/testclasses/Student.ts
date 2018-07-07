import { BaseModel, Entity, Column, ManyToMany } from "../../dist/orm";
import Teacher from "./Teacher";

@Entity()
export default class Student extends BaseModel {
  @Column() name: string;

  @ManyToMany({
    type: () => Teacher,
    eager: true,
    throughName: "TeacherStudent"
  })
  teachers: Teacher[];
}
