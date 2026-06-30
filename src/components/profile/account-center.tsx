"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Globe2,
  LogOut,
  Palette,
  Shield,
  UserRound,
} from "lucide-react";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import {
  ComingSoonBadge,
  FutureFeaturePlaceholder,
  LocalDeviceBadge,
  ProfileField,
  ProfileReadOnlyValue,
  ProfileSaveFooter,
  ProfileSectionCard,
  ProfileSelect,
} from "@/components/profile/profile-section-card";
import { useUserPreferences } from "@/components/profile/user-preferences-provider";
import { useClientPreference } from "@/lib/profile/use-client-preference";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SignOutPendingSplash } from "@/components/branding/brand-splash";
import { signOut } from "@/lib/auth/actions";
import { updateAccountProfileAction, type ProfileActionState } from "@/lib/profile/actions";
import {
  DATE_FORMAT_OPTIONS,
  detectTimezone,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  type UserPreferences,
} from "@/lib/profile/preferences";
import { USER_ROLE_LABELS } from "@/lib/team/types";
import type { SessionContext } from "@/lib/tenancy/context";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type AccountCenterProps = {
  session: SessionContext;
  permissions: string[];
};

const initialActionState: ProfileActionState = {};

function shallowEqualAccountExtras(
  a: UserPreferences["account"],
  b: UserPreferences["account"],
): boolean {
  return a.displayName === b.displayName && a.phone === b.phone && a.jobTitle === b.jobTitle;
}

function shallowEqualRegional(
  a: UserPreferences["regional"],
  b: UserPreferences["regional"],
): boolean {
  return (
    a.timezone === b.timezone &&
    a.language === b.language &&
    a.dateFormat === b.dateFormat &&
    a.timeFormat === b.timeFormat
  );
}

function shallowEqualAppearance(
  a: UserPreferences["appearance"],
  b: UserPreferences["appearance"],
): boolean {
  return (
    a.theme === b.theme &&
    a.compactMode === b.compactMode &&
    a.reduceAnimations === b.reduceAnimations &&
    a.sidebarCollapsed === b.sidebarCollapsed
  );
}

function shallowEqualNotifications(
  a: UserPreferences["notifications"],
  b: UserPreferences["notifications"],
): boolean {
  return (
    a.email === b.email &&
    a.browser === b.browser &&
    a.weeklyDigest === b.weeklyDigest &&
    a.riskAlerts === b.riskAlerts &&
    a.incidentAlerts === b.incidentAlerts &&
    a.reportCompleted === b.reportCompleted &&
    a.teamInvitations === b.teamInvitations
  );
}

function ThemeOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
        transitionInteractive,
        selected
          ? "border-primary/30 bg-primary/5 text-foreground"
          : "border-border bg-surface text-muted hover:border-border-strong hover:bg-muted/5",
        focusRing,
      )}
    >
      <input
        type="radio"
        name="theme"
        checked={selected}
        onChange={onSelect}
        className="h-4 w-4 border-border text-primary focus:ring-primary/35"
      />
      {label}
    </label>
  );
}

export function AccountCenter({ session, permissions }: AccountCenterProps) {
  const { preferences, persistPreferences } = useUserPreferences();
  const { ready: preferencesReady } = useClientPreference();
  const [actionState, submitAccountAction, isAccountPending] = useActionState(
    updateAccountProfileAction,
    initialActionState,
  );

  const [fullName, setFullName] = useState(session.user.full_name);
  const [accountDraft, setAccountDraft] = useState(preferences.account);
  const [regionalDraft, setRegionalDraft] = useState(preferences.regional);
  const [appearanceDraft, setAppearanceDraft] = useState(preferences.appearance);
  const [notificationsDraft, setNotificationsDraft] = useState(preferences.notifications);

  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [regionalSuccess, setRegionalSuccess] = useState<string | null>(null);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);
  const [notificationsSuccess, setNotificationsSuccess] = useState<string | null>(null);

  useEffect(() => {
    setAccountDraft(preferences.account);
    setRegionalDraft(preferences.regional);
    setAppearanceDraft(preferences.appearance);
    setNotificationsDraft(preferences.notifications);
  }, [preferences]);

  useEffect(() => {
    setFullName(session.user.full_name);
  }, [session.user.full_name]);

  useEffect(() => {
    if (actionState.success) {
      setAccountSuccess(actionState.success);
    }
  }, [actionState.success]);

  const accountDirty =
    fullName.trim() !== session.user.full_name.trim() ||
    !shallowEqualAccountExtras(accountDraft, preferences.account);

  const regionalDirty = !shallowEqualRegional(regionalDraft, preferences.regional);
  const appearanceDirty = !shallowEqualAppearance(appearanceDraft, preferences.appearance);
  const notificationsDirty = !shallowEqualNotifications(notificationsDraft, preferences.notifications);

  const timezoneOptions = useMemo(() => {
    const detected = preferencesReady ? detectTimezone() : "UTC";
    const baseOptions = TIMEZONE_OPTIONS as readonly string[];
    const options = baseOptions.includes(detected) ? [...baseOptions] : [detected, ...baseOptions];
    return options.map((zone) => ({
      value: zone,
      label: preferencesReady && zone === detected ? `${zone} (detected)` : zone,
    }));
  }, [preferencesReady]);

  const resetAccountDraft = useCallback(() => {
    setFullName(session.user.full_name);
    setAccountDraft(preferences.account);
    setAccountSuccess(null);
  }, [preferences.account, session.user.full_name]);

  const saveAccount = useCallback(() => {
    setAccountSuccess(null);

    persistPreferences({
      ...preferences,
      account: accountDraft,
    });

    if (fullName.trim() !== session.user.full_name.trim()) {
      const formData = new FormData();
      formData.set("fullName", fullName.trim());
      submitAccountAction(formData);
      return;
    }

    setAccountSuccess("Preferences saved.");
  }, [
    accountDraft,
    fullName,
    persistPreferences,
    preferences,
    session.user.full_name,
    submitAccountAction,
  ]);

  const saveRegional = useCallback(() => {
    persistPreferences({ ...preferences, regional: regionalDraft });
    setRegionalSuccess("Preferences saved.");
  }, [persistPreferences, preferences, regionalDraft]);

  const saveAppearance = useCallback(() => {
    persistPreferences({ ...preferences, appearance: appearanceDraft });
    setAppearanceSuccess("Preferences saved.");
  }, [appearanceDraft, persistPreferences, preferences]);

  const saveNotifications = useCallback(() => {
    persistPreferences({ ...preferences, notifications: notificationsDraft });
    setNotificationsSuccess("Preferences saved.");
  }, [notificationsDraft, persistPreferences, preferences]);

  const accountStatus = session.user.is_disabled ? "Disabled" : "Active";

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <ProfileSectionCard
        icon={UserRound}
        title="Account"
        description="Your personal identity and contact details for this workspace."
        footer={
          <ProfileSaveFooter
            dirty={accountDirty}
            saving={isAccountPending}
            successMessage={accountSuccess ?? actionState.success ?? null}
            onSave={saveAccount}
            onCancel={resetAccountDraft}
          />
        }
      >
        {actionState.error ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
            {actionState.error}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <ProfileAvatar name={fullName || session.user.full_name} />
          <div>
            <p className="text-sm font-semibold text-foreground">{fullName || session.user.full_name}</p>
            <p className="text-xs text-muted">{session.email}</p>
          </div>
        </div>

        <Input
          name="fullName"
          label="Full name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            setAccountSuccess(null);
          }}
          placeholder="Your full name"
        />

        <Input
          name="displayName"
          label="Display name"
          value={accountDraft.displayName}
          onChange={(event) =>
            setAccountDraft((current) => ({ ...current, displayName: event.target.value }))
          }
          placeholder="Optional — shown in comments and activity"
        />

        <Input
          name="phone"
          label="Phone"
          value={accountDraft.phone}
          onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))}
          placeholder="Optional"
        />

        <ProfileField label="Email" description="Managed by your authentication provider.">
          <ProfileReadOnlyValue value={session.email} />
        </ProfileField>

        <Input
          name="jobTitle"
          label="Job title"
          value={accountDraft.jobTitle}
          onChange={(event) =>
            setAccountDraft((current) => ({ ...current, jobTitle: event.target.value }))
          }
          placeholder="Optional"
        />

        <ProfileField label="Account status">
          <ProfileReadOnlyValue value={accountStatus} />
        </ProfileField>
      </ProfileSectionCard>

      <ProfileSectionCard
        icon={Globe2}
        title="Regional preferences"
        description="Formatting and locale defaults for your personal workspace experience."
        badge={<LocalDeviceBadge />}
        footer={
          <ProfileSaveFooter
            dirty={regionalDirty}
            successMessage={regionalSuccess}
            onSave={saveRegional}
            onCancel={() => {
              setRegionalDraft(preferences.regional);
              setRegionalSuccess(null);
            }}
          />
        }
      >
        <ProfileField
          label="Timezone"
          description="Defaults to your browser timezone. Workspace scheduling uses organization settings."
        >
          <ProfileSelect
            value={regionalDraft.timezone}
            onChange={(value) => setRegionalDraft((current) => ({ ...current, timezone: value }))}
            options={timezoneOptions}
          />
        </ProfileField>

        <ProfileField label="Language" description="Additional languages coming in a future release.">
          <ProfileSelect
            value={regionalDraft.language}
            onChange={(value) => setRegionalDraft((current) => ({ ...current, language: value }))}
            options={LANGUAGE_OPTIONS}
          />
        </ProfileField>

        <ProfileField label="Date format">
          <ProfileSelect
            value={regionalDraft.dateFormat}
            onChange={(value) =>
              setRegionalDraft((current) => ({
                ...current,
                dateFormat: value as UserPreferences["regional"]["dateFormat"],
              }))
            }
            options={DATE_FORMAT_OPTIONS}
          />
        </ProfileField>

        <ProfileField label="Time format">
          <ProfileSelect
            value={regionalDraft.timeFormat}
            onChange={(value) =>
              setRegionalDraft((current) => ({
                ...current,
                timeFormat: value as UserPreferences["regional"]["timeFormat"],
              }))
            }
            options={[
              { value: "24h", label: "24-hour" },
              { value: "12h", label: "12-hour" },
            ]}
          />
        </ProfileField>
      </ProfileSectionCard>

      <ProfileSectionCard
        icon={Palette}
        title="Appearance"
        description="Personalize density, motion, and theme for your command center."
        badge={<LocalDeviceBadge />}
        footer={
          <ProfileSaveFooter
            dirty={appearanceDirty}
            successMessage={appearanceSuccess}
            onSave={saveAppearance}
            onCancel={() => {
              setAppearanceDraft(preferences.appearance);
              setAppearanceSuccess(null);
            }}
          />
        }
      >
        <ProfileField label="Theme" description="Choose how Auroranexis looks on this device.">
          <div className="grid gap-2 sm:grid-cols-3">
            <ThemeOption
              label="Light"
              selected={preferencesReady && appearanceDraft.theme === "light"}
              onSelect={() => setAppearanceDraft((current) => ({ ...current, theme: "light" }))}
            />
            <ThemeOption
              label="Dark"
              selected={preferencesReady && appearanceDraft.theme === "dark"}
              onSelect={() => setAppearanceDraft((current) => ({ ...current, theme: "dark" }))}
            />
            <ThemeOption
              label="System"
              selected={preferencesReady && appearanceDraft.theme === "system"}
              onSelect={() => setAppearanceDraft((current) => ({ ...current, theme: "system" }))}
            />
          </div>
        </ProfileField>

        <div className="space-y-1 rounded-xl border border-border/70 bg-muted/5 p-4">
          <Switch
            label="Compact mode"
            description="Reduce padding and spacing across the interface."
            checked={preferencesReady ? appearanceDraft.compactMode : false}
            onCheckedChange={(checked) =>
              setAppearanceDraft((current) => ({ ...current, compactMode: checked }))
            }
          />
          <Switch
            label="Reduce animations"
            description="Minimize motion for a calmer, more focused experience."
            checked={preferencesReady ? appearanceDraft.reduceAnimations : false}
            onCheckedChange={(checked) =>
              setAppearanceDraft((current) => ({ ...current, reduceAnimations: checked }))
            }
          />
          <Switch
            label="Sidebar collapsed by default"
            description="Start with a compact sidebar showing icons only."
            checked={preferencesReady ? appearanceDraft.sidebarCollapsed : false}
            onCheckedChange={(checked) =>
              setAppearanceDraft((current) => ({ ...current, sidebarCollapsed: checked }))
            }
          />
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        icon={Bell}
        title="Notifications"
        description="Personal alert preferences — separate from workspace-wide notification settings."
        badge={<LocalDeviceBadge />}
        footer={
          <ProfileSaveFooter
            dirty={notificationsDirty}
            successMessage={notificationsSuccess}
            onSave={saveNotifications}
            onCancel={() => {
              setNotificationsDraft(preferences.notifications);
              setNotificationsSuccess(null);
            }}
          />
        }
      >
        <div className="space-y-1 rounded-xl border border-border/70 bg-muted/5 p-4">
          <Switch
            label="Email notifications"
            description="Receive operational alerts in your inbox."
            checked={preferencesReady ? notificationsDraft.email : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, email: checked }))
            }
          />
          <Switch
            label="Browser notifications"
            description="Show desktop alerts when permitted by your browser."
            checked={preferencesReady ? notificationsDraft.browser : false}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, browser: checked }))
            }
          />
          <Switch
            label="Weekly digest"
            description="Summary of activity across your workspace."
            checked={preferencesReady ? notificationsDraft.weeklyDigest : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, weeklyDigest: checked }))
            }
          />
          <Switch
            label="Risk alerts"
            checked={preferencesReady ? notificationsDraft.riskAlerts : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, riskAlerts: checked }))
            }
          />
          <Switch
            label="Incident alerts"
            checked={preferencesReady ? notificationsDraft.incidentAlerts : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, incidentAlerts: checked }))
            }
          />
          <Switch
            label="Report completed"
            checked={preferencesReady ? notificationsDraft.reportCompleted : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, reportCompleted: checked }))
            }
          />
          <Switch
            label="Team invitations"
            checked={preferencesReady ? notificationsDraft.teamInvitations : true}
            onCheckedChange={(checked) =>
              setNotificationsDraft((current) => ({ ...current, teamInvitations: checked }))
            }
          />
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        icon={Building2}
        title="Workspace"
        description="Your organization membership and effective permissions — managed by administrators."
      >
        <ProfileField label="Organization">
          <ProfileReadOnlyValue value={session.organization.name} />
        </ProfileField>
        <ProfileField label="Role">
          <ProfileReadOnlyValue value={USER_ROLE_LABELS[session.role]} />
        </ProfileField>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Permissions summary
          </p>
          <ul className="mt-3 space-y-2">
            {permissions.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard
        icon={Shield}
        title="Security"
        description="Authentication controls and account safety for your personal login."
        className="lg:col-span-2"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Authentication</p>
              <p className="mt-1 text-xs text-muted">Sign-in methods managed outside Auroranexis.</p>
            </div>

            <ProfileField label="Password">
              <ProfileReadOnlyValue value="Managed by authentication provider" />
            </ProfileField>

            <ProfileField label="Two-factor authentication">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/5 px-3 py-2.5">
                <span className="text-sm text-muted">Not configured</span>
                <ComingSoonBadge />
              </div>
            </ProfileField>

            <ProfileField label="Active sessions">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/5 px-3 py-2.5">
                <span className="text-sm text-muted">Session management</span>
                <ComingSoonBadge />
              </div>
            </ProfileField>

            <ProfileField label="Recent sign-in">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/5 px-3 py-2.5">
                <span className="text-sm text-muted">Sign-in history</span>
                <ComingSoonBadge />
              </div>
            </ProfileField>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Future account tools</p>
              <p className="mt-1 text-xs text-muted">Reserved for upcoming account management features.</p>
            </div>

            <FutureFeaturePlaceholder
              title="API tokens"
              description="Create scoped tokens for integrations and automation."
            />
            <FutureFeaturePlaceholder
              title="Connected accounts"
              description="Link external identity providers and productivity tools."
            />
            <FutureFeaturePlaceholder
              title="Audit history"
              description="Review personal account activity and security events."
            />

            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
              <p className="text-sm font-semibold text-foreground">Danger zone</p>
              <p className="mt-1 text-xs text-muted">End your current session on this device.</p>
              <form action={signOut} className="mt-4">
                <SignOutPendingSplash />
                <button
                  type="submit"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-surface px-4 py-2 text-sm font-medium text-danger shadow-xs",
                    transitionInteractive,
                    "hover:border-danger/50 hover:bg-danger/5",
                    focusRing,
                  )}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </ProfileSectionCard>
    </div>
  );
}
