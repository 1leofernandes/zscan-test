-- Inserir agendamentos na tabela schedules
INSERT INTO tenant_main.schedules (
  id, patient_id, professional_id, professional_name, resource_room,
  procedure_type, start_time, end_time, status, origin, notes,
  created_at, updated_at
) VALUES 
-- ============================================
-- 03/04/2026 (Hoje)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '12345678901' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'consultation',
  '2026-04-03 09:00:00',
  '2026-04-03 09:30:00',
  'confirmed',
  'phone',
  'Consulta de rotina - Paciente hipertenso',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '23456789012' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'checkup',
  '2026-04-03 10:30:00',
  '2026-04-03 11:00:00',
  'confirmed',
  'online',
  'Checkup anual - Exames preventivos',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '34567890123' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'imaging',
  '2026-04-03 14:00:00',
  '2026-04-03 14:30:00',
  'scheduled',
  'in_person',
  'Ressonância magnética - Joelho direito',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '45678901234' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'consultation',
  '2026-04-03 15:30:00',
  '2026-04-03 16:00:00',
  'scheduled',
  'in_person',
  'Retorno de cirurgia cardíaca',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '56789012345' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'exam',
  '2026-04-03 17:00:00',
  '2026-04-03 17:30:00',
  'scheduled',
  'phone',
  'Exame de sangue - Resultados',
  NOW(),
  NOW()
),

-- ============================================
-- 04/04/2026 (Amanhã)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '12345678901' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'consultation',
  '2026-04-04 09:00:00',
  '2026-04-04 09:30:00',
  'confirmed',
  'in_person',
  'Consulta de rotina',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '23456789012' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'surgery',
  '2026-04-04 10:00:00',
  '2026-04-04 12:00:00',
  'confirmed',
  'in_person',
  'Cirurgia de joelho - Pré-operatório',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '34567890123' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'checkup',
  '2026-04-04 14:00:00',
  '2026-04-04 14:30:00',
  'scheduled',
  'online',
  'Checkup cardiológico',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '45678901234' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'imaging',
  '2026-04-04 15:30:00',
  '2026-04-04 16:00:00',
  'scheduled',
  'in_person',
  'Ultrassom abdominal',
  NOW(),
  NOW()
),

-- ============================================
-- 05/04/2026 (Domingo)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '56789012345' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'follow_up',
  '2026-04-05 09:30:00',
  '2026-04-05 10:00:00',
  'confirmed',
  'phone',
  'Retorno pós-operatório',
  NOW(),
  NOW()
),

-- ============================================
-- 06/04/2026 (Segunda)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '12345678901' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'consultation',
  '2026-04-06 08:00:00',
  '2026-04-06 08:30:00',
  'scheduled',
  'in_person',
  'Consulta ortopédica',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '23456789012' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'surgery',
  '2026-04-06 09:00:00',
  '2026-04-06 11:00:00',
  'scheduled',
  'in_person',
  'Angioplastia',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '34567890123' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'exam',
  '2026-04-06 13:00:00',
  '2026-04-06 13:30:00',
  'confirmed',
  'phone',
  'Resultado de exames',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '45678901234' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'consultation',
  '2026-04-06 15:00:00',
  '2026-04-06 15:30:00',
  'scheduled',
  'in_person',
  'Consulta de retorno',
  NOW(),
  NOW()
),

-- ============================================
-- 07/04/2026 (Terça)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '56789012345' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'checkup',
  '2026-04-07 10:00:00',
  '2026-04-07 10:30:00',
  'confirmed',
  'online',
  'Checkup cardiológico',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '12345678901' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'imaging',
  '2026-04-07 14:30:00',
  '2026-04-07 15:00:00',
  'cancelled',
  'phone',
  'Cancelado pelo paciente',
  NOW(),
  NOW()
),

-- ============================================
-- 08/04/2026 (Quarta)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '23456789012' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'consultation',
  '2026-04-08 09:00:00',
  '2026-04-08 09:30:00',
  'scheduled',
  'in_person',
  'Consulta dermatológica',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '34567890123' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'surgery',
  '2026-04-08 11:00:00',
  '2026-04-08 13:00:00',
  'scheduled',
  'in_person',
  'Cirurgia de quadril',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '45678901234' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'follow_up',
  '2026-04-08 16:00:00',
  '2026-04-08 16:30:00',
  'confirmed',
  'phone',
  'Retorno de cirurgia',
  NOW(),
  NOW()
),

-- ============================================
-- 09/04/2026 (Quinta)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '56789012345' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'checkup',
  '2026-04-09 09:30:00',
  '2026-04-09 10:00:00',
  'scheduled',
  'online',
  'Checkup preventivo',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '12345678901' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Roberto Lima',
  'Sala 103',
  'imaging',
  '2026-04-09 13:00:00',
  '2026-04-09 13:30:00',
  'scheduled',
  'in_person',
  'Raio-X de tórax',
  NOW(),
  NOW()
),

-- ============================================
-- 10/04/2026 (Sexta)
-- ============================================
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '23456789012' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Dr. Carlos Silva',
  'Sala 101',
  'consultation',
  '2026-04-10 08:30:00',
  '2026-04-10 09:00:00',
  'confirmed',
  'in_person',
  'Consulta cardiológica',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM tenant_main.patients WHERE cpf = '34567890123' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dra. Ana Paula',
  'Sala 102',
  'exam',
  '2026-04-10 14:00:00',
  '2026-04-10 14:30:00',
  'scheduled',
  'phone',
  'Resultado de biópsia',
  NOW(),
  NOW()
);