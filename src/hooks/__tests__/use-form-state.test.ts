import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import { z } from "zod";
import { useFormState } from "../use-form-state";

/**
 * Feature: clean-architecture-refactor, Property 5: useFormState validation and dirty tracking consistency
 *
 * For any Zod schema and set of form field values, the useFormState hook's
 * isDirty flag SHALL be false when all fields equal their default values
 * and true when any field differs. The errors object SHALL contain exactly
 * the fields that fail Zod validation for the given input.
 *
 * **Validates: Requirements 3.9, 7.3**
 */

const testSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

type TestForm = z.infer<typeof testSchema>;

const defaultValues: TestForm = {
  name: "Alice",
  email: "alice@example.com",
};

describe("useFormState - Property Tests", () => {
  it("Property 5: isDirty is false at initial state with default values", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.constant("test@example.com"),
        (name, email) => {
          const defaults: TestForm = { name, email };
          const { result } = renderHook(() =>
            useFormState({ schema: testSchema, defaultValues: defaults }),
          );

          // Form should start not dirty when using default values
          expect(result.current.isDirty).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 5: isDirty becomes true when any field differs from default", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (newName) => {
        // Ensure the new name differs from the default
        fc.pre(newName !== defaultValues.name);

        const { result } = renderHook(() =>
          useFormState({ schema: testSchema, defaultValues }),
        );

        // Initially not dirty
        expect(result.current.isDirty).toBe(false);

        // Change a field to a different value
        act(() => {
          result.current.form.setValue("name", newName, {
            shouldDirty: true,
          });
        });

        expect(result.current.isDirty).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("Property 5: isDirty returns to false when field is reset to default", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (newName) => {
        fc.pre(newName !== defaultValues.name);

        const { result } = renderHook(() =>
          useFormState({ schema: testSchema, defaultValues }),
        );

        // Change a field
        act(() => {
          result.current.form.setValue("name", newName, {
            shouldDirty: true,
          });
        });
        expect(result.current.isDirty).toBe(true);

        // Reset the form back to defaults
        act(() => {
          result.current.form.reset(defaultValues);
        });
        expect(result.current.isDirty).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("Property 5: errors contain exactly the fields that fail Zod validation for invalid input", async () => {
    // Use a fixed invalid input to test validation errors
    const { result } = renderHook(() =>
      useFormState({
        schema: testSchema,
        defaultValues: { name: "", email: "not-an-email" },
      }),
    );

    // Trigger validation on all fields
    let isValid: boolean = true;
    await act(async () => {
      isValid = await result.current.form.trigger();
    });

    expect(isValid).toBe(false);

    const errorKeys = Object.keys(result.current.errors);
    // Both name (empty, min 1) and email (invalid format) should have errors
    expect(errorKeys).toContain("name");
    expect(errorKeys).toContain("email");
    expect(errorKeys.length).toBe(2);
  });

  it("Property 5: errors are empty when all fields pass Zod validation", async () => {
    const { result } = renderHook(() =>
      useFormState({
        schema: testSchema,
        defaultValues,
      }),
    );

    // Trigger validation — defaults are valid
    let isValid: boolean = false;
    await act(async () => {
      isValid = await result.current.form.trigger();
    });

    expect(isValid).toBe(true);
    expect(Object.keys(result.current.errors).length).toBe(0);
  });

  it("Property 5: errors reflect exactly the invalid fields for generated inputs", async () => {
    // Generate pairs of (name, email) where we know which should fail
    // Valid name: non-empty string; Valid email: contains @ and .
    const validName = fc.string({ minLength: 1, maxLength: 30 });
    const invalidEmail = fc
      .string({ minLength: 0, maxLength: 20 })
      .filter((s) => !s.includes("@") || !s.includes("."));

    // Test: valid name + invalid email → only email has error
    await fc.assert(
      fc.asyncProperty(validName, invalidEmail, async (name, email) => {
        const { result } = renderHook(() =>
          useFormState({
            schema: testSchema,
            defaultValues: { name, email },
          }),
        );

        await act(async () => {
          await result.current.form.trigger();
        });

        const errorKeys = Object.keys(result.current.errors);
        // name is valid (non-empty), so no name error
        expect(errorKeys).not.toContain("name");
        // email is invalid, so email error should be present
        expect(errorKeys).toContain("email");
      }),
      { numRuns: 100 },
    );
  });

  it("Property 5: changing email field also tracks dirty state", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (newEmail) => {
        fc.pre(newEmail !== defaultValues.email);

        const { result } = renderHook(() =>
          useFormState({ schema: testSchema, defaultValues }),
        );

        expect(result.current.isDirty).toBe(false);

        act(() => {
          result.current.form.setValue("email", newEmail, {
            shouldDirty: true,
          });
        });

        expect(result.current.isDirty).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
