import { Loader2, UserPlus } from 'lucide-react'

interface RegistrationFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isSubmitting: boolean
}

const inputClass = "border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full"

export default function RegistrationForm({ onSubmit, isSubmitting }: RegistrationFormProps) {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500 mb-3 text-center">
        No member found. Register new member:
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" name="firstName" placeholder="First Name" required className={inputClass} />
          <input type="text" name="lastName" placeholder="Last Name" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="email" name="email" placeholder="Email" required className={inputClass} />
          <input type="text" name="phoneNumber" placeholder="Phone Number" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select name="gender" required className={inputClass}>
            <option value="">Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <input type="text" name="level" placeholder="Level" className={inputClass} />
        </div>
        <input type="text" name="address" placeholder="Address" required className={inputClass} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" name="faculty" placeholder="Faculty" className={inputClass} />
          <input type="text" name="department" placeholder="Department" className={inputClass} />
        </div>
        <select name="churchStatus" required className={inputClass}>
          <option value="">Church Status</option>
          <option value="MEMBER">Member</option>
          <option value="VISITOR">Visitor</option>
          <option value="FIRST_TIMER">First Timer</option>
        </select>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Register & Mark Attendance
        </button>
      </form>
    </div>
  )
}
