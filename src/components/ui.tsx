"use client";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle, Info, Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ---- Button --------------------------------------------------------------------------
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors disabled:opacity-55 disabled:cursor-not-allowed select-none whitespace-nowrap";
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[15px]", lg: "h-13 px-6 text-base" }[size];
  const variants = {
    primary: "bg-leaf text-white hover:bg-leaf-2 dark:text-[#06140f]",
    accent: "bg-turmeric text-[#2b1d00] hover:brightness-105",
    outline: "border border-line bg-surface text-ink hover:bg-surface-2",
    ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
    danger: "bg-due text-white hover:brightness-110 dark:text-[#1d0a0e]",
    soft: "bg-leaf-soft text-leaf hover:brightness-95",
  }[variant];
  return (
    <button ref={ref} className={cx(base, sizes, variants, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ---- Form fields ---------------------------------------------------------------------
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-due" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/25 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(inputCls, "h-11", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx(inputCls, "py-2.5 min-h-20", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx(inputCls, "h-11 pr-8 appearance-none bg-[length:16px] bg-no-repeat bg-[right_10px_center]", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237b8a84' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
});

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" className={cx("inline-flex rounded-xl bg-surface-2 p-1 gap-1", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-lg font-semibold transition-colors",
            size === "sm" ? "px-2.5 py-1 text-sm" : "px-3.5 py-1.5 text-[15px]",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 50,
  disabled,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label: string;
}) {
  const { fmt } = useI18n();
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface" role="group" aria-label={label}>
      <button
        type="button"
        className="grid size-10 place-items-center text-ink-2 hover:text-ink disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`${label} −`}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center font-display text-lg font-semibold tabular" aria-live="polite">
        {fmt.int(value)}
      </span>
      <button
        type="button"
        className="grid size-10 place-items-center text-ink-2 hover:text-ink disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`${label} +`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

// ---- Surfaces --------------------------------------------------------------------------
export function Panel({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={cx("rounded-2xl border border-line bg-surface", className)}>{children}</As>;
}

export function PageHeader({ title, body, actions }: { title: ReactNode; body?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-display text-[28px] leading-tight font-bold text-ink sm:text-[32px]">{title}</h1>
        {body ? <p className="mt-1.5 text-ink-2">{body}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "leaf" | "turmeric" | "due" | "plus"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    leaf: "bg-leaf-soft text-leaf",
    turmeric: "bg-turmeric-soft text-turmeric-ink",
    due: "bg-due-soft text-due",
    plus: "bg-plus-soft text-plus",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold", tones, className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const { t } = useI18n();
  const tone = status === "APPROVED" ? "plus" : status === "PENDING" ? "turmeric" : "due";
  return <Badge tone={tone}>{t.status[status]}</Badge>;
}

export function Money({ value, sign, className }: { value: number; sign?: boolean; className?: string }) {
  const { fmt } = useI18n();
  const tone = !sign || Math.abs(value) < 0.005 ? "" : value < 0 ? "text-due" : "text-plus";
  return <span className={cx("tabular", tone, className)}>{fmt.money(value, { sign })}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("size-5 animate-spin text-ink-3", className)} aria-hidden />;
}

export function Loading() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 py-16 justify-center text-ink-3" role="status">
      <Spinner /> {t.common.loading}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const err = error as { code?: string; message?: string };
  const msg = (err?.code && t.errors[err.code]) || err?.message || t.errors.SERVER_ERROR;
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-due/30 bg-due-soft p-4 text-due">
      <p className="flex items-center gap-2 font-semibold">
        <AlertCircle className="size-5" /> {msg}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t.common.retry}
        </Button>
      ) : null}
    </div>
  );
}

export function Empty({ icon, title, action }: { icon?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-3">{icon}</div> : null}
      <p className="max-w-sm text-ink-2">{title}</p>
      {action}
    </div>
  );
}

// ---- Modal (bottom sheet on phones) -------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const tm = setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>("[data-autofocus],input,select,textarea") ?? ref.current;
      target?.focus();
    }, 30);
    return () => {
      clearTimeout(tm);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const width = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" }[size];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0a1210]/55" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={cx(
          "sheet-in relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <h2 id={`${id}-t`} className="font-display text-xl font-bold text-ink">
              {title}
            </h2>
            {description ? <p className="mt-1 text-[15px] text-ink-2">{description}</p> : null}
          </div>
          <button onClick={onClose} className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={t.common.close}>
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

// ---- Toasts + confirm --------------------------------------------------------------------
type Toast = { id: number; text: string; kind: "ok" | "error" | "info" };
type ConfirmOpts = { title: ReactNode; body?: ReactNode; confirmText?: string; danger?: boolean };

const FeedbackContext = createContext<{
  toast: (text: string, kind?: Toast["kind"]) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
} | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const { t } = useI18n();

  const toast = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((xs) => [...xs.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);
  const done = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {toasts.map((x) => (
          <div
            key={x.id}
            className={cx(
              "sheet-in pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl px-4 py-3 text-[15px] font-medium shadow-xl",
              x.kind === "error" ? "bg-due text-white dark:text-[#1d0a0e]" : "bg-ink text-paper",
            )}
            role={x.kind === "error" ? "alert" : "status"}
          >
            {x.kind === "ok" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-turmeric" /> : x.kind === "error" ? <AlertCircle className="mt-0.5 size-5 shrink-0" /> : <Info className="mt-0.5 size-5 shrink-0" />}
            {x.text}
          </div>
        ))}
      </div>
      <Modal
        open={!!pending}
        onClose={() => done(false)}
        title={pending?.title}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => done(false)}>
              {t.common.cancel}
            </Button>
            <Button variant={pending?.danger ? "danger" : "primary"} onClick={() => done(true)} data-autofocus>
              {pending?.confirmText || t.common.confirm}
            </Button>
          </>
        }
      >
        {pending?.body ? <div className="text-ink-2">{pending.body}</div> : null}
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const c = useContext(FeedbackContext);
  if (!c) throw new Error("useFeedback outside provider");
  return c;
}
