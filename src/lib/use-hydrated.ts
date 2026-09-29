"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` en el servidor y en el primer render; `true` una vez hidratado. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
