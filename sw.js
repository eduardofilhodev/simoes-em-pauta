/* Service worker do Simões em Pauta.
   Ao mudar app.js, styles.css ou index.html, aumente VERSAO para forçar a atualização. */
const VERSAO = "sp-v1";
const ESSENCIAIS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "casos.json",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Casos: busca sempre a versão mais nova e usa o cache só sem internet.
async function redePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  try {
    const resp = await fetch(req, { cache: "no-cache" });
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (err) {
    const salvo = await cache.match(req, { ignoreSearch: true });
    if (salvo) return salvo;
    throw err;
  }
}

// Páginas, estilos, scripts, fotos e fontes: responde com o cache e atualiza por trás.
async function cacheEAtualiza(req) {
  const cache = await caches.open(VERSAO);
  const salvo = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
  const rede = fetch(req)
    .then((resp) => {
      if (resp && (resp.ok || resp.type === "opaque")) cache.put(req, resp.clone());
      return resp;
    })
    .catch(() => null);
  if (salvo) return salvo;
  const resp = await rede;
  if (resp) return resp;
  if (req.mode === "navigate") {
    const inicio = await cache.match("index.html");
    if (inicio) return inicio;
  }
  return Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const mesmaOrigem = url.origin === self.location.origin;
  const fonte = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!mesmaOrigem && !fonte) return;
  if (mesmaOrigem && url.pathname.endsWith("/casos.json")) {
    e.respondWith(redePrimeiro(req));
    return;
  }
  e.respondWith(cacheEAtualiza(req));
});
