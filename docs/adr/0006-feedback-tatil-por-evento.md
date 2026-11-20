# 0006. Feedback tátil por evento

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Vibração escolhida por componente fica inconsistente entre telas e entre sistemas: o mesmo gesto
vibra de um jeito no iOS e de outro no Android.

## Decisão

O código pede o **evento**, não o efeito: `haptics().play("selection" | "longPress" | "impact" |
"warning" | "error")`. `ExpoHaptics` traduz para o gerador do UIKit no iOS e para o motor de toque
do sistema no Android, que respeita a configuração do aparelho. Nunca falha: sem motor, não faz
nada.

O contrato é ligado na composição (`provideHaptics`), e o teste liga um gravador
(`RecordingHaptics`) para afirmar o evento.

## Consequências

- Um evento novo entra no tipo `HapticEvent` e nas duas tabelas de plataforma.
