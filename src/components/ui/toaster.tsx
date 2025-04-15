"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(({ id, title, description, action, onOpenChange, variant, ...props }) => (
          <Toast
            key={id}
            title={title}
            description={description}
            action={action}
            onOpenChange={onOpenChange}
            variant={variant}
            {...props}
          />
        ))}
      </ToastViewport>
    </ToastProvider>
  )
}
