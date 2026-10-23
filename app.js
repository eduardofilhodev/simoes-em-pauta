/* Simões em Pauta — app público e área de moderação.
   Os casos ficam em casos.json. Na moderação (moderar.html), as edições ficam
   guardadas neste navegador até alguém colar o novo casos.json no GitHub. */
(function(){
"use strict";

var REPO = "eduardofilhodev/simoes-em-pauta";
var LINK_EDITAR_JSON = "https://github.com/" + REPO + "/edit/main/casos.json";
var LINK_ENVIAR_FOTO = "https://github.com/" + REPO + "/upload/main/img";
var MODERAR = !!window.MODERAR;
var CHAVE_TRABALHO = "sp-trabalho";

var dados = {config:{}, casos:[]};
var S = {view:"carregando", filtro:"todos", podeEditar:MODERAR, msg:"", erro:false, rasc:null, cfg:null, excluir:false, pendente:false};
var app = document.getElementById("app");

/* ---------- utilitários ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function hoje(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dataBR(iso){if(!iso)return"";var p=iso.split("-");var d=new Date(+p[0],+p[1]-1,+p[2]);return d.toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"})}
function slug(t){return String(t).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"caso"}
function tipoNome(t){return t==="potencia"?"Potência":"Problema"}
function cfg(k,padrao){return dados.config[k]||padrao}
function ordenar(l){return l.slice().sort(function(a,b){if(!!b.destaque!==!!a.destaque)return b.destaque?1:-1;return(b.atualizado||"").localeCompare(a.atualizado||"")})}
function achar(id){for(var i=0;i<dados.casos.length;i++)if(dados.casos[i].id===id)return dados.casos[i];return null}
function baseSite(){return location.origin+location.pathname.replace(/(moderar|index)\.html$/,"")}
function linkCaso(c){var b=cfg("linkApp","")||baseSite();return b.replace(/#.*$/,"")+"#"+c.id}
function ler(k){try{return localStorage.getItem(k)}catch(e){return null}}
function gravar(k,v){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);return true}catch(e){return false}}

/* ---------- compartilhamento ---------- */
function textoShare(c){
  var t="*"+c.titulo+"*\n\n"+c.resumo;
  if(c.pergunta)t+="\n\n_A pergunta:_ "+c.pergunta;
  t+="\n\nVeja a linha do tempo completa: "+linkCaso(c);
  t+="\n\n"+cfg("nome","Simões em Pauta")+" · "+cfg("grupo","Jovens Comunicadores");
  return t;
}
function waUrl(texto,num){return"https://wa.me/"+(num?String(num).replace(/\D/g,""):"")+"?text="+encodeURIComponent(texto)}

/* ---------- telas públicas ---------- */
function topoFeed(){
  var n={todos:dados.casos.length,problema:0,potencia:0};
  dados.casos.forEach(function(c){n[c.tipo==="potencia"?"potencia":"problema"]++});
  function chip(k,r){return'<button class="chip" data-act="filtro" data-v="'+k+'" aria-pressed="'+(S.filtro===k)+'">'+r+'<span class="n">'+n[k]+'</span></button>'}
  return'<header class="wrap hero"><p class="kicker">Simões Filho · Bahia</p><h1 class="hero-t">'+esc(cfg("nome","Simões em Pauta"))+'</h1><p class="hero-sub">O que a cidade precisa saber.</p><p class="hero-txt">Problemas e potências de Simões Filho, apurados por '+esc(cfg("grupo","Jovens Comunicadores"))+'. Cada caso traz a linha do tempo, quem responde e como agir.</p></header>'+
    '<nav class="filtros-bar" aria-label="Filtrar casos"><div class="wrap filtros">'+chip("todos","Todos")+chip("problema","Problemas")+chip("potencia","Potências")+'</div></nav>'+modbar();
}
function modbar(){
  if(!S.podeEditar)return"";
  return'<div class="modbar"><div class="wrap"><strong>Moderação</strong>'+(S.pendente?'<span class="pendente">Alterações não publicadas</span>':"")+
    '<button class="btn btn-peq" data-act="novo">+ Novo caso</button><button class="btn btn-peq" data-act="config">Ajustes</button>'+
    '<button class="btn btn-peq btn-cheio" data-act="exportar">Publicar no site</button></div></div>';
}
function aviso(){return S.msg?'<div class="aviso'+(S.erro?" erro":"")+'" role="status">'+esc(S.msg)+'</div>':""}

function telaCarregando(){return'<div class="wrap" style="padding-block:64px;color:var(--muted);text-align:center">Carregando casos…</div>'}

function telaFeed(){
  var lista=ordenar(dados.casos).filter(function(c){return S.filtro==="todos"||c.tipo===S.filtro});
  var h=topoFeed()+'<main class="wrap feed">'+aviso();
  if(!lista.length){
    var pot=S.filtro==="potencia";
    var nome=pot?"potência":S.filtro==="problema"?"problema":"caso";
    h+='<div class="vazio"><h2>Nenhum'+(pot?"a ":" ")+nome+' publicad'+(pot?"a":"o")+' ainda</h2><p>'+(S.podeEditar?"Use “+ Novo caso” na faixa de moderação para criar o primeiro.":"Os casos aparecem aqui assim que o grupo publicar.")+'</p></div>';
  }
  lista.forEach(function(c){
    h+='<a class="card" href="#'+esc(c.id)+'">'+(c.imagem?'<img class="card-img" src="'+esc(c.imagem)+'" alt="" loading="lazy">':"")+
      '<div class="card-body"><div class="meta"><span class="selo selo-'+(c.tipo==="potencia"?"potencia":"problema")+'">'+tipoNome(c.tipo)+'</span>'+(c.destaque?'<span class="destaque-tag">Destaque</span>':"")+(c.local?'<span class="local">'+esc(c.local)+'</span>':"")+'</div>'+
      '<h2>'+esc(c.titulo)+'</h2><p class="resumo">'+esc(c.resumo)+'</p>'+
      '<div class="card-foot"><span>'+(c.linha||[]).length+' marcos na linha do tempo</span><span>Atualizado em '+esc(dataBR(c.atualizado))+'</span></div></div></a>';
  });
  h+='</main><footer class="wrap rodape">';
  var w=cfg("whatsappSugestoes","");
  if(w)h+='<a class="btn" href="'+esc(waUrl("Olá! Quero sugerir uma pauta sobre Simões Filho: ",w))+'" target="_blank" rel="noopener">Sugerir uma pauta pelo WhatsApp</a>';
  h+='<p>Conteúdo apurado e publicado pelo grupo '+esc(cfg("grupo","Jovens Comunicadores"))+'. Cada caso traz as fontes consultadas e a versão dos órgãos citados.</p></footer>';
  return h;
}

function telaCaso(c){
  var tp=c.tipo==="potencia"?"potencia":"problema";
  var h='<header class="top"><div class="wrap top-in"><a class="voltar" href="#">← Casos</a>'+(S.podeEditar?'<button class="btn btn-peq" data-act="editar" data-id="'+esc(c.id)+'">Editar caso</button>':'<span class="top-nome">'+esc(cfg("nome","Simões em Pauta"))+'</span>')+'</div></header>';
  h+='<main class="wrap caso">'+aviso()+'<div class="caso-cab"><div class="meta"><span class="selo selo-'+tp+'">'+tipoNome(c.tipo)+'</span>'+(c.local?'<span class="local">'+esc(c.local)+'</span>':"")+'</div><h1 class="caso-titulo">'+esc(c.titulo)+'</h1><p class="lead">'+esc(c.resumo)+'</p></div>';
  if(c.imagem)h+='<img class="caso-img" src="'+esc(c.imagem)+'" alt="">';
  if(c.pergunta)h+='<div class="pergunta"><span class="rotulo">A pergunta da pauta</span><p>'+esc(c.pergunta)+'</p></div>';
  if((c.linha||[]).length){
    h+='<section class="secao"><h2>Linha do tempo</h2><ol class="linha">';
    c.linha.forEach(function(m,i){var ult=i===c.linha.length-1&&/^hoje$/i.test(String(m.quando).trim());h+='<li'+(ult?' class="agora"':"")+'><span class="quando">'+esc(m.quando)+'</span><p>'+esc(m.texto)+'</p></li>'});
    h+='</ol></section>';
  }
  if((c.consequencias||[]).length){h+='<section class="secao"><h2>'+(tp==="potencia"?"O que isso gera":"O que isso causa")+'</h2><ul class="lista">';c.consequencias.forEach(function(x){h+='<li>'+esc(x)+'</li>'});h+='</ul></section>'}
  if((c.responsaveis||[]).length){h+='<section class="secao"><h2>'+(tp==="potencia"?"Quem faz e quem apoia":"Quem responde")+'</h2><ul class="resp">';c.responsaveis.forEach(function(x){h+='<li>'+esc(x)+'</li>'});h+='</ul></section>'}
  if((c.acoes||[]).length){
    h+='<section class="secao"><h2>Como agir</h2><ol class="acoes">';
    c.acoes.forEach(function(a){h+='<li><h3>'+esc(a.titulo)+'</h3>'+(a.texto?'<p>'+esc(a.texto)+'</p>':"")+(a.link?'<a href="'+esc(a.link)+'" target="_blank" rel="noopener">Abrir →</a>':"")+'</li>'});
    h+='</ol></section>';
  }
  if((c.fontes||[]).length){
    h+='<section class="secao"><h2>Fontes</h2><ul class="fontes">';
    c.fontes.forEach(function(f){h+='<li>'+(f.url?'<a href="'+esc(f.url)+'" target="_blank" rel="noopener">'+esc(f.nome||f.url)+'</a>':esc(f.nome))+'</li>'});
    h+='</ul></section>';
  }
  h+='<p class="atualizado">Atualizado em '+esc(dataBR(c.atualizado))+' · '+esc(cfg("grupo","Jovens Comunicadores"))+'</p></main>';
  h+='<div class="sharebar"><div class="wrap"><a class="btn btn-cheio" href="'+esc(waUrl(textoShare(c)))+'" target="_blank" rel="noopener">Enviar no WhatsApp</a><button class="btn" data-act="copiar" data-id="'+esc(c.id)+'">Copiar texto</button></div></div>';
  return h;
}

/* ---------- moderação: editor ---------- */
function linhas(arr){return(arr||[]).join("\n")}
function pares(arr,campos){return(arr||[]).map(function(o){return campos.map(function(k){return o[k]||""}).join(" | ").replace(/( \| )+$/,"")}).join("\n")}
function lerLinhas(t){return String(t||"").split("\n").map(function(s){return s.trim()}).filter(Boolean)}
function lerPares(t,campos){return lerLinhas(t).map(function(l){var p=l.split("|").map(function(s){return s.trim()});var o={};campos.forEach(function(k,i){o[k]=p[i]||""});return o})}

function abrirEditor(c){
  S.rasc=c?{id:c.id,novo:false,tipo:c.tipo,titulo:c.titulo,local:c.local||"",resumo:c.resumo,pergunta:c.pergunta||"",imagem:c.imagem||"",destaque:!!c.destaque,
    linha:(c.linha||[]).map(function(m){return{quando:m.quando,texto:m.texto}}),
    consequencias:linhas(c.consequencias),responsaveis:linhas(c.responsaveis),acoes:pares(c.acoes,["titulo","texto","link"]),fontes:pares(c.fontes,["nome","url"])}
   :{id:"",novo:true,tipo:"problema",titulo:"",local:"",resumo:"",pergunta:"",imagem:"",destaque:false,linha:[{quando:"",texto:""}],consequencias:"",responsaveis:"",acoes:"",fontes:""};
  S.view="editar";S.excluir=false;S.msg="";render();window.scrollTo(0,0);
}

function telaEditor(){
  var r=S.rasc;
  var h='<header class="top"><div class="wrap top-in"><button class="voltar" style="background:none;border:0;cursor:pointer;padding:0" data-act="cancelar">← Cancelar</button></div></header>';
  h+='<main class="wrap form">'+aviso()+'<h1>'+(r.novo?"Novo caso":"Editar caso")+'</h1>';
  h+='<div class="campo"><span class="lbl">Tipo</span><div class="seg" role="radiogroup">'+
    '<label><input type="radio" name="tipo" id="f-tipo-p" value="problema" data-campo="tipo"'+(r.tipo!=="potencia"?" checked":"")+'> Problema</label>'+
    '<label><input type="radio" name="tipo" id="f-tipo-o" value="potencia" data-campo="tipo"'+(r.tipo==="potencia"?" checked":"")+'> Potência</label></div></div>';
  h+=campoTxt("titulo","Título","text","Curto e direto. Ex.: Km 30: quando a chuva chega, a encosta desce");
  h+=campoTxt("local","Bairro ou local","text","Ex.: Km 30, CIA 1, Quilombo Rio dos Macacos");
  h+=campoArea("resumo","Resumo","Duas ou três frases: o que acontece, com quem e desde quando.");
  h+=campoTxt("pergunta","Pergunta da pauta","text","A pergunta principal que a pauta quer responder.");
  h+='<div class="campo"><label for="f-imagem">Foto de capa (opcional)</label><input type="text" id="f-imagem" value="'+esc(r.imagem)+'" data-campo="imagem" placeholder="img/nome-da-foto.jpg">'+
    '<span class="dica">Envie a foto para a <a href="'+LINK_ENVIAR_FOTO+'" target="_blank" rel="noopener">pasta img do repositório</a> e escreva aqui o caminho, por exemplo img/km30.jpg. Use fotos de até 300 KB.</span>'+
    (r.imagem?'<img class="prev-img" src="'+esc(r.imagem)+'" alt="Prévia da foto">':"")+'</div>';
  h+='<div class="campo"><span class="lbl">Linha do tempo</span><span class="dica">Um marco por linha, na ordem em que aconteceu. Se o último marco for “Hoje”, ele ganha destaque.</span><div class="linha-ed">';
  r.linha.forEach(function(m,i){
    h+='<div class="lin"><input type="text" id="f-lq-'+i+'" placeholder="Quando" aria-label="Quando, marco '+(i+1)+'" value="'+esc(m.quando)+'" data-campo="lq" data-i="'+i+'">'+
      '<textarea class="lin-texto" id="f-lt-'+i+'" placeholder="O que aconteceu" aria-label="O que aconteceu, marco '+(i+1)+'" data-campo="lt" data-i="'+i+'">'+esc(m.texto)+'</textarea>'+
      '<div class="lin-acoes"><button class="ic" data-act="subir" data-i="'+i+'" aria-label="Subir marco"'+(i===0?" disabled":"")+'>↑</button><button class="ic" data-act="tirar" data-i="'+i+'" aria-label="Remover marco">×</button></div></div>';
  });
  h+='</div><button class="btn btn-peq" data-act="add-marco" style="align-self:flex-start">+ Adicionar marco</button></div>';
  h+=campoArea("consequencias",r.tipo==="potencia"?"O que isso gera":"O que isso causa","Um item por linha.");
  h+=campoArea("responsaveis",r.tipo==="potencia"?"Quem faz e quem apoia":"Quem responde","Um órgão ou grupo por linha.");
  h+=campoArea("acoes","Como agir","Uma ação por linha, no formato: Título | explicação | link (o link é opcional).");
  h+=campoArea("fontes","Fontes","Uma fonte por linha, no formato: Nome | link (o link é opcional).");
  h+='<label class="check"><input type="checkbox" id="f-destaque" data-campo="destaque"'+(r.destaque?" checked":"")+'> Mostrar em destaque no topo</label>';
  h+='<div class="form-acoes">'+(!r.novo?'<button class="btn btn-perigo esq'+(S.excluir?" armado":"")+'" data-act="excluir">'+(S.excluir?"Confirmar exclusão":"Excluir caso")+'</button>':"")+
    '<button class="btn" data-act="cancelar">Cancelar</button><button class="btn btn-cheio" data-act="salvar">Salvar caso</button></div>';
  h+='</main>';
  return h;
  function campoTxt(k,rot,tipo,dica){return'<div class="campo"><label for="f-'+k+'">'+rot+'</label><input type="'+tipo+'" id="f-'+k+'" value="'+esc(r[k])+'" data-campo="'+k+'">'+(dica?'<span class="dica">'+dica+'</span>':"")+'</div>'}
  function campoArea(k,rot,dica){return'<div class="campo"><label for="f-'+k+'">'+rot+'</label><textarea id="f-'+k+'" data-campo="'+k+'">'+esc(r[k])+'</textarea>'+(dica?'<span class="dica">'+dica+'</span>':"")+'</div>'}
}

function telaConfig(){
  var c=S.cfg;
  var h='<header class="top"><div class="wrap top-in"><button class="voltar" style="background:none;border:0;cursor:pointer;padding:0" data-act="cancelar">← Voltar</button></div></header>';
  h+='<main class="wrap form">'+aviso()+'<h1>Ajustes do app</h1>';
  h+='<div class="campo"><label for="c-nome">Nome do app</label><input type="text" id="c-nome" value="'+esc(c.nome)+'" data-cfg="nome"></div>';
  h+='<div class="campo"><label for="c-grupo">Nome do grupo</label><input type="text" id="c-grupo" value="'+esc(c.grupo)+'" data-cfg="grupo"></div>';
  h+='<div class="campo"><label for="c-link">Link público do app (opcional)</label><input type="url" id="c-link" value="'+esc(c.linkApp)+'" data-cfg="linkApp" placeholder="'+esc(baseSite())+'"><span class="dica">Se ficar vazio, o app usa o próprio endereço do site nos links compartilhados.</span></div>';
  h+='<div class="campo"><label for="c-wa">WhatsApp para sugestões de pauta</label><input type="tel" id="c-wa" value="'+esc(c.whatsappSugestoes)+'" data-cfg="whatsappSugestoes" placeholder="5571999999999"><span class="dica">Com DDI e DDD, só números. Se ficar vazio, o botão “Sugerir uma pauta” não aparece.</span></div>';
  h+='<div class="form-acoes"><button class="btn esq" data-act="cancelar">Cancelar</button><button class="btn btn-cheio" data-act="salvar-cfg">Salvar ajustes</button></div></main>';
  return h;
}

/* ---------- moderação: publicar no GitHub ---------- */
function jsonFinal(){return JSON.stringify(dados,null,2)+"\n"}
function telaExportar(){
  var h='<header class="top"><div class="wrap top-in"><button class="voltar" style="background:none;border:0;cursor:pointer;padding:0" data-act="cancelar">← Voltar</button></div></header>';
  h+='<main class="wrap form">'+aviso()+'<h1>Publicar no site</h1>';
  if(!S.pendente)h+='<div class="aviso">Não há alterações novas. O conteúdo abaixo é igual ao que está no site.</div>';
  h+='<ol class="passos">'+
    '<li>Toque em <strong>Copiar casos.json</strong>.</li>'+
    '<li>Abra o <a href="'+LINK_EDITAR_JSON+'" target="_blank" rel="noopener">casos.json no GitHub</a> (é preciso estar logado com acesso ao repositório).</li>'+
    '<li>Apague todo o conteúdo do arquivo, cole o que você copiou e clique em <strong>Commit changes</strong>.</li>'+
    '<li>Em cerca de um minuto, o site atualiza. Depois volte aqui e toque em <strong>Já publiquei</strong>.</li></ol>';
  h+='<div class="campo"><label for="x-json">Conteúdo do casos.json</label><textarea id="x-json" class="export-json" readonly>'+esc(jsonFinal())+'</textarea></div>';
  h+='<div class="form-acoes"><button class="btn btn-perigo esq" data-act="descartar">'+(S.excluir?"Confirmar: descartar tudo":"Descartar alterações")+'</button><button class="btn" data-act="publicado">Já publiquei</button><button class="btn btn-cheio" data-act="copiar-json">Copiar casos.json</button></div></main>';
  return h;
}
function guardarTrabalho(msg){
  S.pendente=true;
  var ok=gravar(CHAVE_TRABALHO,JSON.stringify({salvoEm:new Date().toISOString(),dados:dados}));
  S.msg=ok?msg+" Quando terminar, toque em “Publicar no site”.":msg+" Atenção: este navegador não deixou guardar a edição. Publique antes de fechar a página.";
  S.erro=!ok;
}

/* ---------- render e rotas ---------- */
function render(){
  if(S.view==="carregando"){app.innerHTML=telaCarregando();return}
  if(S.view==="editar"&&S.rasc){app.innerHTML=telaEditor();return}
  if(S.view==="config"&&S.cfg){app.innerHTML=telaConfig();return}
  if(S.view==="exportar"){app.innerHTML=telaExportar();return}
  var id=decodeURIComponent((location.hash||"").replace(/^#/,""));
  var c=id?achar(id):null;
  app.innerHTML=c?telaCaso(c):telaFeed();
  document.title=c?c.titulo+" · "+cfg("nome","Simões em Pauta"):cfg("nome","Simões em Pauta")+(MODERAR?" · Moderação":"");
}
function voltarFeed(){S.view="feed";S.rasc=null;S.cfg=null;S.excluir=false;render();window.scrollTo(0,0)}
window.addEventListener("hashchange",function(){if(S.view==="feed"){S.msg="";render();window.scrollTo(0,0)}});

function salvarCaso(){
  var r=S.rasc;
  if(!r.titulo.trim()||!r.resumo.trim()){S.msg="Preencha pelo menos o título e o resumo.";S.erro=true;render();window.scrollTo(0,0);return}
  var id=r.id;
  if(r.novo){id=slug(r.titulo);var b=id,n=2;while(achar(id)){id=b+"-"+n++}}
  var caso={id:id,tipo:r.tipo==="potencia"?"potencia":"problema",titulo:r.titulo.trim(),local:r.local.trim(),resumo:r.resumo.trim(),pergunta:r.pergunta.trim(),imagem:r.imagem.trim(),destaque:!!r.destaque,atualizado:hoje(),
    linha:r.linha.filter(function(m){return m.quando.trim()||m.texto.trim()}).map(function(m){return{quando:m.quando.trim(),texto:m.texto.trim()}}),
    consequencias:lerLinhas(r.consequencias),responsaveis:lerLinhas(r.responsaveis),acoes:lerPares(r.acoes,["titulo","texto","link"]),fontes:lerPares(r.fontes,["nome","url"])};
  var i=dados.casos.findIndex(function(c){return c.id===r.id});
  if(i>=0)dados.casos[i]=caso;else dados.casos.push(caso);
  guardarTrabalho("Caso salvo.");
  S.view="feed";S.rasc=null;
  if(location.hash.replace(/^#/,"")!==caso.id)location.hash=caso.id;else render();
  window.scrollTo(0,0);
}

/* ---------- eventos ---------- */
function toast(t){var el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=t;document.body.appendChild(el);setTimeout(function(){el.remove()},2200)}
function copiar(t,ok){
  function fallback(){var ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();var r=false;try{r=document.execCommand("copy")}catch(e){}ta.remove();toast(r?(ok||"Texto copiado"):"Não deu para copiar. Selecione o texto manualmente.")}
  try{navigator.clipboard.writeText(t).then(function(){toast(ok||"Texto copiado")},fallback)}catch(e){fallback()}
}

app.addEventListener("click",function(e){
  var el=e.target.closest("[data-act]");if(!el)return;
  var a=el.getAttribute("data-act"),r=S.rasc;
  if(el.tagName==="BUTTON")e.preventDefault();
  if(a==="filtro"){S.filtro=el.getAttribute("data-v");render()}
  else if(a==="copiar"){var c=achar(el.getAttribute("data-id"));if(c)copiar(textoShare(c))}
  else if(!S.podeEditar)return;
  else if(a==="novo")abrirEditor(null);
  else if(a==="editar")abrirEditor(achar(el.getAttribute("data-id")));
  else if(a==="config"){S.cfg={nome:cfg("nome","Simões em Pauta"),grupo:cfg("grupo","Jovens Comunicadores"),linkApp:cfg("linkApp",""),whatsappSugestoes:cfg("whatsappSugestoes","")};S.view="config";S.msg="";render();window.scrollTo(0,0)}
  else if(a==="exportar"){S.view="exportar";S.msg="";S.excluir=false;render();window.scrollTo(0,0)}
  else if(a==="cancelar"){S.msg="";voltarFeed()}
  else if(a==="add-marco"){r.linha.push({quando:"",texto:""});render();var q=document.getElementById("f-lq-"+(r.linha.length-1));if(q)q.focus()}
  else if(a==="tirar"){r.linha.splice(+el.getAttribute("data-i"),1);if(!r.linha.length)r.linha.push({quando:"",texto:""});render()}
  else if(a==="subir"){var i=+el.getAttribute("data-i");if(i>0){var t=r.linha[i];r.linha[i]=r.linha[i-1];r.linha[i-1]=t;render()}}
  else if(a==="excluir"){
    if(!S.excluir){S.excluir=true;render();return}
    dados.casos=dados.casos.filter(function(c){return c.id!==r.id});
    guardarTrabalho("Caso excluído.");
    S.view="feed";S.rasc=null;S.excluir=false;
    if(location.hash)location.hash="";else render();
  }
  else if(a==="salvar")salvarCaso();
  else if(a==="salvar-cfg"){
    var c2=S.cfg;dados.config.nome=c2.nome.trim()||"Simões em Pauta";dados.config.grupo=c2.grupo.trim()||"Jovens Comunicadores";dados.config.linkApp=c2.linkApp.trim();dados.config.whatsappSugestoes=c2.whatsappSugestoes.replace(/\D/g,"");
    guardarTrabalho("Ajustes salvos.");voltarFeed();
  }
  else if(a==="copiar-json")copiar(jsonFinal(),"casos.json copiado");
  else if(a==="publicado"){gravar(CHAVE_TRABALHO,null);S.pendente=false;S.msg="Pronto. Se o site ainda mostrar a versão antiga, espere um minuto e recarregue.";S.erro=false;carregar(true)}
  else if(a==="descartar"){
    if(!S.excluir){S.excluir=true;render();return}
    gravar(CHAVE_TRABALHO,null);S.pendente=false;S.excluir=false;S.msg="Alterações descartadas. Você está vendo o conteúdo atual do site.";S.erro=false;carregar(true);
  }
});
app.addEventListener("input",function(e){
  var el=e.target,k=el.getAttribute("data-campo"),r=S.rasc;
  if(el.hasAttribute("data-cfg")&&S.cfg){S.cfg[el.getAttribute("data-cfg")]=el.value;return}
  if(!k||!r)return;
  if(k==="lq")r.linha[+el.getAttribute("data-i")].quando=el.value;
  else if(k==="lt")r.linha[+el.getAttribute("data-i")].texto=el.value;
  else if(k==="destaque")r.destaque=el.checked;
  else if(k==="tipo"){r.tipo=el.value;render()}
  else r[k]=el.value;
});
app.addEventListener("change",function(e){
  var el=e.target;
  if(el.getAttribute("data-campo")==="destaque"&&S.rasc)S.rasc.destaque=el.checked;
  if(el.id==="f-imagem"&&S.rasc)render();
});

/* ---------- carregar casos ---------- */
function carregar(ignorarTrabalho){
  var trabalho=null;
  if(MODERAR&&!ignorarTrabalho){try{trabalho=JSON.parse(ler(CHAVE_TRABALHO)||"null")}catch(e){}}
  if(trabalho&&trabalho.dados){
    dados=trabalho.dados;S.pendente=true;S.view="feed";
    S.msg="Você tem alterações guardadas neste navegador que ainda não foram publicadas no site.";S.erro=false;
    render();return;
  }
  fetch("casos.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){
    dados={config:d.config||{},casos:d.casos||[]};
    if(S.view==="carregando"||ignorarTrabalho)S.view="feed";
    render();
  }).catch(function(){
    S.view="feed";S.msg="Não deu para carregar os casos. Confira a conexão e recarregue a página.";S.erro=true;render();
  });
}
render();
carregar(false);

/* ---------- PWA ---------- */
if("serviceWorker" in navigator){
  window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
}
})();
