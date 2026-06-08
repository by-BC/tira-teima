<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=190&color=0:0D1117,55:1F6FEB,100:0D1117&text=Tira-Teima&fontColor=F0F6FC&fontSize=50&fontAlignY=38&desc=Replay%20instant%C3%A2neo%20de%20quadra%20direto%20do%20navegador&descAlignY=60&descSize=16" alt="Banner Tira-Teima" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-0D1117?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/100%25_Local-1F6FEB?style=for-the-badge&logo=googlechrome&logoColor=white" alt="100% Local" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=20&duration=2600&pause=900&color=58A6FF&center=true&vCenter=true&width=850&lines=Replay+instant%C3%A2neo+direto+do+navegador;A+c%C3%A2mera+grava+continuamente+em+loop;Salve+os+melhores+lances+com+um+toque;100%25+no+dispositivo%2C+sem+backend" alt="Typing SVG" />
</p>

---

## Sobre o projeto

<table>
  <tr>
    <td width="58%" valign="top">

O **Tira-Teima** é um sistema de **replay instantâneo de quadra** feito para rodar direto no navegador. 

A câmera grava em loop contínuo e mantém um **buffer circular** dos últimos 18 segundos. Com apenas um toque, você salva os últimos **15 segundos** da jogada, descartando o tempo de ir até a câmera.

Ideal para **beach tennis, tênis, futvôlei** ou qualquer esporte de quadra, dispensando alguém para filmar.

Tudo é armazenado em uma **galeria local (IndexedDB)** — sem login, sem backend e sem upload. Nada sai do seu dispositivo.

<br />
<p align="center">
  <img src="https://img.shields.io/badge/Local_First-100%25-21262D?style=flat-square&logo=cachet&logoColor=58A6FF" alt="Local First" />
  <img src="https://img.shields.io/badge/Esportes-Quadra-21262D?style=flat-square&logo=nintendoswitch&logoColor=58A6FF" alt="Esportes" />
</p>

</td>
<td width="42%" valign="top">

```javascript
const tiraTeima = {
    sport: "Esportes de Quadra",
    platform: "Navegador Web",
    
    settings: {
        loopSize: "18s",
        saveClip: "15s",
        discard: "3s"
    },

    tech: [
        "getUserMedia",
        "MediaRecorder",
        "IndexedDB",
        "Wake Lock"
    ],
    
    backendRequired: false
}
```

</td>
</tr>
</table>

---

## Stack principal

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,ts,react,tailwind,html,css&theme=dark" alt="Tech Stack" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16_App_Router-21262D?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-21262D?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Web_APIs_Nativas-1F6FEB?style=for-the-badge&logo=w3c&logoColor=white" alt="Web APIs" />
</p>

---

## Como executar

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Rodando localmente</h3>
      <p>Clone o repositório, instale as dependências e inicie o servidor.</p>
      
```bash
npm install
npm run dev
```
      <p>Acesse <code>http://localhost:3000</code> no desktop.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Testando no celular</h3>
      <p>A API de câmera exige contexto seguro (HTTPS). Para testar no IP local:</p>
      
```bash
npm run dev -- --experimental-https
```
      <p>Acesse <code>https://SEU-IP:3000</code> e aceite o aviso de certificado.</p>
    </td>
  </tr>
</table>

*(Também pode usar túneis como `npx cloudflared tunnel --url http://localhost:3000` ou `ngrok`)*

---

## Estrutura e Gatilhos

### Gatilhos suportados para Replay

| Fonte | Como Acionar |
|---|---|
| **Botão na tela** | Toque / Clique no REPLAY |
| **Teclado / Clicker** | Tecla `Enter` ou `Espaço` |
| **Fone Bluetooth** | Botões de mídia (Media Session) |

> **Nota:** Controles de selfie que enviam "tecla de volume" não são captados pelo navegador. Use modelos "tipo teclado" ou "tipo mídia".

### Pastas do Projeto

```text
src/
├─ app/                 # página principal + layout
├─ components/          # CameraRecorder, ReplayButton, ClipGallery, etc.
├─ hooks/               # useCamera, useReplayRecorder, useClips, etc.
├─ services/            # clipStore (IndexedDB), mediaSupport, etc.
└─ lib/                 # format, silentAudio (Media Session)
```

---

## Limitações e Roadmap

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>MVP Atual</h3>
      <p>Foco principal: <b>Chrome no Android e Desktop</b>.</p>
      <p>O iOS/Safari funciona com ressalvas: a gravação pausa com tela bloqueada e não há suporte para vibração nativa.</p>
      <p>A montagem do clipe une chunks de vídeo, podendo gerar metadados de seek imprecisos no arquivo final.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Próximos Passos</h3>
      <p>
        • Login e galeria em nuvem<br>
        • Compartilhamento de clipes<br>
        • Controle remoto por outro celular<br>
        • Modo arena multi-câmera<br>
        • IA para detecção de jogadas
      </p>
    </td>
  </tr>
</table>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:0D1117,55:1F6FEB,100:0D1117" alt="Footer" />
</p>
