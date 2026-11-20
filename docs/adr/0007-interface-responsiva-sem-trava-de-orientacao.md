# 0007. Interface responsiva sem trava de orientação

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Travar o app em retrato deixa tablet, telefone deitado e tela dividida com uma coluna estreita no
meio de muito espaço vazio, e as lojas pedem suporte a telas grandes.

## Decisão

- `orientation: default`: o app nunca trava a orientação.
- O layout decide pela **classe de largura do contêiner**, nunca da janela: `compact` (até 599
  pt), `medium` (600 a 839) e `expanded` (840 ou mais), os limites das classes de janela do
  Material 3, em `theme.breakpoints`.
- `useWidthClass()` dá a classe e a margem lateral; `TwoPane` põe lista e detalhe lado a lado na
  expandida, e cada painel mede a própria largura.
- O item aberto vive na rota, para girar o aparelho não perder a seleção.

## Consequências

- Toda tela é conferida em pé, deitada, no tablet e com fonte grande.
