import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { SessionServiceInput } from '@/types/attendance'
import { IServiceDay, ISpecialProgram, WEEKDAY_LABEL, Weekday } from '@/types/template'
import { serviceDayService, specialProgramService } from '@/lib/templateService'

interface ServiceFormRow {
  serviceTime: string
  preServiceTime?: string
  closesAt?: string
}

type TemplateLink =
  | { kind: 'day'; id: string }
  | { kind: 'program'; id: string }

interface SessionDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    date: string
    serviceName: string
    services: SessionServiceInput[]
    serviceDayId?: string | null
    specialProgramId?: string | null
  }) => void
}

const emptyRow: ServiceFormRow = { serviceTime: '', preServiceTime: '', closesAt: '' }

export default function SessionDialog({ open, onClose, onSubmit }: SessionDialogProps) {
  const [date, setDate] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [rows, setRows] = useState<ServiceFormRow[]>([{ ...emptyRow }])
  const [multi, setMulti] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<IServiceDay[]>([])
  const [programs, setPrograms] = useState<ISpecialProgram[]>([])
  const [template, setTemplate] = useState<TemplateLink | null>(null)

  useEffect(() => {
    if (!open) return
    serviceDayService.list().then(setDays).catch(() => setDays([]))
    specialProgramService.list().then(setPrograms).catch(() => setPrograms([]))
  }, [open])

  if (!open) return null

  const applyTemplate = (raw: string) => {
    if (!raw) {
      setTemplate(null)
      return
    }
    const templateToRows = (
      services: { serviceTime: string; preServiceTime?: string | null; closesAt?: string | null }[],
    ): ServiceFormRow[] =>
      services.map((s) => ({
        serviceTime: s.serviceTime,
        preServiceTime: s.preServiceTime ?? '',
        closesAt: s.closesAt ?? '',
      }))

    if (raw.startsWith('day:')) {
      const id = raw.slice(4)
      const d = days.find((x) => x.id === id)
      if (!d) return
      setTemplate({ kind: 'day', id })
      setServiceName(d.name)
      const next = templateToRows(d.services)
      setRows(next.length > 0 ? next : [{ ...emptyRow }])
      setMulti(next.length > 1)
    } else if (raw.startsWith('prog:')) {
      const id = raw.slice(5)
      const p = programs.find((x) => x.id === id)
      if (!p) return
      setTemplate({ kind: 'program', id })
      setServiceName(p.name)
      const next = templateToRows(p.services)
      setRows(next.length > 0 ? next : [{ ...emptyRow }])
      setMulti(next.length > 1)
    }
  }

  const currentTemplateValue = template
    ? template.kind === 'day' ? `day:${template.id}` : `prog:${template.id}`
    : ''

  const updateRow = (idx: number, patch: Partial<ServiceFormRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const addRow = () => setRows((rs) => [...rs, { ...emptyRow }])
  const removeRow = (idx: number) => setRows((rs) => rs.filter((_, i) => i !== idx))

  const validate = (): string | null => {
    if (!template) return 'Pick a service day or special program.'
    if (!date) return 'Date is required.'
    if (!serviceName.trim()) return 'Service name is required.'
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.serviceTime) return `Service ${i + 1}: service time is required.`
      if (r.preServiceTime && r.preServiceTime > r.serviceTime) {
        return `Service ${i + 1}: pre-service time must be earlier than service time.`
      }
      if (multi && i < rows.length - 1 && !r.closesAt) {
        return `Service ${i + 1}: closes-at time is required when there's a next service.`
      }
      if (r.closesAt && r.closesAt < r.serviceTime) {
        return `Service ${i + 1}: closes-at must be later than service time.`
      }
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)
    setError(null)

    const services: SessionServiceInput[] = rows.map((r, idx) => {
      const iso = (t?: string) => (t ? new Date(`${date}T${t}`).toISOString() : null)
      return {
        order: idx + 1,
        serviceTime: iso(r.serviceTime)!,
        preServiceTime: iso(r.preServiceTime) ?? null,
        closesAt: iso(r.closesAt) ?? null,
      }
    })

    onSubmit({
      date,
      serviceName: serviceName.trim(),
      services,
      serviceDayId: template?.kind === 'day' ? template.id : null,
      specialProgramId: template?.kind === 'program' ? template.id : null,
    })
    setDate('')
    setServiceName('')
    setRows([{ ...emptyRow }])
    setMulti(false)
    setTemplate(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Start New Session</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Use a template
            </label>
            <select
              value={currentTemplateValue}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">Pick a service day or special program</option>
              {days.length > 0 && (
                <optgroup label="Service Days">
                  {days.map((d) => (
                    <option key={d.id} value={`day:${d.id}`}>
                      {d.name} ({WEEKDAY_LABEL[d.weekday as Weekday]})
                    </option>
                  ))}
                </optgroup>
              )}
              {programs.length > 0 && (
                <optgroup label="Special Programs">
                  {programs.map((p) => (
                    <option key={p.id} value={`prog:${p.id}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Prefills the service name and times. You can still edit anything.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Service Name
            </label>
            <input
              type="text"
              placeholder="e.g. Sunday Service"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Service Schedule</span>
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={multi}
                onChange={(e) => {
                  const on = e.target.checked
                  setMulti(on)
                  if (!on && rows.length > 1) setRows([rows[0]])
                  if (on && rows.length < 2) setRows([...rows, { ...emptyRow }])
                }}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              Multi-service
            </label>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Service {idx + 1}</span>
                    {multi && rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label={`Remove service ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className={`grid gap-2 ${multi ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Service time *</label>
                      <input
                        type="time"
                        value={row.serviceTime}
                        onChange={(e) => updateRow(idx, { serviceTime: e.target.value })}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pre-service</label>
                      <input
                        type="time"
                        value={row.preServiceTime ?? ''}
                        onChange={(e) => updateRow(idx, { preServiceTime: e.target.value })}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    {multi && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Closes at {isLast ? '' : '*'}
                        </label>
                        <input
                          type="time"
                          value={row.closesAt ?? ''}
                          onChange={(e) => updateRow(idx, { closesAt: e.target.value })}
                          className="w-full px-2 py-2 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {multi && (
            <button
              type="button"
              onClick={addRow}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add another service
            </button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  )
}
