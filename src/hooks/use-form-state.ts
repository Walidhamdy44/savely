"use client";

import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { $ZodType } from "zod/v4/core";

/** Options for configuring the form state hook. */
interface UseFormStateOptions<T extends FieldValues> {
  /** Zod schema used for validation. */
  schema: $ZodType<T, FieldValues>;
  /** Optional default values for the form fields. */
  defaultValues?: DefaultValues<T>;
}

/** Return value of the useFormState hook. */
interface UseFormStateReturn<T extends FieldValues> {
  /** The underlying react-hook-form form object. */
  form: UseFormReturn<T>;
  /** Whether any field value differs from its default. */
  isDirty: boolean;
  /** Whether the form is currently being submitted. */
  isSubmitting: boolean;
  /** Map of field names to their current validation error messages. */
  errors: Partial<Record<Path<T>, string>>;
}

/**
 * Wraps React Hook Form with Zod validation, dirty tracking,
 * and submission state. Provides a simplified interface for
 * forms that need schema-based validation.
 *
 * @param options - Zod schema and optional default values
 * @returns Form object, dirty flag, submitting flag, and error map
 *
 * **Validates: Requirements 3.9, 7.3**
 */
export function useFormState<T extends FieldValues>(
  options: UseFormStateOptions<T>,
): UseFormStateReturn<T> {
  const { schema, defaultValues } = options;

  // zodResolver generic inference requires a cast when the
  // schema type parameter is itself generic. The cast is safe
  // because the resolver validates against the same Zod schema.
  const resolver = zodResolver(schema) as Resolver<T>;

  const form = useForm<T>({
    resolver,
    defaultValues,
    mode: "onBlur",
  });

  const { isDirty, isSubmitting, errors: fieldErrors } = form.formState;

  const errors = Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, err]) => err?.message)
      .map(([key, err]) => [key, (err as { message?: string }).message]),
  ) as Partial<Record<Path<T>, string>>;

  return { form, isDirty, isSubmitting, errors };
}
