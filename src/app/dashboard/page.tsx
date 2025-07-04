"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { addCsrfHeaders } from "@/lib/csrf-client";
import Image from "next/image";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionComponents";

type NotionDatabase = {
  id: string;
  title?: { plain_text: string }[];
  object: string;
  [key: string]: unknown;
};

type Schedule = {
  id: string;
  user_id: string;
  db_id: string;
  email: string;
  frequency: string;
  time_of_day: string;
  timezone: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  // Schedules state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [totalSchedules, setTotalSchedules] = useState<number>(0);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [dbFilter, setDbFilter] = useState<string>("all");
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  // Sorting state
  const [sortBy, setSortBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "start_date", direction: "desc" });
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Edit modal state
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  // Row action feedback state
  const [rowActionLoading, setRowActionLoading] = useState<string | null>(null); // schedule id
  const [rowActionSuccess, setRowActionSuccess] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<string | null>(null);
  // Notion sign out confirmation state
  const [showNotionSignOutConfirm, setShowNotionSignOutConfirm] =
    useState(false);
  const [notionConnected, setNotionConnected] = useState<boolean | null>(null);
  // Notion disconnect banner
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  // Subscription state
  const [subscriptionMaxDigests, setSubscriptionMaxDigests] =
    useState<number>(3);
  const [isNearLimit, setIsNearLimit] = useState<boolean>(false);
  const [isOverLimit, setIsOverLimit] = useState<boolean>(false);
  // UI state for subscription limit errors
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState<string | null>(
    null,
  );

  // Helper to check Notion connection
  const checkNotionConnection = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setNotionConnected(false);
      return;
    }
    try {
      const res = await fetch("/api/notion/databases", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setNotionConnected(res.ok);
    } catch {
      setNotionConnected(false);
    }
  }, []);

  // On mount and after disconnect, check Notion connection
  useEffect(() => {
    checkNotionConnection();
    // Show reconnect banner if redirected after disconnect
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("notion_disconnected=1")
    ) {
      setShowReconnectBanner(true);
      // Remove query param from URL for clean UX
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkNotionConnection]);

  // Fetch databases (only if connected)
  useEffect(() => {
    async function fetchDatabases() {
      setLoading(true);
      setError(null);
      if (!notionConnected) {
        setDatabases([]);
        setLoading(false);
        return;
      }
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");
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
    fetchDatabases();
  }, [notionConnected]);

  // Fetch schedules for the user (pagination)
  const fetchSchedules = useCallback(
    async (pageNum: number) => {
      setSchedulesLoading(true);
      setSchedulesError(null);
      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        // Get the latest schedules data - include database filter and sorting
        const dbFilterParam =
          dbFilter !== "all" ? `&dbFilter=${encodeURIComponent(dbFilter)}` : "";
        const sortParam = sortBy.key
          ? `&sortKey=${encodeURIComponent(sortBy.key)}&sortDir=${encodeURIComponent(sortBy.direction)}`
          : "";

        const res = await fetch(
          `/api/schedules?page=${pageNum}&pageSize=${pageSize}${dbFilterParam}${sortParam}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );

        const data = await res.json();
        if (res.ok) {
          setSchedules(data.schedules || []);
          setTotalSchedules(data.total || 0);

          // Handle subscription data if available
          if (data.subscription) {
            setSubscriptionMaxDigests(data.subscription.maxDigests);

            // Check if user is approaching their limit
            const currentCount = data.subscription.currentCount || 0;
            const maxDigests = data.subscription.maxDigests || 3;

            // Set near limit if using 80% or more of available schedules
            setIsNearLimit(
              maxDigests !== -1 && currentCount / maxDigests >= 0.8,
            );
            // Set over limit if above max
            setIsOverLimit(maxDigests !== -1 && currentCount > maxDigests);
          }

          // Clear any existing errors
          setSchedulesError(null);
        } else {
          setSchedulesError(data.error || "Failed to fetch schedules");
        }
      } catch (err) {
        setSchedulesError((err as Error).message);
      } finally {
        setSchedulesLoading(false);
      }
    },
    [pageSize, dbFilter, sortBy.key, sortBy.direction], // pageSize, dbFilter, and sorting affect how we fetch
  );

  // Pagination effect - refetch when page or pageSize changes
  useEffect(() => {
    fetchSchedules(page);
  }, [page, pageSize, fetchSchedules]);

  // Reset on filter change
  useEffect(() => {
    setPage(0);
    setSchedules([]);
    fetchSchedules(0);
  }, [dbFilter, fetchSchedules]);

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
      const res = await fetch(
        "/api/send-digest",
        addCsrfHeaders({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ dbId: previewDb.id, email: recipientEmail }),
        }),
      );
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

  // Create schedule handler
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
      const res = await fetch(
        "/api/schedules",
        addCsrfHeaders({
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
        }),
      );
      if (res.ok) {
        setScheduleSuccess("Schedule created successfully!");
        setScheduleDb(null);
        setScheduleEmail("");
      } else {
        const err = await res.json();
        // If error is about schedule limit, show modal
        if (
          err.error &&
          (err.error.includes("Maximum number of schedules") ||
            err.error.includes("schedule limit"))
        ) {
          setLimitModalMessage(
            "You have reached the maximum number of digests allowed for your subscription tier. Upgrade to unlock more!",
          );
          setShowLimitModal(true);
        } else {
          setScheduleError(err.error || "Failed to create schedule");
        }
      }
    } catch (err) {
      setScheduleError((err as Error).message);
    } finally {
      setScheduleLoading(false);
    }
  }

  // Edit handler
  async function handleEditSave() {
    if (!editSchedule) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No access token found");
      const res = await fetch(
        "/api/schedules",
        addCsrfHeaders({
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: editSchedule.id,
            email: editSchedule.email,
            frequency: editSchedule.frequency,
            time_of_day: editSchedule.time_of_day,
            timezone: editSchedule.timezone,
            start_date: editSchedule.start_date,
            end_date: editSchedule.end_date,
          }),
        }),
      );
      if (res.ok) {
        setEditSuccess("Schedule updated!");
        setEditSchedule(null);
        router.refresh();
      } else {
        const err = await res.json();
        setEditError(err.error || "Failed to update schedule");
      }
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditLoading(false);
    }
  }

  // Helper to get database title from id (always returns string)
  function getDbTitle(dbId: string): string {
    const db = databases.find((d) => d.id === dbId);
    if (!db) return dbId;
    if (typeof db.title === "string") return db.title;
    if (
      Array.isArray(db.title) &&
      db.title.length > 0 &&
      typeof db.title[0].plain_text === "string"
    ) {
      return db.title[0].plain_text;
    }
    return "Untitled Database";
  }

  // Authentication check: set sessionChecked on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setSessionChecked(true);
        router.replace("/login");
        return;
      }
      setSessionChecked(true);
    }
    checkAuth();
  }, [router]);

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

  // With server-side pagination and filtering, we just use the schedules directly
  // Server is already handling sorting, pagination, and filtering
  const filteredSchedules = schedules;
  // We're using server-side pagination, so filtered schedules are already for the current page
  const paginatedSchedules = filteredSchedules;

  // Calculate total pages based on total schedules (not just filtered ones)
  const pageCount = Math.ceil(totalSchedules / pageSize);

  // Multi-select helpers
  const allVisibleIds = paginatedSchedules.map((s) => s.id);
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  function toggleSelectAll() {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(allVisibleIds);
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function clearSelection() {
    setSelectedIds([]);
  }

  // Bulk actions
  async function handleBulkPause() {
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await Promise.all(
        selectedIds.map((id) =>
          fetch(
            "/api/schedules",
            addCsrfHeaders({
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ id, status: "paused" }),
            }),
          ),
        ),
      );

      // Clear selection and refresh schedules table
      clearSelection();
      fetchSchedules(page); // Refresh the table with current data
    } catch {
      // Refresh anyway to show current state
      fetchSchedules(page);
    }
  }
  async function handleBulkResume() {
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const results = await Promise.all(
        selectedIds.map((id) =>
          fetch(
            "/api/schedules",
            addCsrfHeaders({
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ id, status: "active" }),
            }),
          ),
        ),
      );
      let limitError = false;
      for (const res of results) {
        if (!res.ok) {
          const err = await res.json();
          if (
            err.error &&
            (err.error.includes("Maximum number of active schedules") ||
              err.error.includes("schedule limit"))
          ) {
            limitError = true;
          }
        }
      }
      if (limitError) {
        setLimitModalMessage(
          "You are at your schedule limit. Upgrade your plan to resume more digests!",
        );
        setShowLimitModal(true);
      }
      // Clear selection and refresh schedules table
      clearSelection();
      fetchSchedules(page); // Refresh the table with current data
    } catch {
      // Refresh anyway to show current state
      fetchSchedules(page);
    }
  }
  async function handleBulkDelete() {
    if (!window.confirm("Delete all selected schedules?")) return;

    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await Promise.all(
        selectedIds.map((id) =>
          fetch(
            "/api/schedules",
            addCsrfHeaders({
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ id }),
            }),
          ),
        ),
      );

      // Clear selection and refresh schedules table
      clearSelection();
      fetchSchedules(page); // Refresh the table with current data
    } catch {
      // Refresh anyway to show current state
      fetchSchedules(page);
    }
  }

  // Sorting handler
  function handleSort(key: string) {
    setSortBy((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

    // Reset to first page when sorting changes
    setPage(0);
    // Fetch with the new sort criteria will happen via useEffect due to page change
  }

  // Add a handler for subscription upgrade click (redirects to subscription settings)
  function handleUpgradeClick() {
    router.push("/settings/subscription");
  }

  if (!sessionChecked) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </main>
    );
  }

  // The main render must return a single parent element (e.g. <div> or <Fragment>), not a fragment shorthand
  return (
    <div>
      {/* Notion-only sign out button at top when connected */}
      {notionConnected && (
        <div className="flex justify-end mb-2 gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/settings/subscription")}
            className="flex items-center gap-1"
          >
            <span>Subscription</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowNotionSignOutConfirm(true)}
          >
            Sign Out (Notion)
          </Button>
        </div>
      )}

      {/* Subscription banner - show when near limit */}
      {isNearLimit && subscriptionMaxDigests > 0 && (
        <SubscriptionBanner
          tierLimit={true}
          currentCount={totalSchedules}
          maxDigests={subscriptionMaxDigests}
          onUpgrade={handleUpgradeClick}
        />
      )}

      {/* Over-limit warning banner */}
      {isOverLimit && subscriptionMaxDigests > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-900 flex items-center justify-between animate-fade-in">
          <span>
            <b>Over your schedule limit!</b> You have more active digests than
            allowed by your current subscription tier. Excess digests have been
            paused. <br />
            <span className="text-sm">
              Upgrade your plan or delete/disable extra schedules to resume
              sending.
            </span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpgradeClick}
            className="ml-4 bg-red-600 text-white hover:bg-red-700 hover:text-white"
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Reconnect banner */}
      {showReconnectBanner && !notionConnected && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-900 flex items-center justify-between">
          <span>
            Notion disconnected. To resume digests, <b>reconnect Notion</b>{" "}
            below.
          </span>
          <button
            className="ml-4 text-xs underline"
            onClick={() => setShowReconnectBanner(false)}
            aria-label="Dismiss reconnect banner"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Notion Databases section - always visible */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Notion Databases</h2>
        <div className="bg-white rounded-lg shadow p-6 mb-4 border">
          {notionConnected ? (
            <>
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Spinner className="h-4 w-4 text-gray-500 animate-spin" />
                  Loading databases…
                </div>
              )}
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {!loading && databases.length === 0 && !error && (
                <p>
                  No databases found. Make sure you&apos;ve shared at least one
                  database with your Notion integration.
                </p>
              )}
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {databases.map((db) => (
                  <li
                    key={db.id}
                    className="border p-4 rounded shadow-sm cursor-pointer hover:bg-accent transition"
                    aria-label={`Preview ${typeof db.title === "string" ? db.title : "Untitled Database"}`}
                  >
                    <div className="font-semibold text-lg">
                      {typeof db.title === "string"
                        ? db.title
                        : "Untitled Database"}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      ID: {db.id}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handlePreview(db)}>
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // If user is at or over their schedule limit, show upgrade modal and block opening the modal
                          if (
                            subscriptionMaxDigests > 0 &&
                            totalSchedules >= subscriptionMaxDigests
                          ) {
                            setLimitModalMessage(
                              "You have reached the maximum number of digests allowed for your subscription tier. Upgrade to unlock more!",
                            );
                            setShowLimitModal(true);
                            return;
                          }
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="mb-4 text-gray-700 text-center">
                Notion is disconnected. Please reconnect to view your databases.
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  const mod = await import("@/lib/notion-auth-url");
                  window.location.href = mod.getNotionAuthUrl();
                }}
              >
                Connect Notion
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-2">My Scheduled Digests</h3>
        <div className="bg-white rounded-lg shadow p-6 border">
          {/* Database Filter Dropdown */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="db-filter" className="text-sm font-medium mr-2">
                Filter by Database:
              </label>
              <select
                id="db-filter"
                className="border rounded px-3 py-2 text-sm w-full md:w-auto cursor-pointer"
                value={dbFilter}
                onChange={(e) => setDbFilter(e.target.value)}
              >
                <option value="all">All Databases</option>
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {typeof db.title === "string"
                      ? db.title
                      : "Untitled Database"}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchSchedules(page)}
              className="flex items-center justify-center"
              aria-label="Refresh table"
            >
              <ArrowPathIcon className="h-5 w-5 mr-0.5" />
            </Button>
          </div>
          {schedulesLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Spinner className="h-4 w-4 text-gray-500 animate-spin" />
              Loading schedules…
            </div>
          )}
          {schedulesError && <p className="text-red-500">{schedulesError}</p>}
          {!schedulesLoading && paginatedSchedules.length === 0 && (
            <p>No scheduled digests found.</p>
          )}
          {/* Responsive Table with enterprise UI, multi-select, row actions as dropdown, sticky header, pagination */}
          {paginatedSchedules.length > 0 && (
            <div className="relative">
              <table
                id="schedules-table"
                className="min-w-full border text-sm rounded-lg shadow-lg bg-white"
              >
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="h-14 align-middle">
                    <th
                      className="border px-2 py-1 text-left w-8 cursor-pointer"
                      onClick={(e) => {
                        // Only toggle if the click wasn't directly on the checkbox
                        if (e.target === e.currentTarget) {
                          toggleSelectAll();
                        }
                      }}
                    >
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("db_id")}
                    >
                      Database{" "}
                      {sortBy.key === "db_id" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("email")}
                    >
                      Email{" "}
                      {sortBy.key === "email" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("frequency")}
                    >
                      Frequency{" "}
                      {sortBy.key === "frequency" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("time_of_day")}
                    >
                      Time{" "}
                      {sortBy.key === "time_of_day" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("start_date")}
                    >
                      Start{" "}
                      {sortBy.key === "start_date" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("end_date")}
                    >
                      End{" "}
                      {sortBy.key === "end_date" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="border px-2 py-1 text-left cursor-pointer select-none"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortBy.key === "status" &&
                        (sortBy.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchedules.map((s) => (
                    <tr
                      key={s.id}
                      className={`group hover:bg-blue-50 transition border-b ${selectedIds.includes(s.id) ? "bg-blue-100" : ""} ${isOverLimit && s.status === "paused" ? "bg-red-50 border-l-4 border-red-400" : ""}`}
                    >
                      <td
                        className="border px-2 py-1 cursor-pointer"
                        onClick={(e) => {
                          // Only toggle if the click wasn't directly on the checkbox
                          if (e.target === e.currentTarget) {
                            toggleSelect(s.id);
                          }
                        }}
                      >
                        <Checkbox
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          aria-label="Select row"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="border px-2 py-1 font-semibold">
                        {getDbTitle(s.db_id)}
                      </td>
                      <td className="border px-2 py-1">{s.email}</td>
                      <td className="border px-2 py-1">{s.frequency}</td>
                      <td className="border px-2 py-1">
                        {s.time_of_day} {s.timezone}
                      </td>
                      <td className="border px-2 py-1">{s.start_date}</td>
                      <td className="border px-2 py-1">{s.end_date || "-"}</td>
                      <td className="border px-2 py-1">
                        {s.status}
                        {isOverLimit && s.status === "paused" && (
                          <span className="ml-2 text-xs text-red-600 font-semibold">
                            (Paused by system)
                          </span>
                        )}
                      </td>
                      <td
                        className="border px-2 py-1"
                        style={{ overflow: "visible", position: "relative" }}
                      >
                        <div className="flex justify-center">
                          <DropdownMenu
                            trigger={(props) => (
                              <button
                                className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                {...props}
                                disabled={!notionConnected}
                              >
                                <span className="sr-only">Open actions</span>⋮
                              </button>
                            )}
                          >
                            <DropdownMenuItem
                              onClick={async () => {
                                if (!notionConnected) return;
                                setRowActionLoading(s.id);
                                setRowActionSuccess(null);
                                setRowActionError(null);
                                try {
                                  const supabase = getSupabaseBrowser();
                                  const {
                                    data: { session },
                                  } = await supabase.auth.getSession();
                                  if (!session)
                                    throw new Error("No access token found");
                                  const res = await fetch(
                                    "/api/schedules",
                                    addCsrfHeaders({
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session.access_token}`,
                                      },
                                      body: JSON.stringify({
                                        id: s.id,
                                        status:
                                          s.status === "paused"
                                            ? "active"
                                            : "paused",
                                      }),
                                    }),
                                  );
                                  if (res.ok) {
                                    setRowActionSuccess(s.id);
                                    setTimeout(
                                      () => setRowActionSuccess(null),
                                      1200,
                                    );
                                  } else {
                                    const err = await res.json();
                                    // Show upgrade modal if over schedule limit
                                    if (
                                      err.error &&
                                      (err.error.includes(
                                        "Maximum number of active schedules",
                                      ) ||
                                        err.error.includes("schedule limit"))
                                    ) {
                                      setLimitModalMessage(
                                        "You are at your schedule limit. Upgrade your plan to resume more digests!",
                                      );
                                      setShowLimitModal(true);
                                    } else {
                                      setRowActionError(
                                        err.error || "Failed to update",
                                      );
                                      setTimeout(
                                        () => setRowActionError(null),
                                        2000,
                                      );
                                    }
                                  }
                                } catch (err) {
                                  setRowActionError((err as Error).message);
                                  setTimeout(
                                    () => setRowActionError(null),
                                    2000,
                                  );
                                } finally {
                                  setRowActionLoading(null);
                                  fetchSchedules(page); // always refresh after action
                                }
                              }}
                              disabled={
                                !notionConnected || rowActionLoading === s.id
                              }
                            >
                              {rowActionLoading === s.id ? (
                                <span className="flex items-center gap-2">
                                  <svg
                                    className="animate-spin h-4 w-4"
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
                                  Processing…
                                </span>
                              ) : rowActionSuccess === s.id ? (
                                <span className="text-green-600">Success!</span>
                              ) : rowActionError === s.id ? (
                                <span className="text-red-600">Error</span>
                              ) : s.status === "paused" ? (
                                notionConnected ? (
                                  "Resume"
                                ) : (
                                  <span className="text-gray-400">Resume</span>
                                )
                              ) : notionConnected ? (
                                "Pause"
                              ) : (
                                <span className="text-gray-400">Pause</span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                if (!notionConnected) return;
                                if (
                                  !window.confirm(
                                    "Are you sure you want to delete this schedule?",
                                  )
                                )
                                  return;
                                setRowActionLoading(s.id);
                                setRowActionSuccess(null);
                                setRowActionError(null);
                                try {
                                  const supabase = getSupabaseBrowser();
                                  const {
                                    data: { session },
                                  } = await supabase.auth.getSession();
                                  if (!session)
                                    throw new Error("No access token found");
                                  const res = await fetch(
                                    "/api/schedules",
                                    addCsrfHeaders({
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session.access_token}`,
                                      },
                                      body: JSON.stringify({ id: s.id }),
                                    }),
                                  );
                                  if (res.ok) {
                                    setRowActionSuccess(s.id);
                                    setTimeout(
                                      () => setRowActionSuccess(null),
                                      1200,
                                    );
                                  } else {
                                    const err = await res.json();
                                    setRowActionError(
                                      err.error || "Failed to delete",
                                    );
                                    setTimeout(
                                      () => setRowActionError(null),
                                      2000,
                                    );
                                  }
                                } catch (err) {
                                  setRowActionError((err as Error).message);
                                  setTimeout(
                                    () => setRowActionError(null),
                                    2000,
                                  );
                                } finally {
                                  setRowActionLoading(null);
                                  fetchSchedules(page); // always refresh after action
                                }
                              }}
                              disabled={
                                !notionConnected || rowActionLoading === s.id
                              }
                            >
                              {rowActionLoading === s.id ? (
                                <span className="flex items-center gap-2">
                                  <svg
                                    className="animate-spin h-4 w-4"
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
                                  Processing…
                                </span>
                              ) : rowActionSuccess === s.id ? (
                                <span className="text-green-600">Deleted!</span>
                              ) : rowActionError === s.id ? (
                                <span className="text-red-600">Error</span>
                              ) : notionConnected ? (
                                "Delete"
                              ) : (
                                <span className="text-gray-400">Delete</span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (!notionConnected) return;
                                setEditSchedule(s);
                              }}
                              disabled={!notionConnected}
                            >
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination controls */}
              <div className="flex items-center justify-between py-3 px-2 border-t bg-white sticky bottom-0 z-10">
                <div className="text-muted-foreground text-sm">
                  Page {page + 1} of {pageCount} | {totalSchedules} total
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border text-sm cursor-pointer"
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                  >
                    &laquo;
                  </button>
                  <button
                    className="px-2 py-1 rounded border text-sm cursor-pointer"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    &lsaquo;
                  </button>
                  <span className="px-2">{page + 1}</span>
                  <button
                    className="px-2 py-1 rounded border text-sm cursor-pointer"
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    disabled={page >= pageCount - 1}
                  >
                    &rsaquo;
                  </button>
                  <button
                    className="px-2 py-1 rounded border text-sm cursor-pointer"
                    onClick={() => setPage(pageCount - 1)}
                    disabled={page >= pageCount - 1}
                  >
                    &raquo;
                  </button>
                  <select
                    className="ml-2 border rounded px-2 py-1 text-sm cursor-pointer"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                  >
                    {[10, 20, 30, 50].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Bulk action bar - disable Notion-dependent actions if not connected */}
              {selectedIds.length > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border shadow-lg rounded-lg px-6 py-3 flex items-center gap-4 animate-fade-in">
                  <span className="font-medium text-sm">
                    {selectedIds.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkPause}
                    disabled={!notionConnected}
                  >
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkResume}
                    disabled={!notionConnected}
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={handleBulkDelete}
                    disabled={!notionConnected}
                  >
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
                value={recipientEmail || ""}
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
            {/* Removed Close button from modal footer */}
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
                value={scheduleEmail || ""}
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
                className="border rounded px-3 py-2 text-sm cursor-pointer"
                value={scheduleFrequency ?? ""}
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
                value={scheduleTime || ""}
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
                value={scheduleTimezone || ""}
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
                value={scheduleStartDate || ""}
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
                value={scheduleEndDate || ""}
                onChange={(e) => setScheduleEndDate(e.target.value)}
                min={scheduleStartDate || ""}
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
            {/* Removed Close button from modal footer */}
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Edit Schedule Modal */}
      <Dialog open={!!editSchedule} onOpenChange={() => setEditSchedule(null)}>
        <Dialog.Content>
          <div role="dialog" aria-modal="true" aria-label="Edit Schedule">
            <Dialog.Title>Edit Schedule</Dialog.Title>
            {editSchedule && (
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2 text-sm"
                  value={editSchedule.email || ""}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, email: e.target.value })
                  }
                />
                <label className="text-sm font-medium mt-2">Frequency</label>
                <select
                  className="border rounded px-3 py-2 text-sm cursor-pointer"
                  value={editSchedule.frequency ?? ""}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      frequency: e.target.value,
                    })
                  }
                ></select>
                <label className="text-sm font-medium mt-2">Time of Day</label>
                <input
                  type="time"
                  className="border rounded px-3 py-2 text-sm"
                  value={editSchedule.time_of_day || ""}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      time_of_day: e.target.value,
                    })
                  }
                />
                <label className="text-sm font-medium mt-2">Timezone</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 text-sm"
                  value={editSchedule.timezone || ""}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      timezone: e.target.value,
                    })
                  }
                />
                <label className="text-sm font-medium mt-2">Start Date</label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 text-sm"
                  value={editSchedule.start_date || ""}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      start_date: e.target.value,
                    })
                  }
                />
                <label className="text-sm font-medium mt-2">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 text-sm"
                  value={editSchedule.end_date || ""}
                  onChange={(e) =>
                    setEditSchedule({
                      ...editSchedule,
                      end_date: e.target.value,
                    })
                  }
                  min={editSchedule.start_date || ""}
                />
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white text-sm mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  onClick={handleEditSave}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                {editSuccess && (
                  <p className="text-green-600 mt-2">{editSuccess}</p>
                )}
                {editError && <p className="text-red-500 mt-2">{editError}</p>}
              </div>
            )}
            {/* Removed Close button from modal footer */}
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Notion sign out confirmation dialog */}
      {showNotionSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Disconnect Notion?</h3>
            <p className="mb-4 text-gray-700">
              Disconnecting Notion will{" "}
              <span className="font-semibold text-red-600">
                pause all your scheduled digests
              </span>
              .<br />
              You will not receive any more emails until you reconnect.
              <br />
              Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotionSignOutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                onClick={async () => {
                  setShowNotionSignOutConfirm(false);
                  const supabase = getSupabaseBrowser();
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (!session) return;
                  await fetch(
                    "/api/notion/store-token",
                    addCsrfHeaders({
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    }),
                  );
                  setNotionConnected(false); // Instantly update UI
                  setDatabases([]); // Clear Notion-dependent state

                  // Refresh schedules to reflect paused state after disconnect
                  fetchSchedules(0); // Reset to first page and get updated schedules

                  setShowReconnectBanner(true); // Show reconnect banner
                  checkNotionConnection(); // Re-check Notion connection state
                  // Do NOT touch sessionChecked here
                }}
              >
                Disconnect Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade limit modal - new addition */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center border border-blue-200 animate-fade-in">
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                {/* Digestly logo for brand accent */}
                <Image
                  src="/digestly_logo.png"
                  alt="Digestly Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                  priority
                />
              </div>
              <h2 className="text-2xl font-bold text-blue-700 mb-2">
                Upgrade Required
              </h2>
              <p className="text-center text-gray-700 mb-6 text-base">
                {limitModalMessage ||
                  "You are at your schedule limit. Upgrade your plan to resume more digests!"}
              </p>
              <Button
                className="w-full mb-2 py-3 text-base font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
                onClick={handleUpgradeClick}
                size="lg"
              >
                Upgrade Now
              </Button>
              <button
                className="w-full py-3 text-base font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 mt-1 shadow-sm"
                onClick={() => setShowLimitModal(false)}
                autoFocus
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
