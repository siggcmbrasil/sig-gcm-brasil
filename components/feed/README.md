# Integração operacional com o Feed SIG

Arquivos:

- `components/feed/PublicarNoFeedButton.tsx`
- `components/feed/exemplos-integracao.tsx`

O botão publica resumos diretamente no Feed SIG ou no Feed Brasil.

Fluxo:

1. O módulo conclui a ação operacional.
2. O usuário clica em **Publicar no Feed SIG**.
3. A publicação mantém:
   - município;
   - usuário;
   - módulo de origem;
   - registro de origem;
   - auditoria;
   - opção de compartilhamento nacional.

Importe assim:

```tsx
import PublicarNoFeedButton from "@/components/feed/PublicarNoFeedButton";
```
