"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";

type NotionDatabase = {
  id: string;
  title?: { plain_text: string }[];
  object: string;
  [key: string]: unknown;
};

export default function Dashboard() {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [previewDb, setPreviewDb] = useState<NotionDatabase | null>(null);
  const [previewRows, setPreviewRows] = useState<
    Record<string, unknown>[] | null
  >(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // Scheduling modal state
  const [scheduleDb, setScheduleDb] = useState<NotionDatabase | null>(null);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [scheduleStartDate, setScheduleStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function checkSessionAndFetch() {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      setSessionChecked(true);

      // Fetch databases
      try {
        const res = await fetch("/api/notion/databases", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch databases");
          setDatabases([]);
        } else {
          const cleaned = (data.results || []).map((db: NotionDatabase) => ({
            id: db.id,
            title:
              Array.isArray(db.title) &&
              db.title.length > 0 &&
              typeof db.title[0].plain_text === "string"
                ? db.title[0].plain_text
                : "Untitled Database",
            object: db.object,
          }));
          setDatabases(cleaned);
          setError(null);
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Unknown error");
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    }
    checkSessionAndFetch();
  }, [router]);

  async function handlePreview(db: NotionDatabase) {
    setPreviewDb(db);
    setPreviewRows(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No access token found");
      const res = await fetch(`/api/notion/databases/preview?id=${db.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch preview");
      setPreviewRows(data.rows);
    } catch (err) {
      setPreviewError((err as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  }

  // Email validation helper
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSendDigest() {
    if (!previewDb) return;
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      setSendError("Please enter a valid email address.");
      return;
    }
    if (!previewRows || previewRows.length === 0) {
      setSendError("No data to send. The database is empty.");
      return;
    }
    setSendLoading(true);
    setSendSuccess(null);
    setSendError(null);
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No access token found");
      const res = await fetch("/api/send-digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ dbId: previewDb.id, email: recipientEmail }),
      });
      if (res.ok) {
        setSendSuccess("Digest sent successfully!");
        setRecipientEmail("");
      } else {
        const err = await res.json();
        setSendError(err.error || "Failed to send digest");
      }
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSendLoading(false);
    }
  }

  async function handleCreateSchedule() {
    if (!scheduleDb) return;
    if (!scheduleEmail || !isValidEmail(scheduleEmail)) {
      setScheduleError("Please enter a valid email address.");
      return;
    }
    setScheduleLoading(true);
    setScheduleError(null);
    setScheduleSuccess(null);
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No access token found");
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          dbId: scheduleDb.id,
          email: scheduleEmail,
          frequency: scheduleFrequency,
          timeOfDay: scheduleTime,
          timezone: scheduleTimezone,
          startDate: scheduleStartDate,
          endDate: scheduleEndDate || undefined,
        }),
      });
      if (res.ok) {
        setScheduleSuccess("Schedule created successfully!");
        setScheduleDb(null);
        setScheduleEmail("");
      } else {
        const err = await res.json();
        setScheduleError(err.error || "Failed to create schedule");
      }
    } catch (err) {
      setScheduleError((err as Error).message);
    } finally {
      setScheduleLoading(false);
    }
  }

  // Accessibility: focus trap and close on Escape
  useEffect(() => {
    if (!previewDb) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewDb(null);
      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewDb]);

  // Reset dialog state when closed
  useEffect(() => {
    if (!previewDb) {
      setRecipientEmail("");
      setSendError(null);
      setSendSuccess(null);
    }
  }, [previewDb]);

  if (!sessionChecked) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-4">Your Notion Databases</h2>
      {loading && <p>Loading databases…</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && databases.length === 0 && !error && (
        <p>
          No databases found. Make sure you&apos;ve shared at least one database
          with your Notion integration.
        </p>
      )}
      <ul className="space-y-4">
        {databases.map((db) => (
          <li
            key={db.id}
            className="border p-4 rounded shadow cursor-pointer hover:bg-accent"
            aria-label={`Preview ${typeof db.title === "string" ? db.title : "Untitled Database"}`}
          >
            <div className="font-semibold">
              {typeof db.title === "string" ? db.title : "Untitled Database"}
            </div>
            <div className="text-xs text-muted-foreground">ID: {db.id}</div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => handlePreview(db)}>
                Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setScheduleDb(db);
                  setScheduleEmail("");
                  setScheduleError(null);
                  setScheduleSuccess(null);
                }}
              >
                Schedule Digest
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal for database preview */}
      <Dialog open={!!previewDb} onOpenChange={() => setPreviewDb(null)}>
        <Dialog.Content>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Database Preview"
          >
            <Dialog.Title>Database Preview</Dialog.Title>
            {previewLoading && (
              <div className="animate-pulse space-y-2 mt-4">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            )}
            {previewError && (
              <p className="text-red-500 mt-4">{previewError}</p>
            )}
            {previewRows && previewRows.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      {Object.keys(previewRows[0]).map((col) => (
                        <th
                          key={col}
                          className="border px-2 py-1 bg-muted text-left"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="border px-2 py-1">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!previewLoading && previewRows && previewRows.length === 0 && (
              <p className="mt-4">No rows found.</p>
            )}
            <div className="flex flex-col gap-2 mt-6">
              <label htmlFor="recipient-email" className="text-sm font-medium">
                Recipient Email
              </label>
              <input
                id="recipient-email"
                type="email"
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                placeholder="Enter recipient email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setSendError(null);
                  setSendSuccess(null);
                }}
                autoComplete="email"
                required
                aria-invalid={
                  !isValidEmail(recipientEmail) && recipientEmail.length > 0
                }
                aria-describedby="email-helper"
              />
              <span id="email-helper" className="text-xs text-muted-foreground">
                Enter a valid email address to receive the digest.
              </span>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                onClick={handleSendDigest}
                disabled={
                  sendLoading ||
                  !recipientEmail ||
                  !isValidEmail(recipientEmail) ||
                  !previewRows ||
                  previewRows.length === 0
                }
                aria-disabled={
                  sendLoading ||
                  !recipientEmail ||
                  !isValidEmail(recipientEmail) ||
                  !previewRows ||
                  previewRows.length === 0
                }
              >
                {sendLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  "Send Digest"
                )}
              </button>
              {sendSuccess && (
                <p className="text-green-600 mt-2">{sendSuccess}</p>
              )}
              {sendError && <p className="text-red-500 mt-2">{sendError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-muted text-sm cursor-pointer"
                onClick={() => setPreviewDb(null)}
                autoFocus
              >
                Close
              </button>
              {/* Future: Add more actions here, e.g., Send Digest, Select, etc. */}
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Scheduling Modal */}
      <Dialog open={!!scheduleDb} onOpenChange={() => setScheduleDb(null)}>
        <Dialog.Content>
          <div role="dialog" aria-modal="true" aria-label="Schedule Digest">
            <Dialog.Title>Schedule Digest</Dialog.Title>
            <div className="flex flex-col gap-2 mt-4">
              <div>
                <span className="font-medium">Database:</span>{" "}
                {typeof scheduleDb?.title === "string"
                  ? scheduleDb.title
                  : Array.isArray(scheduleDb?.title) &&
                      scheduleDb.title.length > 0 &&
                      typeof scheduleDb.title[0].plain_text === "string"
                    ? scheduleDb.title[0].plain_text
                    : "Untitled Database"}
              </div>
              <label htmlFor="schedule-email" className="text-sm font-medium">
                Recipient Email
              </label>
              <input
                id="schedule-email"
                type="email"
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                placeholder="Enter recipient email"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <label
                htmlFor="schedule-frequency"
                className="text-sm font-medium mt-2"
              >
                Frequency
              </label>
              <select
                id="schedule-frequency"
                className="border rounded px-3 py-2 text-sm"
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <label
                htmlFor="schedule-time"
                className="text-sm font-medium mt-2"
              >
                Time of Day
              </label>
              <input
                id="schedule-time"
                type="time"
                className="border rounded px-3 py-2 text-sm"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
              />
              <label
                htmlFor="schedule-timezone"
                className="text-sm font-medium mt-2"
              >
                Timezone
              </label>
              <input
                id="schedule-timezone"
                type="text"
                className="border rounded px-3 py-2 text-sm"
                value={scheduleTimezone}
                onChange={(e) => setScheduleTimezone(e.target.value)}
                required
              />
              <label
                htmlFor="schedule-start-date"
                className="text-sm font-medium mt-2"
              >
                Start Date
              </label>
              <input
                id="schedule-start-date"
                type="date"
                className="border rounded px-3 py-2 text-sm"
                value={scheduleStartDate}
                onChange={(e) => setScheduleStartDate(e.target.value)}
                required
              />
              <label
                htmlFor="schedule-end-date"
                className="text-sm font-medium mt-2"
              >
                End Date (optional)
              </label>
              <input
                id="schedule-end-date"
                type="date"
                className="border rounded px-3 py-2 text-sm"
                value={scheduleEndDate}
                onChange={(e) => setScheduleEndDate(e.target.value)}
                min={scheduleStartDate}
              />
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                onClick={handleCreateSchedule}
                disabled={scheduleLoading || !scheduleEmail}
              >
                {scheduleLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Scheduling…
                  </span>
                ) : (
                  "Save Schedule"
                )}
              </button>
              {scheduleSuccess && (
                <p className="text-green-600 mt-2">{scheduleSuccess}</p>
              )}
              {scheduleError && (
                <p className="text-red-500 mt-2">{scheduleError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-muted text-sm cursor-pointer"
                onClick={() => setScheduleDb(null)}
                autoFocus
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      <div className="mt-8 flex gap-2">
        <Button onClick={() => (window.location.href = "/")}>
          Back to Home
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const supabase = getSupabaseBrowser();
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign Out
        </Button>
      </div>
    </main>
  );
}
