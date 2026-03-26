---
name: react-best-practices
description: Use when writing or reviewing React components in this project — enforces function components over class components, and Context API over prop drilling
---

# React Best Practices

## Overview
Modern React uses function components with hooks. Pass data broadly via Context — not through chains of props.

---

## Rule 1: Always Use Function Components

**Never** use class components.

```tsx
// ❌ Never
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// ✅ Always
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

Use hooks for state and side effects:

| Class lifecycle       | Function equivalent     |
|-----------------------|-------------------------|
| `this.state`          | `useState`              |
| `componentDidMount`   | `useEffect(() => {}, [])` |
| `componentDidUpdate`  | `useEffect(() => {}, [dep])` |
| `componentWillUnmount`| `useEffect(() => () => cleanup, [])` |

---

## Rule 2: Avoid Prop Drilling — Use Context

**Prop drilling** = passing props through 3+ layers to reach a deeply nested component.

```
App → Layout → Sidebar → UserAvatar → UserName   ❌ (user passed 4 levels)
App (UserContext.Provider) → UserName (useUser()) ✅
```

### When to use what

| Depth / Scope        | Solution                  |
|----------------------|---------------------------|
| 1–2 levels           | Props are fine            |
| 3+ levels            | React Context             |
| Complex global state | Context + useReducer      |

### Context Pattern

**1. Create the context** (`src/contexts/UserContext.tsx`):

```tsx
import { createContext, useContext, useState } from 'react';

type User = { name: string; email: string };

const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>({ name: 'Alice', email: 'alice@example.com' });
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): User {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
```

**2. Wrap your tree** (`main.tsx` or top-level layout):

```tsx
<UserProvider>
  <App />
</UserProvider>
```

**3. Consume anywhere** (no prop threading needed):

```tsx
function UserAvatar() {
  const user = useUser();
  return <img alt={user.name} />;
}
```

---

## Common Mistakes

| Mistake                                  | Fix                                          |
|------------------------------------------|----------------------------------------------|
| Using class components                   | Convert to function + hooks                  |
| Passing the same prop 3+ levels deep     | Lift to Context                              |
| Missing default / null guard in context  | Throw in custom hook if context is null      |
| One giant context for everything         | Split into focused contexts (User, Theme, …) |
| Calling `useContext` outside a Provider  | Ensure Provider wraps the consuming tree     |
