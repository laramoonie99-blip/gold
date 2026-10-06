"use client";
import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type State = { toasts: ToasterToast[] };

const listeners: Array<(s: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastInput = Omit<ToasterToast, "id">;

export function toast(props: ToastInput) {
  const id = genId();
  const newToast: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss(id);
    },
  };
  dispatch({ toasts: [newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT) });
  setTimeout(() => dismiss(id), TOAST_REMOVE_DELAY);
  return id;
}

export function dismiss(id?: string) {
  dispatch({
    toasts: memoryState.toasts.map((t) =>
      t.id === id || id === undefined ? { ...t, open: false } : t
    ),
  });
  setTimeout(() => {
    dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) });
  }, 200);
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { ...state, toast, dismiss };
}
