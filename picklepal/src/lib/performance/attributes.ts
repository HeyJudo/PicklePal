export type SpanPrimitive = string | number | boolean;

export type SafeSpanAttributes = Readonly<Record<string, SpanPrimitive>>;

const ALLOWED_ATTRIBUTE_KEYS = new Set([
  "route",
  "stage",
  "cache.domain",
  "cache.hit",
  "db.table",
  "result.count",
  "viewer.kind",
  "runtime.region",
]);

export function safeSpanAttributes(
  attributes: Readonly<Record<string, unknown>>,
): SafeSpanAttributes {
  return Object.entries(attributes).reduce<Record<string, SpanPrimitive>>(
    (safeAttributes, [key, value]) => {
      if (!ALLOWED_ATTRIBUTE_KEYS.has(key) || !isSpanPrimitive(value)) {
        return safeAttributes;
      }

      return { ...safeAttributes, [key]: value };
    },
    {},
  );
}

function isSpanPrimitive(value: unknown): value is SpanPrimitive {
  return (
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  );
}
