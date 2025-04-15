// Simplified toast implementation
import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000; // 5 seconds

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

interface State {
  toasts: ToasterToast[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function addToast(toast: ToasterToast) {
  memoryState = {
    ...memoryState,
    toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  };
  listeners.forEach((listener) => listener(memoryState));

  // Auto-dismiss after delay
  setTimeout(() => {
    dismissToast(toast.id);
  }, TOAST_REMOVE_DELAY);
}

function dismissToast(id: string) {
  memoryState = {
    ...memoryState,
    toasts: memoryState.toasts.filter((t) => t.id !== id),
  };
  listeners.forEach((listener) => listener(memoryState));
}

function updateToast(id: string, toast: Partial<ToasterToast>) {
  memoryState = {
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      t.id === id ? { ...t, ...toast } : t
    ),
  };
  listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();

  const newToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) dismissToast(id);
    },
  };

  addToast(newToast);

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<ToasterToast>) => updateToast(id, props),
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  };
}

export { useToast, toast };
