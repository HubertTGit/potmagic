import bearPng from './assets/bear.png'
import crocodilePng from './assets/crocodile.png'
import { StageComponent } from './components/stage.component'

function App() {
  return <StageComponent images={[bearPng, crocodilePng]} />
}

export default App
