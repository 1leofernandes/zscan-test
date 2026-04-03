# 🚀 Schedule Module Quick Reference

## 📍 File Locations

### Components
| Component | Path | Purpose |
|-----------|------|---------|
| Day View | `web/src/components/schedule/day-view.tsx` | Visualização por dia |
| Week View | `web/src/components/schedule/week-view.tsx` | Visualização por semana |
| Month View | `web/src/components/schedule/month-view.tsx` | Visualização por mês |
| Drag & Drop | `web/src/components/schedule/drag-drop-schedule.tsx` | Arrastar para remarcar |
| Filter Bar | `web/src/components/schedule/schedule-filter-bar.tsx` | Filtros avançados |
| Modal Agenda | `web/src/components/schedule/schedule-modal.tsx` | Criar/editar |
| Conflitos | `web/src/components/schedule/conflict-detection.tsx` | Detector de conflitos |
| Indispon. | `web/src/components/schedule/unavailability-modal.tsx` | Férias e bloqueios |

### Backend
| Resource | Path | Purpose |
|----------|------|---------|
| Controller | `api/src/modules/schedule/schedule.controller.ts` | Endpoints |
| Service | `api/src/modules/schedule/schedule.service.ts` | Lógica |
| DTOs | `api/src/modules/schedule/schedule.dto.ts` | Schemas |
| Unavail Controller | `api/src/modules/schedule/unavailability.controller.ts` | Endpoints indispon. |
| Unavail Service | `api/src/modules/schedule/unavailability.service.ts` | Lógica indispon. |
| Entities | `api/src/modules/shared/entities/` | Schedule, Unavailability |

### Hooks
| Hook | Path | Purpose |
|------|------|---------|
| useSchedule | `web/src/lib/use-schedule.ts` | Agendamentos |
| useUnavailability | `web/src/lib/use-unavailability.ts` | Indisponibilidades |

### Main Page
| Page | Path |
|------|------|
| Schedule | `web/src/app/schedule/page.tsx` |
| Backup | `web/src/app/schedule/page-old.tsx` |

---

## 🎯 Common Tasks

### Creating a Schedule
```typescript
// In component
const createSchedule = useCreateSchedule();

const handleCreate = async (data: CreateScheduleInput) => {
  await createSchedule.mutateAsync(data);
};
```

### Getting Day Agenda
```typescript
const dayAgenda = useDayAgenda(date);
// dayAgenda.data.schedules
// dayAgenda.isLoading
// dayAgenda.error
```

### Filtering Schedules
```typescript
const filtered = schedules.filter(s => 
  s.status === 'confirmed' && 
  s.procedureType === 'consultation'
);
```

### Detecting Conflicts
```typescript
import { detectConflicts } from '@/components/schedule/conflict-detection';

const conflicts = detectConflicts(schedules);
```

### Managing Unavailabilities
```typescript
const unavailabilities = useUnavailabilities(professionalId);
const createUnav = useCreateUnavailability();

await createUnav.mutateAsync({
  professionalId,
  type: 'vacation',
  startDate: '2024-04-10',
  endDate: '2024-04-20',
  isAllDay: true,
});
```

---

## 🔌 API Calls Examples

### List Schedules with Filters
```bash
GET /schedule?dateStart=2024-04-01&dateEnd=2024-04-30&statuses=scheduled,confirmed&professionalIds=prof-123
```

### Create Schedule
```bash
POST /schedule
{
  "patientId": "patient-123",
  "professionalId": "prof-456",
  "startTime": "2024-04-05T14:00:00Z",
  "endTime": "2024-04-05T15:00:00Z",
  "procedureType": "consultation",
  "origin": "in_person",
  "notes": "Paciente com gripe"
}
```

### Get Day View
```bash
GET /schedule/day-view?date=2024-04-05
```

### Create Unavailability
```bash
POST /unavailability
{
  "professionalId": "prof-123",
  "professionalName": "Dr. Silva",
  "type": "vacation",
  "title": "Férias",
  "startDate": "2024-04-10",
  "endDate": "2024-04-20",
  "isAllDay": true
}
```

---

## 🔑 Key Interfaces

### ScheduleResponse
```typescript
interface ScheduleResponse {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  procedureType: ProcedureType;
  origin: OriginType;
  notes?: string;
  clinicalNotes?: string;
  resourceRoom?: string;
  isConfirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Unavailability
```typescript
interface Unavailability {
  id?: string;
  professionalId: string;
  professionalName: string;
  type: 'vacation' | 'break' | 'training' | 'maintenance' | 'other';
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
}
```

### ScheduleFilters
```typescript
interface ScheduleFilters {
  dateRange: 'today' | 'last7days' | 'custom' | null;
  customDateStart?: string;
  customDateEnd?: string;
  selectedProfessionals: string[];
  selectedStatuses: ScheduleStatus[];
  selectedProcedureTypes: ProcedureType[];
}
```

---

## 🎨 Enums

### ScheduleStatus
- `scheduled` - Agendado (azul)
- `confirmed` - Confirmado (verde)
- `in_attendance` - Em Atendimento (amarelo)
- `completed` - Concluído (cinza)
- `cancelled` - Cancelado (vermelho)
- `no_show` - Falta (laranja)

### ProcedureType
- `consultation` - Consulta
- `checkup` - Avaliação
- `imaging` - Imagem
- `exam` - Exame
- `follow_up` - Retorno
- `surgery` - Cirurgia

### OriginType
- `in_person` - Presencial
- `phone` - Telefone
- `online` - Online

### UnavailabilityType
- `vacation` - Férias
- `break` - Intervalo
- `training` - Treinamento
- `maintenance` - Manutenção
- `other` - Outro

---

## 🧹 Cleanup/Reset

### Clear Schedule Cache
```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['schedules'] });
```

### Clear Unavailability Cache
```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['unavailabilities'] });
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Filters not updating | State not synced | Use `onFiltersChange` callback |
| Drag & drop not working | Mouse events | Ensure draggable=true |
| Conflicts not showing | Data outdated | Invalidate cache after create |
| Unavailability not blocking | Migration not run | Run `prisma migrate dev` |
| Modal not opening | State issue | Check `open` prop binding |

---

## 📊 Performance Tips

1. **Memoize expensive computations**
   ```typescript
   const filtered = useMemo(() => 
     schedules.filter(...), 
     [schedules]
   );
   ```

2. **Use React.memo for components**
   ```typescript
   export const ScheduleBlock = React.memo(({ schedule }) => ...);
   ```

3. **Paginate large lists**
   ```typescript
   pageSize: 50 // in filters
   ```

4. **Lazy load month view**
   ```typescript
   const MonthView = lazy(() => import('./month-view'));
   ```

---

## 🧪 Testing Checklist

- [ ] Components render without errors
- [ ] Filters update in real-time
- [ ] Drag & drop reschedules correctly
- [ ] Conflicts are detected
- [ ] Unavailabilities block scheduling
- [ ] Multi-tenant isolation works
- [ ] Mobile responsiveness OK
- [ ] Performance acceptable (< 1s load)

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Safari | ✅ Latest 2 versions |
| Edge | ✅ Latest 2 versions |
| Mobile (iOS/Android) | ✅ Latest versions |

---

## 🚀 Deployment Checklist

- [ ] All tests passing
- [ ] Migration applied to production
- [ ] Environment variables set
- [ ] Security headers configured
- [ ] CORS origins updated
- [ ] Rate limiting configured
- [ ] Monitoring alerts set
- [ ] Backup strategy ready
- [ ] Rollback plan ready
- [ ] Performance baseline established

---

## 📞 Quick Help

**I need to...**

| Need | Do This |
|------|---------|
| View API spec | Open http://localhost:3000/api/docs |
| Debug component | Open DevTools -> React tab |
| Check database | `docker compose exec db psql -U zscan -d zscan_main` |
| Run migrations | `npm run typeorm migration:run` |
| Clear cache | `docker compose exec web npm run build` |
| View logs | `docker compose logs -f api` |
| Restart service | `docker compose restart schedule` |

---

## 🎓 Learning Resources

1. **Components Architecture**: See individual component files
2. **Backend Logic**: Check `schedule.service.ts`
3. **Data Flow**: Trace hooks -> API -> components
4. **Styling**: shadcn/ui + Tailwind CSS
5. **State Management**: React Query + React hooks

---

## 📝 Notes

- All components are fully typed with TypeScript
- Multi-tenant support is built-in
- Soft deletes are implemented
- Audit logs via created_by/updated_by
- All operations are validated server-side
- Toast notifications can be added per need

---

**Last Updated**: April 3, 2024  
**Version**: 1.0  
**Maintained By**: Development Team
