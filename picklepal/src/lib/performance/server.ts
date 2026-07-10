import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry";
import { safeSpanAttributes } from "./attributes";

interface ServerOperationOptions {
  readonly name: string;
  readonly op: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export async function traceServerOperation<T>(
  options: ServerOperationOptions,
  operation: () => Promise<T>,
): Promise<T> {
  if (!isSentryEnabled()) {
    return operation();
  }

  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op,
      attributes: safeSpanAttributes({
        ...options.attributes,
        "runtime.region": process.env.VERCEL_REGION ?? "local",
      }),
    },
    operation,
  );
}
