import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attendanceService, authService } from "@/lib/attendanceService";
import { ApiError } from "@/lib/utils";
import { IAttendanceSession } from "@/types/attendance";
import { IUser } from "@/types/user";
import SearchInput from "@/components/SearchInput";
import RegistrationForm, {
  RegistrationFormHandle,
} from "@/components/RegistrationForm";
import { format, set } from "date-fns";
import { UserPlus, Users, Calendar, Clock, Loader2, X } from "lucide-react";
import AttendeeList from "@/components/AttendanceList";
import { userService } from "@/lib/userService";

export default function SessionDetail() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<IAttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResult, setSearchResult] = useState<IUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [markedAt, setMarkedAt] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<RegistrationFormHandle>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await attendanceService.getSessionById(sessionId);
      setSession(result);
    } catch {
      // handled by toast
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const searchMembers = useCallback(async (query: string) => {
    if (query.trim() !== "") {
      setSearchLoading(true);
      try {
        const matches = await userService.searchUsers(query);
        setSearchResult(matches);
        setShowRegistrationForm(matches.length === 0);
      } catch {
        setSearchResult([]);
        setShowRegistrationForm(true);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResult([]);
      setShowRegistrationForm(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchMembers(memberSearch), 500);
    return () => clearTimeout(timeout);
  }, [memberSearch, searchMembers]);

  const buildDateFromTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);

    return set(new Date(), {
      hours,
      minutes,
      seconds: 0,
      milliseconds: 0,
    });
  };

  const handleSingleMark = async (userId: string) => {
    if (!sessionId) return;
    try {
      console.log("Marking attendance for user:", userId, "at time:", markedAt);
      await attendanceService.markAttendance({
        userId,
        sessionId,
        markedAt: markedAt ? buildDateFromTime(markedAt) : undefined,
      });
      setMemberSearch("");
      setSearchResult([]);
      setShowRegistrationForm(false);
      await fetchSession();
    } catch {
      // handled by toast
    }
  };

  const handleRegisterUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setRegistering(true);
    setFieldErrors({});
    try {
      const formData = new FormData(form);
      const payload: Record<string, FormDataEntryValue | FormDataEntryValue[]> =
        {};
      formData.forEach((value, key) => {
        payload[key] = value;
      });
      payload.departmentIds = formData.getAll("departmentIds");
      const res = await authService.register(payload);
      if (res?.user?.id) {
        form.reset();
        formRef.current?.reset();
        await handleSingleMark(res.user.id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Session not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-3 text-sm text-emerald-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const date = session.startedAt ? new Date(session.startedAt) : null;
  const attendees = session.attendees || [];
  const markedUserIds = new Set(attendees.map((a) => a.userId));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Session Info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {session.serviceName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
            {date && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {format(date, "EEE, dd MMM yyyy")}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {format(date, "hh:mm a")}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Users className="w-3.5 h-3.5" />
              {attendees.length} attendees
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Mark Attendance
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Add Attendance Panel */}
        {showAddPanel && (
          <div className="w-full lg:flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[60vh] lg:max-h-[calc(100vh-200px)]">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Add non_workers
              </h3>
              <button
                onClick={() => {
                  setShowAddPanel(false);
                  setMemberSearch("");
                  setSearchResult([]);
                  setShowRegistrationForm(false);
                  setFieldErrors({});
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100">
              <SearchInput
                value={memberSearch}
                onChange={setMemberSearch}
                placeholder="Search non_workers..."
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : searchResult.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {searchResult.map((user) => {
                    const userId = user.id || user._id || "";
                    const alreadyMarked = markedUserIds.has(userId);
                    return (
                      <li key={userId}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              !alreadyMarked && handleSingleMark(userId)
                            }
                            disabled={alreadyMarked}
                            className={`w-full px-4 py-3 min-h-[44px] flex justify-between items-center text-left transition-colors ${
                              alreadyMarked
                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                            }`}
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {alreadyMarked
                                ? "Already marked"
                                : user.churchStatus}
                            </span>
                          </button>
                          <input
                            type="time"
                            value={markedAt}
                            placeholder="Mark Time"
                            onChange={(e) => setMarkedAt(e.target.value)}
                            className="px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : !memberSearch.trim() ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">
                    Type to search non_workers
                  </p>
                </div>
              ) : showRegistrationForm ? (
                <RegistrationForm
                  ref={formRef}
                  onSubmit={handleRegisterUser}
                  isSubmitting={registering}
                  fieldErrors={fieldErrors}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Attendee List */}
        <AttendeeList
          attendees={attendees}
          onShowAdd={() => setShowAddPanel(true)}
        />
      </div>
    </div>
  );
}
