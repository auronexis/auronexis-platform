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
import { runOperationalAssistantServerAction } from "@/lib/ai/operational/action";
import type {
  IncidentAIActionKey,
  OperationalAIActionKey,
  OperationalChecklistItem,
  OperationalContextSnapshot,
  OperationalEntityType,
  OperationalFieldKey,
  OperationalHistoryEntry,
  OperationalPendingDiff,
  OperationalRelatedItem,
  OperationalRiskAssessment,
  OperationalUndoEntry,
  RiskAIActionKey,
} from "@/lib/ai/operational/types";
import type { AIUsageSummary } from "@/lib/ai/types";

type FieldValues = Record<OperationalFieldKey, string>;

type WorkspaceMeta = {
  clientId: string;
  title: string;
  severity: string;
  status: string;
  assigneeUserId: string | null;
  dueDate: string | null;
  linkedRiskId: string | null;
};

type OperationalAIProviderProps = {
  children: ReactNode;
  entityType: OperationalEntityType;
  entityId?: string;
  aiEnabled: boolean;
  initialUsageSummary: AIUsageSummary;
  initialMeta: WorkspaceMeta;
  initialFieldValues: FieldValues;
};

type OperationalAIContextValue = {
  entityType: OperationalEntityType;
  entityId?: string;
  aiEnabled: boolean;
  usageSummary: AIUsageSummary;
  panelOpen: boolean;
  openPanel: (field?: OperationalFieldKey) => void;
  closePanel: () => void;
  selectedField: OperationalFieldKey | null;
  setSelectedField: (field: OperationalFieldKey | null) => void;
  fieldValues: FieldValues;
  setFieldValue: (field: OperationalFieldKey, value: string) => void;
  updateWorkspaceMeta: (meta: Partial<WorkspaceMeta>) => void;
  workspaceMeta: WorkspaceMeta;
  loading: boolean;
  lastResponse: string | null;
  lastError: string | null;
  lastErrorRetryable: boolean;
  devNotice: string | null;
  history: OperationalHistoryEntry[];
  confidence: { score: number; label: string } | null;
  warnings: Array<{ id: string; message: string }>;
  checklist: OperationalChecklistItem[];
  relatedItems: OperationalRelatedItem[];
  contextSnapshot: OperationalContextSnapshot | null;
  riskAssessment: OperationalRiskAssessment | undefined;
  pendingDiff: OperationalPendingDiff | null;
  undoEntry: OperationalUndoEntry | null;
  averageLatencyMs: number | null;
  runAction: (action: OperationalAIActionKey) => Promise<void>;
  retryLastAction: () => Promise<void>;
  acceptDiff: () => void;
  rejectDiff: () => void;
  undoLastApply: () => void;
  reapplyHistoryEntry: (entry: OperationalHistoryEntry) => void;
  copyHistoryEntry: (entry: OperationalHistoryEntry) => void;
  deleteHistoryEntry: (id: string) => void;
  clearError: () => void;
};

const UNDO_WINDOW_MS = 30_000;
const MAX_HISTORY = 20;

const OperationalAIContextInstance = createContext<OperationalAIContextValue | null>(null);

export function OperationalAIProvider({
  children,
  entityType,
  entityId,
  aiEnabled,
  initialUsageSummary,
  initialMeta,
  initialFieldValues,
}: OperationalAIProviderProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<OperationalFieldKey | null>(null);
  const [fieldValues, setFieldValuesState] = useState<FieldValues>(initialFieldValues);
  const [workspaceMeta, setWorkspaceMetaState] = useState<WorkspaceMeta>(initialMeta);
  const [usageSummary, setUsageSummary] = useState(initialUsageSummary);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorRetryable, setLastErrorRetryable] = useState(false);
  const [devNotice, setDevNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<OperationalHistoryEntry[]>([]);
  const [lastAction, setLastAction] = useState<OperationalAIActionKey | null>(null);
  const [confidence, setConfidence] = useState<{ score: number; label: string } | null>(null);
  const [warnings, setWarnings] = useState<Array<{ id: string; message: string }>>([]);
  const [checklist, setChecklist] = useState<OperationalChecklistItem[]>([]);
  const [relatedItems, setRelatedItems] = useState<OperationalRelatedItem[]>([]);
  const [contextSnapshot, setContextSnapshot] = useState<OperationalContextSnapshot | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<OperationalRiskAssessment | undefined>();
  const [pendingDiff, setPendingDiff] = useState<OperationalPendingDiff | null>(null);
  const [undoEntry, setUndoEntry] = useState<OperationalUndoEntry | null>(null);
  const [latencySamples, setLatencySamples] = useState<number[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const averageLatencyMs = useMemo(() => {
    if (latencySamples.length === 0) return null;
    return Math.round(latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length);
  }, [latencySamples]);

  const openPanel = useCallback((field?: OperationalFieldKey) => {
    if (field) setSelectedField(field);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const setFieldValue = useCallback((field: OperationalFieldKey, value: string) => {
    setFieldValuesState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateWorkspaceMeta = useCallback((meta: Partial<WorkspaceMeta>) => {
    setWorkspaceMetaState((prev) => ({ ...prev, ...meta }));
  }, []);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const scheduleUndo = useCallback(
    (field: OperationalFieldKey, previous: string) => {
      clearUndoTimer();
      const expiresAt = Date.now() + UNDO_WINDOW_MS;
      setUndoEntry({ field, previous, expiresAt });
      undoTimerRef.current = setTimeout(() => {
        setUndoEntry(null);
        undoTimerRef.current = null;
      }, UNDO_WINDOW_MS);
    },
    [clearUndoTimer],
  );

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const applyToFieldInternal = useCallback(
    (field: OperationalFieldKey, content: string, withUndo: boolean) => {
      if (withUndo) {
        scheduleUndo(field, fieldValues[field] ?? "");
      }
      setFieldValuesState((prev) => ({ ...prev, [field]: content }));
    },
    [fieldValues, scheduleUndo],
  );

  const acceptDiff = useCallback(() => {
    if (!pendingDiff) return;
    applyToFieldInternal(pendingDiff.field, pendingDiff.proposed, true);
    setPendingDiff(null);
    setLastResponse(null);
  }, [applyToFieldInternal, pendingDiff]);

  const rejectDiff = useCallback(() => {
    setPendingDiff(null);
  }, []);

  const undoLastApply = useCallback(() => {
    if (!undoEntry || Date.now() > undoEntry.expiresAt) {
      setUndoEntry(null);
      return;
    }
    setFieldValue(undoEntry.field, undoEntry.previous);
    setUndoEntry(null);
    clearUndoTimer();
  }, [clearUndoTimer, setFieldValue, undoEntry]);

  const pushHistory = useCallback((entry: Omit<OperationalHistoryEntry, "id" | "timestamp">) => {
    setHistory((prev) =>
      [{ ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...prev].slice(
        0,
        MAX_HISTORY,
      ),
    );
  }, []);

  const runAction = useCallback(
    async (action: OperationalAIActionKey) => {
      if (!aiEnabled || loading) return;

      setLoading(true);
      setLastResponse("");
      setLastError(null);
      setLastErrorRetryable(false);
      setLastAction(action);
      setPendingDiff(null);
      setRiskAssessment(undefined);

      try {
        const result = await runOperationalAssistantServerAction({
          entityType,
          action,
          entityId,
          clientId: workspaceMeta.clientId,
          title: workspaceMeta.title,
          severity: workspaceMeta.severity,
          status: workspaceMeta.status,
          assigneeUserId: workspaceMeta.assigneeUserId,
          dueDate: workspaceMeta.dueDate,
          linkedRiskId: workspaceMeta.linkedRiskId,
          targetField: selectedField,
          fieldValues: {
            description: fieldValues.description,
            resolution_notes: fieldValues.resolution_notes,
          },
        });

        if (!result.ok) {
          setLastError(result.error);
          setLastErrorRetryable(result.retryable ?? false);
          return;
        }

        setConfidence(result.confidence);
        setWarnings(result.warnings);
        setChecklist(result.checklist);
        setRelatedItems(result.relatedItems);
        setContextSnapshot(result.contextSnapshot);
        setUsageSummary(result.usageSummary);
        setDevNotice(result.devNotice ?? null);
        setRiskAssessment(result.riskAssessment);
        setLatencySamples((prev) => [...prev.slice(-9), result.durationMs]);
        setLastResponse(result.content);

        if (result.targetField) {
          setPendingDiff({
            field: result.targetField,
            current: fieldValues[result.targetField] ?? "",
            proposed: result.content,
          });
        }

        pushHistory({
          action,
          field: result.targetField ?? undefined,
          response: result.content,
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
      }
    },
    [
      aiEnabled,
      entityId,
      entityType,
      fieldValues,
      loading,
      pushHistory,
      selectedField,
      workspaceMeta,
    ],
  );

  const retryLastAction = useCallback(async () => {
    if (lastAction) {
      await runAction(lastAction);
    }
  }, [lastAction, runAction]);

  const reapplyHistoryEntry = useCallback(
    (entry: OperationalHistoryEntry) => {
      if (entry.field) {
        setPendingDiff({
          field: entry.field,
          current: fieldValues[entry.field] ?? "",
          proposed: entry.response,
        });
      } else {
        setLastResponse(entry.response);
        setPendingDiff(null);
      }
    },
    [fieldValues],
  );

  const copyHistoryEntry = useCallback(async (entry: OperationalHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(entry.response);
    } catch {
      // ignore
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
    (): OperationalAIContextValue => ({
      entityType,
      entityId,
      aiEnabled,
      usageSummary,
      panelOpen,
      openPanel,
      closePanel,
      selectedField,
      setSelectedField,
      fieldValues,
      setFieldValue,
      updateWorkspaceMeta,
      workspaceMeta,
      loading,
      lastResponse,
      lastError,
      lastErrorRetryable,
      devNotice,
      history,
      confidence,
      warnings,
      checklist,
      relatedItems,
      contextSnapshot,
      riskAssessment,
      pendingDiff,
      undoEntry,
      averageLatencyMs,
      runAction,
      retryLastAction,
      acceptDiff,
      rejectDiff,
      undoLastApply,
      reapplyHistoryEntry,
      copyHistoryEntry,
      deleteHistoryEntry,
      clearError,
    }),
    [
      acceptDiff,
      aiEnabled,
      averageLatencyMs,
      checklist,
      clearError,
      closePanel,
      confidence,
      contextSnapshot,
      copyHistoryEntry,
      deleteHistoryEntry,
      devNotice,
      entityId,
      entityType,
      fieldValues,
      history,
      lastError,
      lastErrorRetryable,
      lastResponse,
      loading,
      openPanel,
      panelOpen,
      pendingDiff,
      reapplyHistoryEntry,
      rejectDiff,
      relatedItems,
      retryLastAction,
      riskAssessment,
      runAction,
      selectedField,
      undoEntry,
      undoLastApply,
      setFieldValue,
      updateWorkspaceMeta,
      usageSummary,
      warnings,
      workspaceMeta,
    ],
  );

  return (
    <OperationalAIContextInstance.Provider value={value}>
      {children}
    </OperationalAIContextInstance.Provider>
  );
}

export function useOperationalAI(): OperationalAIContextValue {
  const context = useContext(OperationalAIContextInstance);
  if (!context) {
    throw new Error("useOperationalAI must be used within OperationalAIProvider.");
  }
  return context;
}

export function useOptionalOperationalAI(): OperationalAIContextValue | null {
  return useContext(OperationalAIContextInstance);
}

export type { RiskAIActionKey, IncidentAIActionKey, OperationalFieldKey };
