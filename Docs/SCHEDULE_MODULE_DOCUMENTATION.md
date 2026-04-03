# 📅 Sistema de Agendamento Avançado - Documentação Completa

## 📋 Visão Geral

O novo módulo de agendamento implementa todas as funcionalidades especificadas no documento técnico de requisitos:

### ✅ Funcionalidades Implementadas

#### 1. **Entidade de Agendamento Completa**
- ✅ Paciente (FK obrigatória)
- ✅ Profissional / Recurso (médico, sala, equipamento)
- ✅ Tipo de procedimento / consulta (6 tipos)
- ✅ Data/hora inicial e final (com duração padrão)
- ✅ Status com 6 estados possíveis
- ✅ Observações / instruções ao paciente
- ✅ Origem: presencial, telefone, online
- ✅ Notas clínicas adicionais
- ✅ Confirmação e data de confirmação

#### 2. **Visualizações da Agenda**

##### 🗓️ **Visão Dia (Obrigatória)**
- Componente: `ScheduleDayView`
- Arquivo: `web/src/components/schedule/day-view.tsx`
- Características:
  - Layout com horários da esquerda
  - Grid de agendamentos colorido por status
  - Clique para ver detalhes
  - Estatísticas do dia (total, confirmados, em progresso)
  - Responsivo e intuitivo

##### 📆 **Visão Semana (Obrigatória)**
- Componente: `ScheduleWeekView`
- Arquivo: `web/src/components/schedule/week-view.tsx`
- Características:
  - 7 colunas (Segunda a domingo)
  - Blocos coloridos por status e tipo
  - Navegação entre semanas
  - Clique no bloco abre detalhes
  - Indicador visual de ocupação

##### 📊 **Visão Mês (Desejável)**
- Componente: `ScheduleMonthView`
- Arquivo: `web/src/components/schedule/month-view.tsx`
- Características:
  - Resumo de ocupação mensal
  - Indicador de quantidade por dia
  - Clique no dia navega para visão diária
  - Cores destacando dias com agendamentos

##### 🖱️ **Visão Drag & Drop (Extras)**
- Componente: `DragDropScheduleView`
- Arquivo: `web/src/components/schedule/drag-drop-schedule.tsx`
- Características:
  - Timeline horizontal com horários
  - Arrastar agendamento para remarcação
  - Cálculo automático de conflitos
  - Visual intuitivo estilo Google Agenda

#### 3. **Filtros e Navegação**

Componente: `ScheduleFilterBar`
Arquivo: `web/src/components/schedule/schedule-filter-bar.tsx`

**Filtros Disponíveis:**

| Filtro | Comportamento |
|--------|---|
| **Hoje** | Exibe apenas agendamentos do dia corrente |
| **Últimos 7 dias** | D-7 até hoje |
| **Range de datas** | Date picker com limite de 90 dias |
| **Profissional** | Multi-seleção com dropdown |
| **Status** | Chips de filtro (multi-seleção) |
| **Tipo de procedimento** | Dropdown de busca |

- ✅ Sem recarregar página
- ✅ Filtros em tempo real
- ✅ Visualização de filtros ativos
- ✅ Botão para limpar todos

#### 4. **Interações Esperadas**

- ✅ **Criar agendamento**: Clique em slot vazio (modal de criação rápida)
- ✅ **Arrastar e soltar**: Drag & drop para remarcação
- ✅ **Clique no bloco**: Abre detalhes com opções (editar, cancelar, confirmar)
- ✅ **Detecção de conflito**: Visual com alertas e sugestões
- ✅ **Bloqueio de horários**: Férias, indisponibilidade (recurso novo)
- ✅ **Vagas disponíveis**: Indicador por período (calculado automaticamente)

#### 5. **Funcionalidades Extras Implementadas**

##### 🔒 **Períodos de Indisponibilidade**
- Entidade: `Unavailability`
- Tipos: Férias, Intervalo, Treinamento, Manutenção, Outro
- Componente: `UnavailabilityModal` e `UnavailabilityList`
- Tipos de bloqueio:
  - Dia inteiro ou com horários específicos
  - Recorrente (opcional)
  - Por profissional ou recurso
  
##### ⚠️ **Detecção de Conflitos**
- Componente: `ConflictDetection`
- Arquivo: `web/src/components/schedule/conflict-detection.tsx`
- Detecta:
  - Sobreposição de horário
  - Double booking (mesmo profissional)
  - Conflito de recurso
- Severidade: Warning ou Error
- Ações rápidas para resolver

---

## 🗂️ Estrutura de Arquivos

### Backend (NestJS)

```
api/src/modules/schedule/
├── schedule.controller.ts         # Controller principal
├── schedule.service.ts            # Serviço de agendamentos
├── schedule.dto.ts                # Data Transfer Objects
├── schedule.module.ts             # Módulo (atualizado)
├── unavailability.controller.ts   # Controller de indisponibilidades
├── unavailability.service.ts      # Serviço de indisponibilidades
├── unavailability.dto.ts          # DTOs de indisponibilidades
└── schedule.service.spec.ts       # Testes

api/src/modules/shared/entities/
├── schedule.entity.ts             # Entidade Schedule
└── unavailability.entity.ts       # Entidade Unavailability (novo)

api/src/database/migrations/
├── 1704067200000-InitializePublicSchema.ts
├── 1704067400000-CreateTenantSchema.ts
└── 1704070000000-CreateUnavailabilityTable.ts  # (novo)
```

### Frontend (Next.js)

```
web/src/
├── app/schedule/
│   ├── page.tsx                   # Página principal (melhorada)
│   └── page-old.tsx               # Versão anterior (backup)
│
├── components/schedule/
│   ├── day-view.tsx               # Visualização de dia
│   ├── week-view.tsx              # Visualização de semana
│   ├── month-view.tsx             # Visualização de mês
│   ├── drag-drop-schedule.tsx      # Visão com drag & drop (novo)
│   ├── schedule-modal.tsx          # Modal para criar/editar
│   ├── schedule-filter-bar.tsx     # Barra de filtros (novo)
│   ├── conflict-detection.tsx      # Detector de conflitos (novo)
│   └── unavailability-modal.tsx    # Modal de indisponibilidades (novo)
│
├── lib/
│   ├── use-schedule.ts            # Hooks de agendamentos
│   └── use-unavailability.ts      # Hooks de indisponibilidades (novo)
│
└── types/
    └── schedule.ts                # Tipos TypeScript
```

---

## 🔌 API Endpoints

### Schedule Endpoints

```
POST   /schedule                      Create schedule
GET    /schedule                      List schedules with filters
GET    /schedule/:id                  Get schedule details
GET    /schedule/day-view             Get day agenda
GET    /schedule/week-view            Get week agenda
GET    /schedule/availability         Check slots availability
PATCH  /schedule/:id                  Update schedule
PATCH  /schedule/:id/status           Update status only
DELETE /schedule/:id                  Cancel schedule
```

### Unavailability Endpoints (NEW)

```
POST   /unavailability                Create unavailability
GET    /unavailability                List unavailabilities
GET    /unavailability/:id            Get unavailability details
GET    /unavailability?filter=xxx     With filters (professional, date range)
PATCH  /unavailability/:id            Update unavailability
DELETE /unavailability/:id            Delete unavailability
```

---

## 📦 DTOs e Tipos

### Schedule Types

```typescript
export type ScheduleStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_attendance' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type ProcedureType = 
  | 'consultation' 
  | 'checkup' 
  | 'imaging' 
  | 'exam' 
  | 'follow_up' 
  | 'surgery';

export type OriginType = 
  | 'in_person' 
  | 'phone' 
  | 'online';

export interface ScheduleResponse {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  resourceRoom?: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  procedureType: ProcedureType;
  origin: OriginType;
  notes?: string;
  clinicalNotes?: string;
  isConfirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Unavailability Types

```typescript
export type UnavailabilityType = 
  | 'vacation' 
  | 'break' 
  | 'training' 
  | 'maintenance' 
  | 'other';

export interface Unavailability {
  id?: string;
  professionalId: string;
  professionalName: string;
  type: UnavailabilityType;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  resourceRoom?: string;
  recurring?: boolean;
  recurrencePattern?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🎯 Casos de Uso

### 1. Visualizar Agenda do Dia
```
👤 Usuário: Recepcionista
1. Acessa a página de agendamentos
2. Visualiza por padrão a visão "Dia"
3. Vê todos os agendamentos de hoje em ordem cronológica
4. Pode filtrar por profissional, status ou tipo de procedimento
5. Clica em um agendamento para ver detalhes
```

### 2. Criar Novo Agendamento
```
👤 Usuário: Recepcionista
1. Clica em "Novo Agendamento" no topo
2. Abre modal com campos:
   - Paciente (busca)
   - Profissional (dropdown)
   - Tipo de procedimento (dropdown)
   - Data e hora
   - Origem (presencial/telefone/online)
   - Observações
3. Sistema verifica conflitos automaticamente
4. Confirma criação com sucesso
```

### 3. Remarcação por Drag & Drop
```
👤 Usuário: Recepcionista
1. Vai para visão "Drag & Drop"
2. Seleciona dia desejado
3. Vê timeline com todos os agendamentos
4. Clica e arrasta agendamento para novo horário
5. Sistema detecta conflitos em tempo real
6. Confirma nova data/hora
```

### 4. Gerenciar Indisponibilidades
```
👤 Usuário: Administrador/Profissional
1. Acessa "Indisponibilidades" na página de agenda
2. Vê lista de períodos bloqueados
3. Clica "Adicionar" para nova indisponibilidade
4. Preenche:
   - Profissional afetado
   - Tipo (férias, treinamento, etc)
   - Período (data inicial/final)
   - Se é dia inteiro ou com horários específicos
5. Salva e sistema já desativa esses horários
```

### 5. Filtrar Agendamentos
```
👤 Usuário: Qualquer um
1. Na barra superior, clica em cada filtro desejado
2. "Hoje" - mostra só de hoje
3. "Últimos 7 dias" - semana inteira
4. "Data customizada" - escolhe período (max 90 dias)
5. "Profissional" - multi-select de quem trabalhou
6. "Status" - filtro por (agendado, confirmado, etc)
7. "Tipo" - por tipo de procedimento
8. Filtros combinam-se automaticamente
9. Clica "Limpar" para remover todos
```

### 6. Resolver Conflito Detectado
```
👤 Usuário: Recepcionista
1. Sistema detecta double booking automaticamente
2. Mostra alerta com ⚠️ indicador de conflito
3. Clica "Resolver" no alerta
4. Pode:
   - Ver agendamento 1
   - Ver agendamento 2
   - Editar um deles para horário diferente
5. Conflito desaparece após resolução
```

---

## 🔐 Segurança e Multi-tenant

✅ **Todos os endpoints possuem:**
- Autenticação JWT obrigatória
- Validação de tenant context
- Isolamento de dados por schema

✅ **Cada operação:**
- Respeita o `tenant_schema` do usuário
- Auditoria de criação/atualização (created_by, updated_by)
- Soft delete com timestamp

---

## 📊 Performance e Otimizações

- ✅ Índices no banco em `professional_id`, `start_time`, `end_time`
- ✅ Cache invalidação inteligente no TanStack Query
- ✅ Paginação nos endpoints (pageSize configurável)
- ✅ Lazy loading de componentes
- ✅ Memoização de cálculos caros

---

## 🧪 Testes

### Backend
```bash
cd api
npm run test schedule.service.spec.ts
```

### Frontend
```bash
cd web
npm run test -- schedule
```

---

## 📱 Responsividade

✅ Componentes totalmente responsivos:
- Mobile: Stack vertical dos filtros
- Tablet: 2 colunas na semana
- Desktop: Layout completo com sidebars

---

## 🚀 Próximos Passos (Futuros)

1. **Notificações**: SMS/Email para confirmação
2. **iCal/Google Calendar**: Sincronização
3. **Recorrência**: Agendamentos recorrentes automáticos
4. **Regras**: Bloqueios por tipo de procedimento
5. **Relatórios**: Analytics de ocupação
6. **Mobile App**: App nativo para profissionais
7. **Videoconferência**: Integração com Zoom/Teams
8. **Pagamento**: Integração com sistema de cobranças

---

## 📝 Checklist de Funcionalidade

- [x] 4.1 Entidade Agendamento com todos os campos
- [x] 4.2 Visualização Dia (obrigatória)
- [x] 4.2 Visualização Semana (obrigatória)
- [x] 4.2 Visualização Mês (desejável)
- [x] 4.3 Filtro "Hoje"
- [x] 4.3 Filtro "Últimos 7 dias"
- [x] 4.3 Filtro "Range de datas"
- [x] 4.3 Filtro "Profissional" (multi-select)
- [x] 4.3 Filtro "Status" (multi-select)
- [x] 4.3 Filtro "Tipo de procedimento"
- [x] 4.4 Criar por clique em slot vazio
- [x] 4.4 Drag & drop para remarc ação
- [x] 4.4 Clique abre detalhes
- [x] 4.4 Indicação visual de conflito
- [x] 4.4 Bloqueio de horários
- [x] 4.4 Indicador de vagas disponíveis

---

## 🎨 Paleta de Cores

```
Scheduled:  #3B82F6 (Azul)
Confirmed: #10B981 (Verde)
In Attendance: #F59E0B (Amarelo)
Completed: #6B7280 (Cinza)
Cancelled: #EF4444 (Vermelho)
No Show: #F97316 (Laranja)
```

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- API Swagger: `http://localhost:3000/api/docs`
- Code: `api/src/modules/schedule/`
- Frontend: `web/src/components/schedule/`
