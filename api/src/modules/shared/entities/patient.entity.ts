import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', length: 100 })
  full_name!: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  date_of_birth!: Date;

  @Column({ length: 11, unique: true })
  cpf!: string;

  @Column({ length: 15, nullable: true })
  cns!: string;

  @Column({ type: 'enum', enum: ['M', 'F', 'O'] })
  gender!: 'M' | 'F' | 'O';

  @Column({ name: 'phone_primary', length: 20 })
  phone_primary!: string;

  @Column({ name: 'phone_secondary', length: 20, nullable: true })
  phone_secondary!: string;

  @Column({ length: 100, nullable: true })
  email!: string;

  @Column({ type: 'jsonb' })
  address!: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
  };

  @Column({ name: 'insurance_id', nullable: true })
  insurance_id!: string;

  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  clinical_notes!: string;

  @Column({ name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ name: 'created_by', nullable: true })
  created_by!: string;

  @Column({ name: 'updated_by', nullable: true })
  updated_by!: string;

  @Column({ name: 'deleted_by', nullable: true })
  deleted_by!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}