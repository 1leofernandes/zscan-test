# ZScan Schedule - Próximos Passos para Completar

## Imediato (1-2 horas)

### Frontend - UI Components
- [ ] Instalar shadcn/ui components (`npx shadcn-ui@latest init`)
- [ ] Criar componentes base: Button, Input, Form, Alert, Table, Dialog
- [ ] Implementar página de cadastro de paciantes (multi-step form)
- [ ] Implementar visualização de agenda (dia/semana)
- [ ] Criar componente de agenda com drag-and-drop

### Docker & Environment
- [ ] Criar `docker-compose.yml` com: PostgreSQL, Redis, pgAdmin
- [ ] Criar script de seed com usuários de teste
- [ ] Configurar volumes para persistência
- [ ] Testar `docker-compose up --build`

### Database Migrations
- [ ] Criar migration inicial para tenant público
- [ ] Testar criação automática de schema para novo tenant
- [ ] Validar indices e constraints

## Curto Prazo (2-3 horas)

### Frontend Avançado
- [ ] Implementar: Login com validação, redirect ao dashboard
- [ ] Lista de pacientes com filtros, busca, paginação
- [ ] Calendário funcional com criação rápida de agendamentos
- [ ] Modal de detalhes do agendamento
- [ ] Toast notifications com React Hot Toast

### Testes
- [ ] Testes unitários do Auth Service
- [ ] Testes do TenantGuard
- [ ] Testes de validação Zod

### Documentação
- [ ] Diagrama C4 (Architecture.md)
- [ ] Swagger funcionando no `/api/docs`
- [ ] README finalizado com instruções de setup

## Ideias Extras para Impressionar

1. **Real-time Updates**: WebSocket para notificações de agenda
2. **Dark Mode**: Suporte com next-themes
3. **Offline Support**: PWA + Service Workers
4. **Analytics**: Dashboard de métricas por tenant
5. **Email Notifications**: Envio de confirmações de agendamento
6. **QR Code Check-in**: Para recepções
7. **Mobile App**: React Native com Expo
8. **FHIR Integration**: Padrão de saúde
9. **Machine Learning**: Predição de não-comparecimento
10. **Backup Automático**: AWS S3 / Backup automático de schema

## Arquivos Faltando

### Frontend
- [ ] `src/app/patients/page.tsx` - Lista de pacientes
- [ ] `src/app/patients/new/page.tsx` - Novo paciente (multi-step)
- [ ] `src/app/patients/[id]/edit/page.tsx` - Editar paciente
- [ ] `src/app/schedule/page.tsx` - Agenda
- [ ] `src/components/schedule/agenda-day-view.tsx`
- [ ] `src/components/schedule/agenda-week-view.tsx`
- [ ] `src/lib/queries/patients.ts` - React Query hooks
- [ ] `src/lib/queries/schedule.ts` - React Query hooks
- [ ] `src/app/layout.tsx` - Layout principal com navegação

### Backend  
- [ ] `src/common/guards/jwt-auth.guard.ts` - Guard de JWT
- [ ] `src/database/migrations/*` - Migrations de setup
- [ ] `src/common/filters/http-exception.filter.ts` - Global exception filter
- [ ] `src/common/interceptors/logging.interceptor.ts` - Logging

### Infrastructure
- [ ] `docker-compose.yml`
- [`.docker/postgres/init.sql` - Seed data
- [ ] `.env.example` - Template de variáveis
- [ ] `docker-build-scripts/`

## Configuração Rápida para Começar

```bash
# Backend
cd api
npm install
npm run build
npm run start:dev

# Frontend (em outro terminal)
cd web
npm install
npm run dev

# Docker (opcional)
docker-compose up -d --build
```

## Checklist de Requisitos do Teste

- [x] Multi-tenancy com schema-per-tenant
- [x] Isolamento de dados
- [x] Guard de tenant no NestJS
- [x] Entidade Paciente completa
- [x] CRUD de pacientes
- [x] Soft delete
- [x] Auditoria (criação do framework)
- [x] Entidade Agendamento completa
- [x] Busca de CEP (estrutura pronta)
- [x] Validação de CPF (estrutura pronta)
- [x] Visão dia (estrutura pronta)
- [x] Visão semana (estrutura pronta)
- [x] Filtros de agenda (implementados no backend)
- [x] JWT + Refresh Token
- [x] Rate limiting
- [x] Validação DTOs (class-validator)
- [x] Swagger/OpenAPI
- [x] TypeScript strict mode
- [ ] Testes unitários (próximo passo)
- [ ] Docker compose
- [ ] README com diagrama C4

## Próximas Ações Prioritárias

1. **Criar UI Components** com shadcn/ui
2. **Implementar React Query hooks** para fetch de dados
3. **Criar páginas de pacientes** (listar, criar, editar)
4. **Implementar agenda visual** com componentes de horário
5. **Adicionar Docker** para facilitar setup local
6. **Escrever testes** dos serviços críticos
