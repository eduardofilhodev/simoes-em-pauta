# Simões em Pauta

PWA Protótipo - projeto final Jovens Comunicadores.

App que divulga problemas e potências de Simões Filho (BA) em cards e linhas do tempo. Funciona como site comum em qualquer navegador e pode ser instalado no celular ou no computador.

- **Site:** https://eduardofilhodev.github.io/simoes-em-pauta/
- **Moderação:** https://eduardofilhodev.github.io/simoes-em-pauta/moderar.html

## Como publicar o site (uma vez só)

1. No repositório, abra **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
4. Em um ou dois minutos, o site fica no ar no endereço acima.

## Como publicar ou editar um caso

1. Abra a página de **moderação** (`moderar.html`).
2. Use **+ Novo caso**, ou abra um caso e toque em **Editar caso**. Ao salvar, a alteração fica guardada no seu navegador.
3. Quando terminar, toque em **Publicar no site** e siga os passos da tela: copiar o conteúdo, abrir o `casos.json` no GitHub, colar e clicar em **Commit changes**.
4. Em cerca de um minuto, o site atualiza para todo mundo.

Combine no grupo para **uma pessoa publicar por vez**. Se duas pessoas editarem ao mesmo tempo, a última a colar o `casos.json` sobrescreve a outra.

### Fotos

Envie a foto para a pasta `img/` (botão **Add file → Upload files**) e, no campo de foto do caso, escreva o caminho, por exemplo `img/km30.jpg`. Prefira fotos de até 300 KB.

## Estrutura

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página pública do app |
| `moderar.html` | Mesma página, com as ferramentas de moderação |
| `app.js` | Telas, filtros, editor e compartilhamento |
| `styles.css` | Visual (claro e escuro) |
| `casos.json` | Todos os casos e os ajustes do app |
| `manifest.webmanifest` | Nome, ícones e cores do app instalado |
| `sw.js` | Service worker: deixa o app abrir sem internet |
| `icons/` | Ícones do app |
| `img/` | Fotos dos casos |

Ao mudar `app.js`, `styles.css` ou `index.html`, aumente a constante `VERSAO` em `sw.js` (por exemplo, de `sp-v1` para `sp-v2`) para os celulares que já instalaram o app receberem a atualização.
