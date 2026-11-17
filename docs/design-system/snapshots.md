# Snapshot `v1_css/` — registro de preservação

| Campo | Valor |
|---|---|
| Origem | `css/` do Vista-Tools (aero-tools) no estado em que se encontrava antes da intervenção AERO |
| Versão da aplicação | **0.23.0** — última release antes de `0.24.0` |
| Identidade preservada | **Cosmic Liquid Glass** (azul-noturno + ciano) |
| Data do snapshot | 2026-11-15 |
| Finalidade | Arquivo histórico imutável: permite comparar, auditar e recuperar o sistema visual anterior. **Não** é carregado por `index.html`. |
| Regra permanente | Nenhum arquivo novo é escrito dentro de `v1_css/`. Nenhum arquivo existente é sobrescrito, movido ou apagado. `css/` é o sistema ativo. |

## Integridade verificada (SHA-256)

| Arquivo | Bytes | Modificado | SHA-256 | `css/` ativo difere? |
|---|---|---|---|---|
| `apps.css` | 126929 | 2026-11-15 | `ef1bf15a59d7a37c3af2f52d02ba5a20d1eb184c1546a3207f78ecf4b365f441` | sim |
| `background.css` | 2874 | 2026-11-15 | `6f322334c86b1be6817bce8ce1334bf3fed57729aa9fe14a5766ffb3b028fcfb` | sim |
| `base.css` | 3854 | 2026-11-15 | `f19dc2a0e0354f51b4840b30f5255a193768a5d89f48d8055479ca102f402058` | sim |
| `components.css` | 9923 | 2026-11-15 | `f2c4d10082a81e607a8e505e9cbfb4433c254cfd39bf95ff590c64be0f627c1f` | sim |
| `fonts.css` | 646 | 2026-11-15 | `45a14c498777954622e6c7cfb9fd03ec80f57153ee6332dcc09997ba1a380adf` | não |
| `glass.css` | 2125 | 2026-11-15 | `4e1e406489c0e0b64a7ef6712a54aa94b91a0538fdea1e49528d75405faa47c9` | sim |
| `responsive.css` | 8263 | 2026-11-15 | `f687295379784c9600af961ab7474e8e8f96b2e9b9a8895674f9e04afba1d42f` | sim |
| `shell.css` | 13698 | 2026-11-15 | `c6026c2d63f7765c2495a265b2a8f824fbe627dbf3845ede56579f41b69be310` | sim |
| `tokens.css` | 1552 | 2026-11-15 | `9015396c5dd49e3f28e2568c445d5f17cd71297e8b94726fd39a34f268a2ad67` | sim |

## Como verificar

```bash
node _dev/verify-v1-css.js
```

O script recalcula os hashes de `v1_css/*.css` e compara com a tabela acima.
Qualquer divergência indica que o snapshot foi alterado — o que não é permitido.
