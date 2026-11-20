import { useState } from "react"
import { StyleSheet, Text, TextInput } from "react-native"
import { fireEvent, render, screen } from "@testing-library/react-native"

import { TwoPane, type TwoPaneProps } from "@/shared/components/TwoPane"
import { useWidthClass } from "@/shared/layout/use-width-class"
import { createTestQueryClient, TestProviders } from "@test/support/test-providers"

function layout(width: number, height = 800) {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height } } }
}

function Probe({ name }: { name: string }) {
  const { widthClass, inPane } = useWidthClass()
  return <Text>{`${name}: ${widthClass}${inPane ? " no painel" : ""}`}</Text>
}

function Draft() {
  const [value, setValue] = useState("")
  return <TextInput testID="draft" value={value} onChangeText={setValue} />
}

async function renderTwoPane(width: number, props: Partial<TwoPaneProps> = {}) {
  await render(
    <TestProviders queryClient={createTestQueryClient()}>
      <TwoPane
        testID="two-pane"
        start={<Probe name="lista" />}
        end={<Probe name="detalhe" />}
        {...props}
      />
    </TestProviders>,
  )
  await fireEvent(screen.getByTestId("two-pane"), "layout", layout(width))
}

describe("TwoPane", () => {
  it("mostra só o painel de início fora da classe expandida", async () => {
    await renderTwoPane(390)

    const end = screen.getByTestId("two-pane-end", { includeHiddenElements: true })
    expect(StyleSheet.flatten(end.props.style)).toMatchObject({ display: "none" })
    expect(screen.queryByText("detalhe: compact")).toBeNull()
    expect(StyleSheet.flatten(screen.getByTestId("two-pane").props.style)).toMatchObject({
      flexDirection: "column",
    })
  })

  it("põe os painéis lado a lado na classe expandida, na proporção lista e detalhe", async () => {
    await renderTwoPane(1024)

    expect(StyleSheet.flatten(screen.getByTestId("two-pane").props.style)).toMatchObject({
      flexDirection: "row",
    })
    expect(StyleSheet.flatten(screen.getByTestId("two-pane-start").props.style)).toMatchObject({
      flex: 2,
    })
    expect(StyleSheet.flatten(screen.getByTestId("two-pane-end").props.style)).toMatchObject({
      flex: 3,
    })
  })

  it("cada painel publica a própria classe, medida pela largura dele", async () => {
    await renderTwoPane(1024)

    await fireEvent(screen.getByTestId("two-pane-start"), "layout", layout(400))
    await fireEvent(screen.getByTestId("two-pane-end"), "layout", layout(620))

    expect(screen.getByText("lista: compact no painel")).toBeOnTheScreen()
    expect(screen.getByText("detalhe: medium no painel")).toBeOnTheScreen()
  })

  it("mostra o estado vazio no secundário sem item aberto", async () => {
    await renderTwoPane(1024, { end: undefined, empty: <Text>Escolha uma nota</Text> })

    expect(screen.getByText("Escolha uma nota")).toBeOnTheScreen()
  })

  it("empilha os dois painéis fora da expandida quando pedido", async () => {
    await renderTwoPane(390, { collapsed: "stacked" })

    expect(screen.getByText("lista: compact")).toBeOnTheScreen()
    expect(screen.getByText("detalhe: compact")).toBeOnTheScreen()
  })

  it("não perde o que foi digitado ao girar entre as classes", async () => {
    await renderTwoPane(1024, { end: <Draft /> })
    await fireEvent.changeText(screen.getByTestId("draft"), "rascunho")

    await fireEvent(screen.getByTestId("two-pane"), "layout", layout(390))
    await fireEvent(screen.getByTestId("two-pane"), "layout", layout(1024))

    expect(screen.getByTestId("draft").props.value).toBe("rascunho")
  })
})
