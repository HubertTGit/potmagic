import { useTheme } from './hooks/useTheme'

function App() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">Hello World</h1>
      <p className="text-muted text-lg">Current theme: {theme}</p>
      <button
        onClick={toggle}
        className="px-4 py-2 rounded-lg bg-accent text-accent-fg font-medium hover:opacity-90 transition-opacity"
      >
        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </button>
    </div>
  )
}

export default App
