import { userService } from "@/lib/userService";
import { IAttendance } from "@/types/attendance";
import { IUser } from "@/types/user";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  attendees: IAttendance[];
  onShowAdd: () => void;
  isFiltered?: boolean;
  /** When > 1, a "S{n}" chip is shown next to each attendee's name. */
  serviceCount?: number;
}

type SortKey = "markedAt" | "name" | "serviceOrder";
type SortDir = "asc" | "desc";

export default function AttendeeList({ attendees, onShowAdd, isFiltered, serviceCount = 1 }: Props) {
  const showServiceChip = serviceCount > 1;
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IUser>({} as IUser);
  const [selectedUser, setSelectedUser] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("markedAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const getKey = (a: IAttendance): number | string => {
      switch (sortBy) {
        case "name":
          return `${a.user?.firstName ?? ""} ${a.user?.lastName ?? ""}`.toLowerCase();
        case "serviceOrder":
          return a.serviceOrder ?? 0;
        case "markedAt":
        default:
          return new Date(a.markedAt).getTime();
      }
    };
    const direction = sortDir === "asc" ? 1 : -1;
    return [...attendees].sort((a, b) => {
      const ka = getKey(a);
      const kb = getKey(b);
      if (ka < kb) return -1 * direction;
      if (ka > kb) return 1 * direction;
      return 0;
    });
  }, [attendees, sortBy, sortDir]);

  const onAttendeeClick = async (attendeeId: string) => {
    const nextShowDetail = !(showDetail && selectedUser === attendeeId);
    setSelectedUser(attendeeId);
    setShowDetail(nextShowDetail);

    if (nextShowDetail) {
      setLoading(true);
      try {
        const user = await userService.getUser(attendeeId);
        setResult(user);
      } catch {
        setResult({} as IUser);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full lg:flex-1">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-600">
            {sorted.length} {sorted.length === 1 ? "attendee" : "attendees"}
            {isFiltered && sorted.length > 0 ? " (filtered)" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
              aria-label="Sort by"
            >
              <option value="markedAt">Time</option>
              <option value="name">Name</option>
              {showServiceChip && <option value="serviceOrder">Service</option>}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="p-1 text-gray-600 hover:text-gray-900 border border-gray-300 rounded bg-white"
              aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
        {sorted.length === 0 ? (
          isFiltered ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No attendees match the current filters</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No attendees yet</p>
              <button
                onClick={onShowAdd}
                className="mt-2 text-sm text-emerald-600 hover:underline font-medium"
              >
                Mark attendance
              </button>
            </div>
          )
        ) : (
          <div className="divide-y divide-gray-100">
            {sorted.map((attendee: IAttendance) => (
              <div key={attendee.id} className="">
                <button
                  className="w-full cursor-pointer px-4 sm:px-5 py-3 flex items-center justify-between"
                  onClick={() => onAttendeeClick(attendee.userId)}
                >
                  <div>
                    <p className="text-sm font-medium text-left text-gray-900 flex items-center gap-1.5">
                      {attendee.user?.firstName} {attendee.user?.lastName}
                      {showServiceChip && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          S{attendee.serviceOrder}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-left text-gray-400">
                      {attendee.user?.membershipType === "WORKER"
                        ? (attendee.user?.departments?.[0]?.name ??
                          "No department")
                        : (attendee.user?.department ?? "No department")}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(attendee.markedAt), "hh:mm a")}
                  </span>
                </button>
                {showDetail && selectedUser === attendee.userId && (
                  <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50">
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : result && result.id === attendee.userId ? (
                      <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50">
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {result.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {result.phoneNumber}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span>{" "}
                          {result.gender}
                        </div>
                        <div>
                          <span className="font-medium">Address:</span>{" "}
                          {result.address}
                        </div>

                        {result.department && (
                          <div>
                            <span className="font-medium">Department:</span>{" "}
                            {result.department}
                          </div>
                        )}

                        {result.faculty && (
                          <div>
                            <span className="font-medium">Faculty:</span>{" "}
                            {result.faculty}
                          </div>
                        )}

                        {result.level && (
                          <div>
                            <span className="font-medium">Level:</span>{" "}
                            {result.level}
                          </div>
                        )}

                        {result.membershipType && (
                          <div>
                            <span className="font-medium">Membership:</span>{" "}
                            {result.membershipType}
                          </div>
                        )}

                        {result.workerType && (
                          <div>
                            <span className="font-medium">Worker Type:</span>{" "}
                            {result.workerType}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-sm text-gray-400">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
