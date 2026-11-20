# 0005. Avisos por fila global

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

O resultado de uma ação (salvo, apagado, sem conexão) precisa de um aviso curto que não suma
quando a tela muda e que não se sobreponha a outro.

## Decisão

Uma fila global (`src/shared/snackbar/snackbar-queue.tsx`) e um `SnackbarHost` montado uma vez na
casca do app:

- a ViewModel pede com `useSnackbar().show({ text, action? })`;
- aparece um aviso por vez, na ordem, e o mesmo texto não se repete;
- aviso com ação pertence a quem pediu e sai quando ele é desmontado, porque a ação depende dele;
- a tela com rodapé fixo informa a altura dele (`useSnackbarBottomInset`), e o aviso sobe;
- o tempo respeita o pedido pela acessibilidade do sistema, e o aviso é anunciado ao leitor de
  tela.

## Consequências

- Erro de campo não é aviso: fica no campo. Aviso é para o resultado da ação.
