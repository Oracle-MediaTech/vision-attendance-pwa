import { userService } from "@/lib/userService";
import { IAttendance } from "@/types/attendance";
import { IUser } from "@/types/user";
import { format } from "date-fns";
import { Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";

type AttendeeTab = "all" | "non_workers" | "first_timers" | "workers";

export default function AttendeeList({
  attendees,
  onShowAdd,
}: {
  attendees: IAttendance[];
  onShowAdd: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IUser>({} as IUser);

  const [tab, setTab] = useState<AttendeeTab>("all");

  const filtered = useMemo(() => {
    let result = attendees;

    if (tab === "non_workers") {
      result = attendees.filter(
        (a) =>
          a.user?.churchStatus === "MEMBER" &&
          a.user?.membershipType !== "WORKER",
      );
    }

    if (tab === "first_timers") {
      result = attendees.filter(
        (a) =>
          a.user?.churchStatus === "FIRST_TIMER" ||
          a.user?.churchStatus === "VISITOR",
      );
    }

    if (tab === "workers") {
      result = attendees.filter((a) => a.user?.membershipType === "WORKER");
    }

    return result.sort(
      (a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime(),
    );
  }, [attendees, tab]);

  const counts = useMemo(
    () => ({
      all: attendees.length,
      non_workers: attendees.filter(
        (a) =>
          a.user?.churchStatus === "MEMBER" &&
          a.user?.membershipType !== "WORKER",
      ).length,
      first_timers: attendees.filter(
        (a) =>
          a.user?.churchStatus === "FIRST_TIMER" ||
          a.user?.churchStatus === "VISITOR",
      ).length,
      workers: attendees.filter((a) => a.user?.membershipType === "WORKER")
        .length,
    }),
    [attendees],
  );

  const tabs: { key: AttendeeTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "non_workers", label: "non_workers" },
    { key: "first_timers", label: "First Timers" },
    { key: "workers", label: "Workers" },
  ];

  const onAttendeeClick = async (attendeeId: string) => {
    setShowDetail(!showDetail);
    if (showDetail) {
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
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>
        {attendees.length === 0 ? (
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              No {tab.replace("_", " ")} in this session
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((attendee: IAttendance) => (
              <div key={attendee.id} className="">
                <button
                  className="w-full cursor-pointer px-4 sm:px-5 py-3 flex items-center justify-between"
                  onClick={() => onAttendeeClick(attendee.userId)}
                >
                  <div>
                    <p className="text-sm font-medium text-left text-gray-900">
                      {attendee.user?.firstName} {attendee.user?.lastName}
                    </p>
                    <p className="text-xs text-left text-gray-400">
                      {attendee.user?.membershipType === "WORKER"
                        ? attendee.user?.departments[0]?.name
                        : (attendee.user?.department ?? "No department")}
                      {/* {attendee.user?.department || 'No department'} */}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(attendee.markedAt), "hh:mm a")}
                  </span>
                </button>
                {
                  showDetail && result.id === attendee.userId && (
                    <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50">
                      {loading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : result && result.id === attendee.userId ? (
                        <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50">
                          <div>
                            <span className="font-medium">Email:</span> {result.email}
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
                  )
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
