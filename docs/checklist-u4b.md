# Checklist U4b · Avaliação de `VT.workers` em Compress / Converter / Metadata (evidence-gated)

Diretiva §1: *"Não implemente integração apenas para dizer que foi feita. Cada adoção precisa trazer
benefício real e passar pelos testes."* Esta unidade **mede primeiro** e só integra onde há benefício
comprovado. Resultado honesto: **nenhuma das três ganha integração** — o worker não elimina bloqueio
inexistente. Nenhuma linha de código das apps mudou; esta evidência é o entregável.

## Estado de partida (grep)

- `VT.workers.process` é usado **só** por `image-resize.js` (linha 200, `transfer=null` p/ cópia, `.catch`
  → caminho síncrono idêntico). Resize escala (drawImage caro por pixel) → tem bloqueio real a remover;
  por isso a integração de U4 foi justificada.
- Compress/Converter/Metadata **não** chamam o worker (confirmado por grep em `js/apps/*.js`).
- O worker só sabe **rasterizar + codificar** canvas (`OffscreenCanvas.drawImage` + `convertToBlob`). Não
  faz parsing de bytes.

## Medições (navegador real, `http://localhost:8735`, Chrome)

Imagem sintética pesada 3200×2400 (≈7,7 MP), codificação JPEG q=0.8. Observador `PerformanceObserver`
de **`longtask`** para medir bloqueio do thread principal.

| Cenário | Parede (wall) | Long tasks no thread principal | Notas |
|---|---|---|---|
| drawImage 1:1 síncrono (único trabalho bloqueante de Compress/Converter antes da codificação) | **0 ms** | 0 | blit sem escala é barato |
| `canvas.toBlob` (caminho atual, main-thread) a 1600×1200 | 49 ms | **0** | a codificação já roda fora do render thread |
| `canvas.toBlob` (main-thread) a 3200×2400 | 304 ms | **0** | idem — codec assíncrono do navegador |
| `VT.workers.process` (worker) a 3200×2400 | 193 ms | **0** | mesma ausência de bloqueio; wall distinto (codec) |

**Equivalência byte-a-byte** (SHA-256 do blob do main-thread vs do worker, 3200×2400 JPEG):

```
main  : 24cd359dc300dc8756299dec0bb84cbe963866b0135a0ac195538133f5ead89f
worker: 24cd359dc300dc8756299dec0bb84cbe963866b0135a0ac195538133f5ead89f
```

Idênticos (1.481.920 bytes cada) → a saída **não** mudaria se adotássemos; mas também não há ganho.

## Decisão por ferramenta

### Image Compress — **REJEITADO (sem benefício medido)**

- Pipeline (linhas 147–165): `drawImage` 1:1 → `toBlob(type, quality)`. O `drawImage` sem escala mediu
  **≈0 ms**; a codificação é assíncrona no codec do navegador → **0 long tasks** tanto no caminho atual
  quanto via worker.
- Adoção exigiria trocar o decode `<img>` por `createImageBitmap`, **copiar o bitmap** para o worker e
  manter um caminho síncrono de fallback paralelo — complexidade e cópia de memória **sem eliminar
  nenhum bloqueio do thread principal**. Trade-off negativo → não integra.

### Image Converter — **REJEITADO (mesma razão)**

- Pipeline por arquivo (linhas 272–278): idêntica ao Compress — `drawImage` 1:1 + `toBlob`. Sem escala.
  `detectAlpha` usa um canvas 64×64 (trivial). A montagem de ZIP e a varredura de marcadores são bytes
  pequenos, não codificação de imagem.
- Mesmo perfil: nenhum bloqueio de encode no main-thread para o worker remover. Batch e download não
  mudam. Não integra.

### Image Metadata — **REJEITADO (fora do escopo do worker + já não-bloqueante)**

- Caminho de análise é **parsing puro de bytes** (EXIF/TIFF/JFIF/WebP via `DataView`, `parseExif`,
  varredura de marcadores), que **termina no SOS `0xDA`** (linha 215) e nunca percorre dados de
  entropia/pixels — custo O(cabeçalho), sub-milissegundo para blocos EXIF típicos.
- Os únicos usos de canvas no arquivo (linhas 309, 589) são o **gerador de exemplo** e uma miniatura —
  não a análise.
- O worker só rasteriza/codifica canvas; para analisar EXIF precisaria **duplicar ~100 linhas de lógica
  de parser dentro do SRC inline do worker** (risco de divergência, manutenção dupla), sem ganho
  mensurável. **Não aplicável** — rejeitado por arquitetura, além de já ser não-bloqueante.

## Por que isto é o resultado correto (não uma omissão)

A U4 já estabeleceu lazy-load **rejeitado com evidência** para o mesmo motivo de princípio: offload só
vale quando existe trabalho pesado no thread principal. Aqui a medição mostra que **não existe** bloqueio
a remover em Compress/Converter (encode já é off-thread no navegador; blit 1:1 ≈0 ms) e que Metadata não
tem pipeline de canvas. Integrar seria adicionar cópia de bitmap, mensagem, timeout e um caminho de
fallback paralelo **sem benefício** — exatamente o que o mandamento proíbe.

## O que continua válido

- Resize mantém o worker (escala cara → bloqueio real). Nenhuma mudança.
- A infraestrutura `VT.workers` permanece testada e em uso; esta unidade apenas **recusa novas adoções
  sem justificativa**, documentando a medição que sustenta a recusa.

## Veredito

**U4b concluída.** Avaliação evidence-gated de `VT.workers` em Compress/Converter/Metadata resultou em
**rejeição fundamentada das três**, com medições reais de `longtask`/wall time e prova de equivalência
byte-a-byte (SHA-256) mostrando que a saída não mudaria. Zero alteração de código nas apps — o
comportamento e a identidade visual permanecem intactos, e evita-se complexidade sem ganho. Nenhuma
mudança de versão/SW é necessária para as apps; o release note de 0.9.0 registrará a avaliação honesta.
