---
name: tanstack-form-best-practices
description: Use when building forms with @tanstack/react-form — covers useForm setup, field components, validation timing, async initial values, reactivity with useStore/Subscribe, field listeners for side effects, custom error objects, and SSR patterns.
---

# TanStack Form Best Practices

Apply these patterns when using `@tanstack/react-form`. Install with `pnpm add @tanstack/react-form`.

---

## 1. Basic Setup

```tsx
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: { firstName: '', age: 0 },
  onSubmit: async ({ value }) => {
    console.log(value)
  },
})

return (
  <form
    onSubmit={(e) => {
      e.preventDefault()
      e.stopPropagation()
      void form.handleSubmit()
    }}
  >
    <form.Field name="firstName">
      {(field) => (
        <>
          <input
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
          {!field.state.meta.isValid && (
            <em role="alert">{field.state.meta.errors.join(', ')}</em>
          )}
        </>
      )}
    </form.Field>

    {/* Submit button with reactive canSubmit / isSubmitting */}
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? '...' : 'Submit'}
        </button>
      )}
    </form.Subscribe>
  </form>
)
```

### Key field state properties

| Property | Type | Description |
|---|---|---|
| `field.state.value` | `T` | Current field value |
| `field.state.meta.errors` | `string[]` | All current errors (flattened) |
| `field.state.meta.errorMap` | `Record<event, error>` | Errors by validation timing |
| `field.state.meta.isValid` | `boolean` | No errors present |
| `field.state.meta.isTouched` | `boolean` | Field has been interacted with |
| `field.state.meta.isDirty` | `boolean` | Value differs from default |

---

## 2. Validation

### Timing — choose the right event

| Validator | When it runs |
|---|---|
| `onChange` | Every keystroke |
| `onChangeDebounceMs` | Debounced onChange (e.g. `500`) |
| `onBlur` | Field loses focus |
| `onSubmit` | Form submission |
| `onChangeAsync` / `onBlurAsync` / `onSubmitAsync` | Async variants |

```tsx
// Field-level validators
<form.Field
  name="age"
  validators={{
    onChange: ({ value }) =>
      value < 13 ? 'Must be 13 or older' : undefined,
    onBlur: ({ value }) =>
      value < 0 ? 'Cannot be negative' : undefined,
    onChangeAsync: async ({ value }) => {
      await new Promise((r) => setTimeout(r, 500))
      return value < 13 ? 'Server says: too young' : undefined
    },
    onChangeAsyncDebounceMs: 500,
  }}
>
  {(field) => (
    <>
      <input
        value={field.state.value}
        type="number"
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
      />
      {!field.state.meta.isValid && (
        <em role="alert">{field.state.meta.errors.join(', ')}</em>
      )}
    </>
  )}
</form.Field>
```

### Form-level validators (cross-field or server-side)

```tsx
const form = useForm({
  defaultValues: { age: 0, username: '' },
  validators: {
    onSubmitAsync: async ({ value }) => {
      const [ageOk, usernameAvailable] = await Promise.all([
        verifyAgeOnServer(value.age),
        checkUsernameAvailable(value.username),
      ])
      if (!ageOk || !usernameAvailable) {
        return {
          form: 'Invalid data',           // optional form-level message
          fields: {
            age: 'Must be 13 or older',
            username: 'Username is taken',
          },
        }
      }
      return null
    },
  },
})

// Display form-level error
<form.Subscribe selector={(state) => [state.errorMap]}>
  {([errorMap]) =>
    errorMap.onSubmit ? (
      <em>Form error: {errorMap.onSubmit.toString()}</em>
    ) : null
  }
</form.Subscribe>
```

---

## 3. Async Initial Values

Use TanStack Query to load data, then pass it as `defaultValues`. Show a loading state while data is pending.

```tsx
import { useQuery } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'

function EditProfileForm({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  const form = useForm({
    defaultValues: {
      firstName: data?.firstName ?? '',
      lastName: data?.lastName ?? '',
    },
    onSubmit: async ({ value }) => saveUser(userId, value),
  })

  if (isLoading) return <span className="loading loading-spinner" />

  return (
    <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
      {/* fields */}
    </form>
  )
}
```

> **Note:** `defaultValues` is evaluated once at form creation. If data arrives after mount, the form won't update automatically — render the form only after data is available (guard with `isLoading`).

---

## 4. Reactivity

TanStack Form does **not** auto-rerender on state changes. Subscribe explicitly.

| API | Use when |
|---|---|
| `useStore(form.store, selector)` | Accessing form state in component logic / functions |
| `<form.Subscribe selector={...}>` | Conditional UI rendering (more performant — isolates re-render) |

```tsx
// useStore — for logic
import { useStore } from '@tanstack/react-form'

const firstName = useStore(form.store, (state) => state.values.firstName)
const formErrorMap = useStore(form.store, (state) => state.errorMap)

// form.Subscribe — for UI (preferred for rendering)
<form.Subscribe selector={(state) => state.values.country}>
  {(country) => country === 'US' && <StateField form={form} />}
</form.Subscribe>
```

Always provide a **selector** to avoid subscribing to the entire store and triggering unnecessary re-renders.

---

## 5. Listeners

Use `listeners` for side effects that happen in response to field events (clearing dependent fields, logging, analytics). Not for validation.

```tsx
// Field-level listener
<form.Field
  name="country"
  listeners={{
    onChange: ({ value }) => {
      console.log('Country changed to:', value)
      form.setFieldValue('state', '')
      form.setFieldValue('city', '')
    },
  }}
>
  {(field) => (
    <select
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
    >
      {/* options */}
    </select>
  )}
</form.Field>
```

### Available listener events

| Event | When it fires |
|---|---|
| `onChange` | Value changes |
| `onBlur` | Field loses focus |
| `onMount` | Field mounts |
| `onChangeDebounceMs` | Debounce ms for onChange listener |

Form-level listeners can also be passed to `useForm({ listeners: { onChange, onBlur, onMount, onSubmit } })`.

---

## 6. Custom (Non-String) Errors

Validators can return any value — objects, numbers, React elements. Use this for structured errors (severity, codes, i18n keys).

```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) => {
      if (!value.includes('@')) {
        return { message: 'Invalid email', severity: 'error', code: 1001 }
      }
      return undefined
    },
  }}
>
  {(field) => (
    <>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((error, i) =>
        typeof error === 'object' ? (
          <div key={i} className={`text-${error.severity}`}>
            {error.message} <small>(Code: {error.code})</small>
          </div>
        ) : (
          <em key={i} role="alert">{error}</em>
        )
      )}
    </>
  )}
</form.Field>
```

> TypeScript tip: define an `ErrorShape` union type and use it in your form's generic to get typed `field.state.meta.errors`.

---

## 7. SSR (TanStack Start)

TanStack Form ships an SSR helper to serialize form state from server to client without hydration mismatches.

```tsx
// server function (e.g. in route loader)
import { createServerValidate, initialFormState } from '@tanstack/react-form/start'
import { formOptions } from '@tanstack/react-form'

const opts = formOptions({
  defaultValues: { name: '', age: 0 },
})

const serverValidate = createServerValidate({
  ...opts,
  onServerValidate: ({ value }) => {
    if (value.age < 13) return 'Must be 13 or older'
  },
})

// In a TanStack Start server function (POST handler):
export const handleForm = createServerFn({ method: 'POST' })
  .handler(async ({ request }) => {
    const formData = await request.formData()
    try {
      await serverValidate(formData)
    } catch (e) {
      if (isFormDataError(e)) {
        return e.formState   // send back serialized error state
      }
      throw e
    }
  })

// Client component
import { mergeForm, useTransform } from '@tanstack/react-form'

function MyForm({ state }: { state: typeof initialFormState }) {
  const form = useForm({
    ...opts,
    transform: useTransform((base) => mergeForm(base, state), [state]),
  })

  return <form>{/* fields */}</form>
}
```

### SSR checklist

- Use `formOptions()` to share config between server and client
- Use `createServerValidate` for server-side validation with the same rules
- Use `mergeForm` + `useTransform` on the client to hydrate server state
- Return serialized `formState` from the server action on validation failure

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Forgetting `e.stopPropagation()` in `onSubmit` | Always include — prevents bubbling in nested forms |
| Not calling `field.handleBlur` | Required to trigger `onBlur` validators and `isTouched` |
| Accessing `form.state` directly without a subscription | Use `useStore` or `form.Subscribe` to get reactive updates |
| Rendering form before async data is ready | Guard with `isLoading` — `defaultValues` is set once at creation |
| Using `errors.join(', ')` when errors may be objects | Check `typeof error === 'object'` before rendering |
