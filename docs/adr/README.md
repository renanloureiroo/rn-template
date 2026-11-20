# Registros de decisão de arquitetura (ADRs)

Um ADR registra uma decisão de arquitetura com custo duradouro: o contexto em que ela foi tomada,
as alternativas descartadas e as consequências aceitas. O [ARCHITECTURE.md](../ARCHITECTURE.md)
diz como o app é; os ADRs dizem por que ele ficou assim.

## Quando escrever

Um ADR é necessário quando a decisão:

- é cara de desfazer (autenticação, sincronização offline, estratégia de builds e lojas, troca de
  uma biblioteca central como TanStack Query ou Zustand);
- tinha alternativas razoáveis que alguém vai propor de novo;
- muda uma regra de [ARCHITECTURE.md](../ARCHITECTURE.md) ou [TESTS.md](../TESTS.md);
- resolve uma das decisões ainda abertas listadas no fim de [ARCHITECTURE.md](../ARCHITECTURE.md).

Não precisam de ADR escolhas locais e reversíveis dentro de um pull request, convenções de nome
ou atualização de versão de dependência.

## Como escrever

1. Copie [`0000-template.md`](0000-template.md) para `NNNN-titulo-curto.md`, com o próximo número
   livre em quatro dígitos e o título em `kebab-case` (`0001-guardar-token-no-secure-store.md`).
2. Preencha com status **Proposto** e abra o pull request com o ADR e a mudança que ele justifica.
3. No merge, mude o status para **Aceito**, acrescente a linha no índice abaixo e atualize
   [ARCHITECTURE.md](../ARCHITECTURE.md) se a decisão mudar uma regra.

Um ADR aceito não é reescrito. Quando a decisão muda, um ADR novo explica o porquê e referencia o
anterior; no antigo, só o status muda para **Substituído por NNNN**.

## Status

| Status               | Significado                                                           |
| -------------------- | --------------------------------------------------------------------- |
| Proposto             | em discussão no pull request                                          |
| Aceito               | vale para o código atual                                              |
| Rejeitado            | discutido e descartado; fica registrado para não voltar sem fato novo |
| Substituído por NNNN | outra decisão tomou o lugar desta                                     |
| Descontinuado        | deixou de valer sem substituta                                        |

## Índice

| ADR                                                          | Título                                       | Status |
| ------------------------------------------------------------ | -------------------------------------------- | ------ |
| [0001](0001-ambientes-de-desenvolvimento-e-producao.md)      | Ambientes de desenvolvimento e produção      | Aceito |
| [0002](0002-entrega-pelo-fastlane-com-build-local-do-eas.md) | Entrega pelo fastlane com build local do EAS | Aceito |
| [0003](0003-formularios-com-zod-e-react-hook-form.md)        | Formulários com zod e React Hook Form        | Aceito |
| [0004](0004-http-client-como-contrato-e-renovacao-no-401.md) | HttpClient como contrato e renovação no 401  | Aceito |
| [0005](0005-avisos-por-fila-global.md)                       | Avisos por fila global                       | Aceito |
| [0006](0006-feedback-tatil-por-evento.md)                    | Feedback tátil por evento                    | Aceito |
| [0007](0007-interface-responsiva-sem-trava-de-orientacao.md) | Interface responsiva sem trava de orientação | Aceito |
| [0008](0008-mudancas-otimistas-por-padrao.md)                | Mudanças otimistas por padrão                | Aceito |
| [0009](0009-abertura-so-com-a-splash-nativa.md)              | Abertura só com a splash nativa              | Aceito |
