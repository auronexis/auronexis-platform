"use client";

import { useActionState } from "react";
import { ProfileField } from "@/components/profile/profile-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changeAccountPasswordAction,
  sendAccountPasswordResetAction,
  type ProfileActionState,
} from "@/lib/profile/actions";

type AccountPasswordSectionProps = {
  hasPasswordProvider: boolean;
};

const initialState: ProfileActionState = {};

export function AccountPasswordSection({ hasPasswordProvider }: AccountPasswordSectionProps) {
  const [changeState, changeAction, isChanging] = useActionState(
    changeAccountPasswordAction,
    initialState,
  );
  const [resetState, resetAction, isResetting] = useActionState(
    sendAccountPasswordResetAction,
    initialState,
  );

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-muted/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Password</p>
        <p className="mt-1 text-xs text-muted">
          {hasPasswordProvider
            ? "Update your password while signed in."
            : "Request a password reset link by email."}
        </p>
      </div>

      {hasPasswordProvider ? (
        <>
          {changeState.error ? (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {changeState.error}
            </p>
          ) : null}

          {changeState.success ? (
            <p
              className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"
              role="status"
            >
              {changeState.success}
            </p>
          ) : null}

          <form action={changeAction} className="space-y-3">
            <Input
              name="password"
              type="password"
              label="New password"
              autoComplete="new-password"
              required
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirm new password"
              autoComplete="new-password"
              required
            />
            <Button type="submit" size="sm" loading={isChanging}>
              Change password
            </Button>
          </form>

          <ProfileField
            label="Forgot your current password?"
            description="Send a reset link to your email instead."
          >
            {resetState.error ? (
              <p className="mb-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {resetState.error}
              </p>
            ) : null}
            {resetState.success ? (
              <p
                className="mb-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"
                role="status"
              >
                {resetState.success}
              </p>
            ) : null}
            <form action={resetAction}>
              <Button type="submit" variant="outline" size="sm" loading={isResetting}>
                Send password reset email
              </Button>
            </form>
          </ProfileField>
        </>
      ) : (
        <>
          {resetState.error ? (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {resetState.error}
            </p>
          ) : null}

          {resetState.success ? (
            <p
              className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success"
              role="status"
            >
              {resetState.success}
            </p>
          ) : null}

          <form action={resetAction}>
            <Button type="submit" size="sm" loading={isResetting}>
              Send password reset email
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
