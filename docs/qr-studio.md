# QR Studio · v1.0.0

Generate scannable QR codes for links, Wi-Fi, contacts and more — with your colors and logo.
Gere QR codes escaneáveis para links, Wi-Fi, contatos e mais — com suas cores e logo.

Category: 02 Generators · Engine: qrcode-generator 1.4.4 (MIT) · 100% local.

## Usage · Uso

1. **Content type** — URL, Text, E-mail, Phone, SMS, Wi-Fi, Contact (vCard 3.0).
   **Tipo de conteúdo** — URL, Texto, E-mail, Telefone, SMS, Wi-Fi, Contato (vCard 3.0).
2. **Data** — fields validate per type: http/https URLs only (scheme auto-added), phone digits
   with optional `+`, Wi-Fi requires SSID and password unless "Open network".
   **Dados** — validação por tipo: apenas http/https, telefone com `+` opcional, Wi-Fi exige
   senha exceto em rede aberta.
3. **Appearance** — foreground/background, export size (256–2048 px), quiet zone (0–8 modules),
   error correction L/M/Q/H, optional center logo.
   **Aparência** — cores, tamanho de exportação, margem, correção de erro, logo central opcional.
4. **Export** — PNG (raster at chosen size) or SVG (vector, crisp edges, embedded logo).
   **Exportar** — PNG ou SVG (vetorial com logo embutido).

Wi-Fi payloads escape `\ ; , : "` and spaces per the Wi-Fi QR convention; text is UTF-8 encoded.
Payloads Wi-Fi escapam `\ ; , : "` e espaços; texto é codificado em UTF-8.

## Privacy · Privacidade

Everything is generated in your browser. Nothing is uploaded, logged or tracked.
Tudo é gerado no seu navegador. Nada é enviado, registrado ou rastreado.

## Limits · Limites

- Center logo covers ~20% of the code; ECC is locked to **H** while a logo is present so the
  code stays scannable. Keep strong foreground/background contrast.
  O logo cobre ~20% do código; ECC trava em **H** com logo. Mantenha contraste forte.
- Very long payloads exceed QR capacity at high ECC — shorten content or lower ECC.
  Payloads muito longos excedem a capacidade; encurte o conteúdo ou baixe o ECC.
- Always scan the live preview with a phone before sharing.
  Sempre escaneie a prévia com um celular antes de compartilhar.

## Verified · Verificado

URL, Wi-Fi (with escaped specials) and Unicode text round-trips decoded with jsQR in-browser;
SVG export rasterized and decoded; PNG export blob checked; invalid input disables exports with
a localized error; logo/ECC/size state stays in sync across navigation.
Round-trips de URL, Wi-Fi e Unicode decodificados com jsQR; SVG rasterizado e decodificado;
PNG conferido; entrada inválida desativa exportações; estado sincronizado entre navegações.