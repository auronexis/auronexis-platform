"use client";



import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import type { PlanKey } from "@/lib/billing/plans";

import { computeDashboardStats } from "@/lib/automation/builder";

import type {

  AutomationDashboardStats,

  AutomationStore,

  WorkflowDefinition,

  WorkflowExecutionRecord,

  WorkflowVersionSnapshot,

} from "@/lib/automation/builder/types";

import {

  clearAutomationStore,

  hasLocalAutomationDrafts,

  loadAutomationStore as loadLegacyAutomationStore,

} from "@/lib/automation/builder/storage";

import { createEmptyStore } from "@/lib/automation/builder/suggestions";

import { formatAutomationUsage, getAutomationLimitForPlan } from "@/lib/automation/builder/limits";

import {

  deleteWorkflowAction,

  loadAutomationStoreAction,

  migrateLocalStorageAction,
  getMigrationStatusAction,
  recordSimulationAction,

  restoreWorkflowVersionAction,

  saveWorkflowAction,

  setWorkflowStatusAction,

} from "@/lib/automation/storage/actions";

import { AutomationMigrationPrompt } from "@/components/automation/automation-migration-prompt";



type AutomationStoreContextValue = {

  store: AutomationStore;

  stats: AutomationDashboardStats;

  usageLabel: string;

  limit: number | null;

  isLoading: boolean;

  saveWorkflow: (

    workflow: WorkflowDefinition,

  ) => Promise<{ ok: true } | { ok: false; error: string }>;

  deleteWorkflow: (id: string) => Promise<void>;

  setWorkflowStatus: (

    id: string,

    status: WorkflowDefinition["status"],

  ) => Promise<void>;

  restoreVersion: (

    workflowId: string,

    version: number,

  ) => Promise<WorkflowDefinition | null>;

  recordSimulation: (

    workflow: WorkflowDefinition,

    triggeredBy: string,

  ) => Promise<WorkflowExecutionRecord>;

  getVersions: (workflowId: string) => WorkflowVersionSnapshot[];

  refresh: () => Promise<void>;

};



const AutomationStoreContext = createContext<AutomationStoreContextValue | null>(null);



type AutomationStoreProviderProps = {

  children: ReactNode;

  organizationId: string;

  planKey: PlanKey;

};



export function AutomationStoreProvider({

  children,

  organizationId,

  planKey,

}: AutomationStoreProviderProps) {

  const [store, setStore] = useState<AutomationStore>(createEmptyStore);

  const [isLoading, setIsLoading] = useState(true);

  const [migrationOffer, setMigrationOffer] = useState<AutomationStore | null>(null);



  const refresh = useCallback(async () => {

    setIsLoading(true);

    const result = await loadAutomationStoreAction();

    if (result.ok) {

      setStore(result.data);

    }

    setIsLoading(false);

  }, []);



  useEffect(() => {

    void refresh();

  }, [organizationId, refresh]);



  useEffect(() => {
    if (isLoading) return;

    void getMigrationStatusAction().then((result) => {
      if (result.ok && result.data.localStorageMigratedAt) {
        return;
      }
      if (hasLocalAutomationDrafts(organizationId)) {
        setMigrationOffer(loadLegacyAutomationStore(organizationId));
      }
    });
  }, [isLoading, organizationId]);



  const limit = getAutomationLimitForPlan(planKey);

  const stats = useMemo(() => computeDashboardStats(store), [store]);

  const usageLabel = formatAutomationUsage(

    store.automations.filter((a) => a.status !== "disabled").length,

    limit,

  );



  const saveWorkflow = useCallback(

    async (workflow: WorkflowDefinition): Promise<{ ok: true } | { ok: false; error: string }> => {

      const previous = store;

      const existing = store.automations.find((item) => item.id === workflow.id);

      const nextAutomations = existing

        ? store.automations.map((item) => (item.id === workflow.id ? workflow : item))

        : [...store.automations, workflow];



      const nextVersions = {

        ...store.versions,

        [workflow.id]: [

          {

            version: workflow.version,

            savedAt: new Date().toISOString(),

            workflow: structuredClone(workflow),

            label: `v${workflow.version}`,

          },

          ...(store.versions[workflow.id] ?? []),

        ].slice(0, 10),

      };



      setStore({

        ...store,

        automations: nextAutomations,

        versions: nextVersions,

      });



      const result = await saveWorkflowAction(workflow);

      if (!result.ok) {

        setStore(previous);

        return result;

      }



      await refresh();

      return { ok: true };

    },

    [refresh, store],

  );



  const deleteWorkflow = useCallback(

    async (id: string) => {

      const previous = store;

      setStore({

        ...store,

        automations: store.automations.filter((item) => item.id !== id),

      });



      const result = await deleteWorkflowAction(id);

      if (!result.ok) {

        setStore(previous);

        throw new Error(result.error);

      }



      await refresh();

    },

    [refresh, store],

  );



  const setWorkflowStatus = useCallback(

    async (id: string, status: WorkflowDefinition["status"]) => {

      const previous = store;

      setStore({

        ...store,

        automations: store.automations.map((item) =>

          item.id === id

            ? { ...item, status, updatedAt: new Date().toISOString() }

            : item,

        ),

      });



      const result = await setWorkflowStatusAction(id, status);

      if (!result.ok) {

        setStore(previous);

        throw new Error(result.error);

      }



      await refresh();

    },

    [refresh, store],

  );



  const restoreVersion = useCallback(

    async (workflowId: string, version: number): Promise<WorkflowDefinition | null> => {

      const result = await restoreWorkflowVersionAction(workflowId, version);

      if (!result.ok) {

        throw new Error(result.error);

      }



      if (!result.data) return null;

      await refresh();

      return result.data;

    },

    [refresh],

  );



  const recordSimulation = useCallback(

    async (workflow: WorkflowDefinition, triggeredBy: string): Promise<WorkflowExecutionRecord> => {

      const result = await recordSimulationAction(workflow, triggeredBy);

      if (!result.ok) {

        throw new Error(result.error);

      }



      setStore((current) => ({

        ...current,

        executions: [result.data, ...current.executions].slice(0, 100),

      }));



      return result.data;

    },

    [],

  );



  const getVersions = useCallback(

    (workflowId: string) => store.versions[workflowId] ?? [],

    [store.versions],

  );



  const handleMigration = useCallback(async () => {

    if (!migrationOffer) return;

    const result = await migrateLocalStorageAction(migrationOffer);

    if (!result.ok) {

      throw new Error(result.error);

    }

    clearAutomationStore(organizationId);

    setMigrationOffer(null);

    await refresh();

  }, [migrationOffer, organizationId, refresh]);



  const handleDismissMigration = useCallback(() => {

    setMigrationOffer(null);

  }, []);



  const value = useMemo(

    (): AutomationStoreContextValue => ({

      store,

      stats,

      usageLabel,

      limit,

      isLoading,

      saveWorkflow,

      deleteWorkflow,

      setWorkflowStatus,

      restoreVersion,

      recordSimulation,

      getVersions,

      refresh,

    }),

    [

      deleteWorkflow,

      getVersions,

      isLoading,

      limit,

      recordSimulation,

      refresh,

      restoreVersion,

      saveWorkflow,

      setWorkflowStatus,

      stats,

      store,

      usageLabel,

    ],

  );



  return (

    <AutomationStoreContext.Provider value={value}>

      {migrationOffer ? (

        <AutomationMigrationPrompt

          workflowCount={migrationOffer.automations.length}

          executionCount={migrationOffer.executions.length}

          onMigrate={handleMigration}

          onDismiss={handleDismissMigration}

        />

      ) : null}

      {children}

    </AutomationStoreContext.Provider>

  );

}



export function useAutomationStore(): AutomationStoreContextValue {

  const context = useContext(AutomationStoreContext);

  if (!context) {

    throw new Error("useAutomationStore must be used within AutomationStoreProvider.");

  }

  return context;

}


