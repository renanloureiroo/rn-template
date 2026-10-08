import { createAppDependencies } from "@/bootstrap/app-dependencies"
import { AppShell } from "@/bootstrap/AppShell"
import { AppNavigator } from "@/navigation/AppNavigator"

// Dependências criadas uma vez por processo do app.
const dependencies = createAppDependencies()

export function App() {
  return (
    <AppShell dependencies={dependencies}>
      <AppNavigator />
    </AppShell>
  )
}
