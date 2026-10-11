import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export type ResizableTextareaProps = TextareaProps & {
  autoResize?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, ResizableTextareaProps>(
  ({ autoResize = false, className, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!, []);

    React.useLayoutEffect(() => {
      if (!autoResize || !textareaRef.current) return;
      const textarea = textareaRef.current;
      const resize = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight + 2}px`;
      };

      resize();
      let previousWidth = textarea.getBoundingClientRect().width;
      const observer = new ResizeObserver(() => {
        const width = textarea.getBoundingClientRect().width;
        if (width === previousWidth) return;
        previousWidth = width;
        resize();
      });
      observer.observe(textarea);
      return () => observer.disconnect();
    }, [autoResize, value]);

    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(19,95,99,0.16)] disabled:cursor-not-allowed disabled:opacity-50",
          autoResize && "resize-none overflow-hidden",
          className,
        )}
        ref={textareaRef}
        value={value}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
