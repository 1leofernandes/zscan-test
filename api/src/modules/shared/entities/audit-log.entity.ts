import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entity_type' })
  entity_type!: string;

  @Column({ name: 'entity_id' })
  entity_id!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  old_data!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_data!: Record<string, any>;

  @Column({ name: 'user_id', nullable: true })
  user_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'ip_address', nullable: true })
  ip_address!: string;

  @Column({ name: 'user_agent', nullable: true })
  user_agent!: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenant_id!: string;

  @Column({ name: 'is_sensitive', default: false })
  is_sensitive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}