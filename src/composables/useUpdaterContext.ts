// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { computed, inject, provide, ref, type InjectionKey, type Ref } from "vue";
import type { UpdaterStatus } from "#updater";

export type UpdaterContext = {
  isCheckingUpdate: Ref<boolean>;
  onCheckUpdate?: () => Promise<UpdaterStatus> | void;
  onInstallUpdate?: () => Promise<UpdaterStatus> | void;
  updateStatus: Ref<UpdaterStatus>;
};

const UPDATER_CONTEXT_KEY: InjectionKey<UpdaterContext> = Symbol("updater-context");

export function provideUpdaterContext(context: UpdaterContext) {
  provide(UPDATER_CONTEXT_KEY, context);
  return context;
}

export function useUpdaterContext(): UpdaterContext {
  return (
    inject(UPDATER_CONTEXT_KEY, undefined) ?? {
      isCheckingUpdate: ref(false),
      updateStatus: computed<UpdaterStatus>(() => ({ kind: "unavailable" })),
    }
  );
}
