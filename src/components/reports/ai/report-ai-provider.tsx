"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  runEntireReportServerAction,
  runReportAssistantServerAction,
} from "@/lib/ai/report-assistant-action";
import { buildReportChecklist } from "@/lib/ai/copilot/suggestions";
import { ENTIRE_REPORT_SECTIONS } from "@/lib/ai/copilot/sections";
import { contextToFieldValues } from "@/lib/ai/copilot/sections";
import type {
  AIChecklistItem,
  AIConfidenceScore,
  AIHistoryEntry,
  AISmartSuggestion,
  AIUsageSummary,
  AIWarning,
  EntireReportDraft,
  EntireReportProgress,
  PendingDiff,
  ReportAIActionKey,
  ReportAIContext,
  ReportAIContextSnapshot,
  ReportAISectionKey,
  ReportAIStyleMode,
  UndoEntry,
} from "@/lib/ai/types";
import { REPORT_AI_SECTION_LABELS } from "@/lib/ai/types";

type FieldValues = Record<ReportAISectionKey, string>;

type WorkspaceMeta = {
  clientId: string;
  reportTitle: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
};

type ReportAIProviderProps = {
  children: ReactNode;
  baseContext: ReportAIContext;
  aiEnabled: boolean;
  initialUsageSummary: AIUsageSummary;
};

type ReportAIContextValue = {
  aiEnabled: boolean;
  baseContext: ReportAIContext;
  usageSummary: AIUsageSummary;
  styleMode: ReportAIStyleMode;
  setStyleMode: (mode: ReportAIStyleMode) => void;
  panelOpen: boolean;
  openPanel: (section?: ReportAISectionKey) => void;
  closePanel: () => void;
  selectedSection: ReportAISectionKey | null;
  setSelectedSection: (section: ReportAISectionKey | null) => void;
  fieldValues: FieldValues;
  setFieldValue: (section: ReportAISectionKey, value: string) => void;
  setFieldValues: (values: Partial<FieldValues>) => void;
  updateWorkspaceMeta: (meta: Partial<WorkspaceMeta>) => void;
  loading: boolean;
  streaming: boolean;
  lastResponse: string | null;
  lastError: string | null;
  lastErrorRetryable: boolean;
  devNotice: string | null;
  history: AIHistoryEntry[];
  confidence: AIConfidenceScore | null;
  warnings: AIWarning[];
  suggestions: AISmartSuggestion[];
  contextSnapshot: ReportAIContextSnapshot | null;
  checklist: AIChecklistItem[];
  pendingDiff: PendingDiff | null;
  undoEntry: UndoEntry | null;
  entireReportDraft: EntireReportDraft | null;
  entireReportProgress: EntireReportProgress;
  averageLatencyMs: number | null;
  runAction: (action: ReportAIActionKey) => Promise<void>;
  runEntireReport: () => Promise<void>;
  retryLastAction: () => Promise<void>;
  acceptDiff: () => void;
  rejectDiff: () => void;
  undoLastApply: () => void;
  applyEntireReportSection: (section: ReportAISectionKey) => void;
  applyEntireReportAll: () => void;
  discardEntireReport: () => void;
  previewEntireReportSection: (section: ReportAISectionKey) => void;
  reapplyHistoryEntry: (entry: AIHistoryEntry) => void;
  copyHistoryEntry: (entry: AIHistoryEntry) => void;
  deleteHistoryEntry: (id: string) => void;
  clearError: () => void;
};

const UNDO_WINDOW_MS = 30_000;
const MAX_HISTORY = 20;

const ReportAIContextInstance = createContext<ReportAIContextValue | null>(null);

export function ReportAIProvider({
  children,
  baseContext,
  aiEnabled,
  initialUsageSummary,
}: ReportAIProviderProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ReportAISectionKey | null>(null);
  const [styleMode, setStyleMode] = useState<ReportAIStyleMode>("executive");
  const [fieldValues, setFieldValuesState] = useState<FieldValues>(() =>
    contextToFieldValues(baseContext),
  );
  const [workspaceMeta, setWorkspaceMetaState] = useState<WorkspaceMeta>(() => ({
    clientId: baseContext.clientId,
    reportTitle: baseContext.reportTitle,
    reportingPeriodStart: baseContext.reportingPeriodStart,
    reportingPeriodEnd: baseContext.reportingPeriodEnd,
  }));
  const [usageSummary, setUsageSummary] = useState(initialUsageSummary);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorRetryable, setLastErrorRetryable] = useState(false);
  const [devNotice, setDevNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<AIHistoryEntry[]>([]);
  const [lastAction, setLastAction] = useState<ReportAIActionKey | null>(null);
  const [confidence, setConfidence] = useState<AIConfidenceScore | null>(null);
  const [warnings, setWarnings] = useState<AIWarning[]>([]);
  const [suggestions, setSuggestions] = useState<AISmartSuggestion[]>([]);
  const [contextSnapshot, setContextSnapshot] = useState<ReportAIContextSnapshot | null>(null);
  const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const [entireReportDraft, setEntireReportDraft] = useState<EntireReportDraft | null>(null);
  const [entireReportProgress, setEntireReportProgress] = useState<EntireReportProgress>({
    active: false,
    currentStep: 0,
    totalSteps: ENTIRE_REPORT_SECTIONS.length,
    currentLabel: "",
    complete: false,
  });
  const [latencySamples, setLatencySamples] = useState<number[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const averageLatencyMs = useMemo(() => {
    if (latencySamples.length === 0) return null;
    return Math.round(latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length);
  }, [latencySamples]);

  const checklist = useMemo(
    () => buildReportChecklist(fieldValues, workspaceMeta),
    [fieldValues, workspaceMeta],
  );

  const openPanel = useCallback((section?: ReportAISectionKey) => {
    if (section) {
      setSelectedSection(section);
    }
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const setFieldValue = useCallback((section: ReportAISectionKey, value: string) => {
    setFieldValuesState((prev) => {
      if (prev[section] === value) {
        return prev;
      }

      return { ...prev, [section]: value };
    });
  }, []);

  const setFieldValues = useCallback((values: Partial<FieldValues>) => {
    setFieldValuesState((prev) => {
      const next = { ...prev, ...values };
      if (
        prev.executive_summary === next.executive_summary &&
        prev.key_wins === next.key_wins &&
        prev.key_risks === next.key_risks &&
        prev.next_actions === next.next_actions
      ) {
        return prev;
      }

      return next;
    });
  }, []);

  const updateWorkspaceMeta = useCallback((meta: Partial<WorkspaceMeta>) => {
    setWorkspaceMetaState((prev) => {
      const next = { ...prev, ...meta };
      if (
        prev.clientId === next.clientId &&
        prev.reportTitle === next.reportTitle &&
        prev.reportingPeriodStart === next.reportingPeriodStart &&
        prev.reportingPeriodEnd === next.reportingPeriodEnd
      ) {
        return prev;
      }

      return next;
    });
  }, []);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const scheduleUndo = useCallback(
    (section: ReportAISectionKey, previous: string) => {
      clearUndoTimer();
      const expiresAt = Date.now() + UNDO_WINDOW_MS;
      setUndoEntry({ section, previous, expiresAt });
      undoTimerRef.current = setTimeout(() => {
        setUndoEntry(null);
        undoTimerRef.current = null;
      }, UNDO_WINDOW_MS);
    },
    [clearUndoTimer],
  );

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const applyToSectionInternal = useCallback(
    (section: ReportAISectionKey, content: string, withUndo: boolean) => {
      if (withUndo) {
        scheduleUndo(section, fieldValues[section] ?? "");
      }
      setFieldValuesState((prev) => {
        if (prev[section] === content) {
          return prev;
        }

        return { ...prev, [section]: content };
      });
    },
    [fieldValues, scheduleUndo],
  );

  const acceptDiff = useCallback(() => {
    if (!pendingDiff) return;
    applyToSectionInternal(pendingDiff.section, pendingDiff.proposed, true);
    setPendingDiff(null);
    setLastResponse(null);
  }, [applyToSectionInternal, pendingDiff]);

  const rejectDiff = useCallback(() => {
    setPendingDiff(null);
  }, []);

  const undoLastApply = useCallback(() => {
    if (!undoEntry || Date.now() > undoEntry.expiresAt) {
      setUndoEntry(null);
      return;
    }
    setFieldValue(undoEntry.section, undoEntry.previous);
    setUndoEntry(null);
    clearUndoTimer();
  }, [clearUndoTimer, setFieldValue, undoEntry]);

  const pushHistory = useCallback(
    (entry: Omit<AIHistoryEntry, "id" | "timestamp">) => {
      setHistory((prev) =>
        [{ ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...prev].slice(
          0,
          MAX_HISTORY,
        ),
      );
    },
    [],
  );

  const applyRunMeta = useCallback(
    (result: {
      confidence: AIConfidenceScore;
      warnings: AIWarning[];
      suggestions: AISmartSuggestion[];
      contextSnapshot: ReportAIContextSnapshot;
      usageSummary: AIUsageSummary;
      durationMs: number;
      devNotice?: string;
      providerId: string;
      model: string;
      isPlaceholder: boolean;
      tokenUsage?: {
        inputTokens: number | null;
        outputTokens: number | null;
        totalTokens: number | null;
      };
    }) => {
      setConfidence(result.confidence);
      setWarnings(result.warnings);
      setSuggestions(result.suggestions);
      setContextSnapshot(result.contextSnapshot);
      setUsageSummary(result.usageSummary);
      setDevNotice(result.devNotice ?? null);
      setLatencySamples((prev) => [...prev.slice(-9), result.durationMs]);
      return result;
    },
    [],
  );

  const runAction = useCallback(
    async (action: ReportAIActionKey) => {
      if (!aiEnabled || loading) return;

      setLoading(true);
      setStreaming(true);
      setLastResponse("");
      setLastError(null);
      setLastErrorRetryable(false);
      setLastAction(action);
      setPendingDiff(null);

      try {
        const result = await runReportAssistantServerAction({
          action,
          section: selectedSection,
          reportId: baseContext.reportId,
          clientId: workspaceMeta.clientId,
          reportTitle: workspaceMeta.reportTitle,
          reportingPeriodStart: workspaceMeta.reportingPeriodStart,
          reportingPeriodEnd: workspaceMeta.reportingPeriodEnd,
          fieldValues,
          styleMode,
        });

        if (!result.ok) {
          setLastError(result.error);
          setLastErrorRetryable(result.retryable ?? false);
          return;
        }

        applyRunMeta(result);
        setLastResponse(result.content);

        const targetSection = result.section ?? selectedSection;
        if (targetSection) {
          setPendingDiff({
            section: targetSection,
            current: fieldValues[targetSection] ?? "",
            proposed: result.content,
          });
        }

        pushHistory({
          action,
          section: targetSection ?? undefined,
          response: result.content,
          isPlaceholder: result.isPlaceholder,
          provider: result.providerId,
          model: result.model,
          inputTokens: result.tokenUsage?.inputTokens,
          outputTokens: result.tokenUsage?.outputTokens,
          durationMs: result.durationMs,
        });
      } catch {
        setLastError("Unable to generate content right now. Please try again.");
        setLastErrorRetryable(true);
      } finally {
        setLoading(false);
        setStreaming(false);
      }
    },
    [
      aiEnabled,
      applyRunMeta,
      baseContext.reportId,
      fieldValues,
      loading,
      pushHistory,
      selectedSection,
      styleMode,
      workspaceMeta,
    ],
  );

  const runEntireReport = useCallback(async () => {
    if (!aiEnabled || loading) return;

    setLoading(true);
    setStreaming(true);
    setLastError(null);
    setLastErrorRetryable(false);
    setLastAction("generate_entire_report");
    setEntireReportDraft(null);
    setPendingDiff(null);
    setEntireReportProgress({
      active: true,
      currentStep: 0,
      totalSteps: ENTIRE_REPORT_SECTIONS.length,
      currentLabel: REPORT_AI_SECTION_LABELS.executive_summary,
      complete: false,
    });

    try {
      const result = await runEntireReportServerAction({
        reportId: baseContext.reportId,
        clientId: workspaceMeta.clientId,
        reportTitle: workspaceMeta.reportTitle,
        reportingPeriodStart: workspaceMeta.reportingPeriodStart,
        reportingPeriodEnd: workspaceMeta.reportingPeriodEnd,
        fieldValues,
        styleMode,
      });

      if (!result.ok) {
        setLastError(result.error);
        setLastErrorRetryable(result.retryable ?? false);
        setEntireReportProgress((prev) => ({ ...prev, active: false }));
        return;
      }

      applyRunMeta(result);

      const draft: EntireReportDraft = {};
      for (const sectionResult of result.sections) {
        if (sectionResult.content) {
          draft[sectionResult.section] = sectionResult.content;
        }
      }

      setEntireReportDraft(draft);
      setEntireReportProgress({
        active: false,
        currentStep: ENTIRE_REPORT_SECTIONS.length,
        totalSteps: ENTIRE_REPORT_SECTIONS.length,
        currentLabel: "Complete",
        complete: true,
      });

      pushHistory({
        action: "generate_entire_report",
        response: result.sections.map((section) => section.content).join("\n\n"),
        isPlaceholder: result.isPlaceholder,
        provider: result.providerId,
        model: result.model,
        durationMs: result.durationMs,
      });
    } catch {
      setLastError("Unable to generate the full report right now. Please try again.");
      setLastErrorRetryable(true);
      setEntireReportProgress((prev) => ({ ...prev, active: false }));
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }, [
    aiEnabled,
    applyRunMeta,
    baseContext.reportId,
    fieldValues,
    loading,
    pushHistory,
    styleMode,
    workspaceMeta,
  ]);

  const retryLastAction = useCallback(async () => {
    if (lastAction === "generate_entire_report") {
      await runEntireReport();
    } else if (lastAction) {
      await runAction(lastAction);
    }
  }, [lastAction, runAction, runEntireReport]);

  const previewEntireReportSection = useCallback(
    (section: ReportAISectionKey) => {
      const proposed = entireReportDraft?.[section];
      if (!proposed) return;
      setPendingDiff({
        section,
        current: fieldValues[section] ?? "",
        proposed,
      });
    },
    [entireReportDraft, fieldValues],
  );

  const applyEntireReportSection = useCallback(
    (section: ReportAISectionKey) => {
      const content = entireReportDraft?.[section];
      if (!content) return;
      applyToSectionInternal(section, content, true);
      setPendingDiff(null);
    },
    [applyToSectionInternal, entireReportDraft],
  );

  const applyEntireReportAll = useCallback(() => {
    if (!entireReportDraft) return;
    for (const section of ENTIRE_REPORT_SECTIONS) {
      const content = entireReportDraft[section];
      if (content) {
        applyToSectionInternal(section, content, false);
      }
    }
    scheduleUndo(ENTIRE_REPORT_SECTIONS[0], fieldValues[ENTIRE_REPORT_SECTIONS[0]] ?? "");
    setEntireReportDraft(null);
    setEntireReportProgress({
      active: false,
      currentStep: 0,
      totalSteps: ENTIRE_REPORT_SECTIONS.length,
      currentLabel: "",
      complete: false,
    });
  }, [applyToSectionInternal, entireReportDraft, fieldValues, scheduleUndo]);

  const discardEntireReport = useCallback(() => {
    setEntireReportDraft(null);
    setEntireReportProgress({
      active: false,
      currentStep: 0,
      totalSteps: ENTIRE_REPORT_SECTIONS.length,
      currentLabel: "",
      complete: false,
    });
  }, []);

  const reapplyHistoryEntry = useCallback(
    (entry: AIHistoryEntry) => {
      if (entry.section) {
        setPendingDiff({
          section: entry.section,
          current: fieldValues[entry.section] ?? "",
          proposed: entry.response,
        });
      } else {
        setLastResponse(entry.response);
      }
    },
    [fieldValues],
  );

  const copyHistoryEntry = useCallback(async (entry: AIHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.response);
    } catch {
      // Clipboard may be unavailable — ignore silently.
    }
  }, []);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
    setLastErrorRetryable(false);
  }, []);

  const value = useMemo(
    (): ReportAIContextValue => ({
      aiEnabled,
      baseContext,
      usageSummary,
      styleMode,
      setStyleMode,
      panelOpen,
      openPanel,
      closePanel,
      selectedSection,
      setSelectedSection,
      fieldValues,
      setFieldValue,
      setFieldValues,
      updateWorkspaceMeta,
      loading,
      streaming,
      lastResponse,
      lastError,
      lastErrorRetryable,
      devNotice,
      history,
      confidence,
      warnings,
      suggestions,
      contextSnapshot,
      checklist,
      pendingDiff,
      undoEntry,
      entireReportDraft,
      entireReportProgress,
      averageLatencyMs,
      runAction,
      runEntireReport,
      retryLastAction,
      acceptDiff,
      rejectDiff,
      undoLastApply,
      applyEntireReportSection,
      applyEntireReportAll,
      discardEntireReport,
      previewEntireReportSection,
      reapplyHistoryEntry,
      copyHistoryEntry,
      deleteHistoryEntry,
      clearError,
    }),
    [
      aiEnabled,
      acceptDiff,
      applyEntireReportAll,
      applyEntireReportSection,
      averageLatencyMs,
      baseContext,
      checklist,
      clearError,
      closePanel,
      confidence,
      contextSnapshot,
      copyHistoryEntry,
      deleteHistoryEntry,
      devNotice,
      discardEntireReport,
      entireReportDraft,
      entireReportProgress,
      fieldValues,
      history,
      lastError,
      lastErrorRetryable,
      lastResponse,
      loading,
      openPanel,
      panelOpen,
      pendingDiff,
      previewEntireReportSection,
      reapplyHistoryEntry,
      rejectDiff,
      retryLastAction,
      runAction,
      runEntireReport,
      selectedSection,
      setFieldValue,
      setFieldValues,
      setStyleMode,
      streaming,
      styleMode,
      suggestions,
      undoEntry,
      undoLastApply,
      updateWorkspaceMeta,
      usageSummary,
      warnings,
    ],
  );

  return (
    <ReportAIContextInstance.Provider value={value}>{children}</ReportAIContextInstance.Provider>
  );
}

export function useReportAI(): ReportAIContextValue {
  const context = useContext(ReportAIContextInstance);

  if (!context) {
    throw new Error("useReportAI must be used within ReportAIProvider.");
  }

  return context;
}

export function useOptionalReportAI(): ReportAIContextValue | null {
  return useContext(ReportAIContextInstance);
}
