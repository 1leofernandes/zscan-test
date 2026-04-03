import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_ATTENDANCE = 'in_attendance',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ProcedureType {
  CONSULTATION = 'consultation',
  CHECKUP = 'checkup',
  IMAGING = 'imaging',
  EXAM = 'exam',
  FOLLOW_UP = 'follow_up',
  SURGERY = 'surgery',
}

export enum ScheduleOrigin {
  IN_PERSON = 'in_person',
  PHONE = 'phone',
  ONLINE = 'online',
}

@Entity('schedules')
@Index(['patient_id'])
@Index(['professional_id'])
@Index(['start_time', 'end_time'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patient_id!: string;

  @Column({ type: 'uuid' })
  professional_id!: string;

  @Column({ type: 'varchar', length: 50 })
  professional_name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resource_room?: string;

  @Column({ type: 'enum', enum: ProcedureType, default: ProcedureType.CONSULTATION })
  procedure_type!: ProcedureType;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED })
  status!: ScheduleStatus;

  @Column({ type: 'enum', enum: ScheduleOrigin, default: ScheduleOrigin.IN_PERSON })
  origin!: ScheduleOrigin;

  @Column({ type: 'text', nullable: true })
  patient_notes?: string;

  @Column({ type: 'text', nullable: true })
  clinical_notes?: string;

  @Column({ type: 'boolean', default: false })
  is_confirmed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;
}