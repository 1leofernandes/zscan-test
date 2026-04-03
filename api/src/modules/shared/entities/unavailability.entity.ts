import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UnavailabilityType {
  VACATION = 'vacation',
  BREAK = 'break',
  TRAINING = 'training',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

@Entity('unavailabilities')
@Index(['professional_id'])
@Index(['start_time', 'end_time'])
export class Unavailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  professional_id!: string;

  @Column({ type: 'varchar', length: 100 })
  professional_name!: string;

  @Column({ type: 'enum', enum: UnavailabilityType, default: UnavailabilityType.OTHER })
  type!: UnavailabilityType;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  start_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time?: Date;

  @Column({ type: 'boolean', default: true })
  is_all_day!: boolean;

  @Column({ type: 'varchar', name: 'resource_room', nullable: true })
  resource_room?: string;

  @Column({ type: 'boolean', default: false })
  recurring!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrence_pattern?: string;

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
