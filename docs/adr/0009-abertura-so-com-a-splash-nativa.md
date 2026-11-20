# 0009. Abertura só com a splash nativa

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Uma tela de carregamento em JavaScript depois da splash nativa pisca: são duas aberturas. E um
campo com foco automático sobe o teclado por cima da splash.

## Decisão

A splash nativa fica na frente até fontes e traduções estarem prontas, e sai uma vez, sem tela de
carregamento em JavaScript. Ao sair, `launchReveal.reveal()` avisa o app: `useLaunchRevealed()`
diz a um campo com foco automático que ele já pode focar.

## Consequências

- Trabalho lento na abertura (rede) não segura a splash: a tela abre com o cache e revalida.
