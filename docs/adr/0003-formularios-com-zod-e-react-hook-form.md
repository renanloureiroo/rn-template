# 0003. Formulários com zod e React Hook Form

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Formulário com `useState` por campo repete validação, foco no primeiro erro, estado de enviado e
tradução de mensagem em cada tela, e a regra do campo acaba duplicada entre a tela e o modelo.

## Decisão

- A regra é um schema do zod no `model/` da feature, e a mensagem de cada regra é o `code` do erro.
- O estado do formulário é do React Hook Form, atrás de `src/shared/forms` (`useSchemaForm`,
  `useFormField`): a ViewModel cria o formulário e a View liga cada campo, sem importar as
  bibliotecas.
- O texto do erro vem de `errorMessageOfCode`: o mapa da tela, senão a tradução `errors:<code>`.
- O mesmo schema valida fora de formulário (`parseWith`) e a resposta de um serviço
  (`parseResponse`).

Uso em [FORMS.md](../FORMS.md).

## Alternativas consideradas

- **zod e React Hook Form atrás de um contrato próprio (escolhida):** bibliotecas maduras, uma
  regra só, e a troca de biblioteca fica num arquivo.
- **Formik ou TanStack Form:** equivalentes; o React Hook Form renderiza menos.
- **Estado à mão:** é o problema que motivou a decisão.

## Consequências

- O `code` do schema é contrato com as traduções: uma regra nova precisa da tradução.
