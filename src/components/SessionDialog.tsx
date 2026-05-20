import { useState } from 'react'
import { X } from 'lucide-react'

interface SessionDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { date: string; serviceName: string; serviceTime: string }) => void
}

export default function SessionDialog({ open, onClose, onSubmit }: SessionDialogProps) {
  const [date, setDate] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceTime, setServiceTime] = useState('')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !serviceName || !serviceTime) return
    onSubmit({ date, serviceName, serviceTime })
    setDate('')
    setServiceName('')
    setServiceTime('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md sm:mx-4 p-6">
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
              Service Name
            </label>
            <input
              type="text"
              placeholder="e.g. Sunday Service"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={serviceTime}
              onChange={(e) => setServiceTime(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!date || !serviceName || !serviceTime}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  )
}
