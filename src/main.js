import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  SceneLoader,
  MeshBuilder,
  StandardMaterial,
  ShadowGenerator,
  Animation,
  CubicEase,
  EasingFunction,
  PointerDragBehavior,
  CubeTexture,
  DynamicTexture,
  Texture,
  DefaultRenderingPipeline,
  SSAO2RenderingPipeline,
  HighlightLayer,
  PointerEventTypes,
  PBRMaterial
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {
  AdvancedDynamicTexture,
  Button,
  Slider,
  TextBlock,
  StackPanel,
  Rectangle
} from "@babylonjs/gui";

// =========================================================
// CONFIGURAÇÃO
// =========================================================
const CONFIG = {
  modelFile: "moenda.glb",
  modelPath: "models/",
  distanciaExplosaoPadrao: 0.1,
  multiplicadorPecaPequena: 1.4,
  pecasPequenasKeywords: [
    "parafuso", "porca", "arruela", "pino", "anel", "chaveta",
    "retentor", "rolamento", "dobradiça"
  ],
  // Rotação inicial ajustada para o modelo
  correcaoRotacao: { x: 0, y: Math.PI / 2, z: 0 },
  escala: 10,
  manualPdf: "manual/manual-operador.pdf"
};

// =========================================================
// TRADUÇÃO / LIMPEZA DE NOMES
// =========================================================
const TRADUCOES_HARDWARE = [
  [/BS EN ISO 2338.*/i, "Pino Cilíndrico (BS EN ISO 2338)"],
  [/SS ISO 8752.*/i, "Pino Elástico (SS ISO 8752)"],
  [/DIN 912 - substituído por DIN EN ISO 4762.*/i, "Parafuso Allen (DIN EN ISO 4762)"],
  [/DIN 71412 A AM 6.*/i, "Pino Cônico Curto (DIN 71412)"],
  [/DIN 125-1 A A 10,5.*/i, "Arruela Lisa (DIN 125, Ø10,5)"],
  [/DIN 125-1 A A 17.*/i, "Arruela Lisa (DIN 125, Ø17)"],
  [/DIN 934 - substituído por DIN EN 24032\/28673\/28674 M10.*/i, "Porca Sextavada M10 (DIN EN 24032)"],
  [/DIN 934 - substituído por DIN EN 24032\/28673\/28674 M2.*/i, "Porca Sextavada M2 (DIN EN 24032)"],
  [/CSN 029401.*/i, "Anel de Vedação (CSN 029401, 17x30x7)"],
  [/DIN 625 SKF SKF 61903.*/i, "Rolamento de Esferas SKF 61903 (DIN 625)"],
  [/RETENTOR.*/i, "Retentor de Vedação"],
  [/DIN 128 A16.*/i, "Arruela de Pressão (DIN 128)"],
  [/DIN 439-2 - substituído por DIN EN 24035\/28675 M16.*/i, "Porca Sextavada Baixa M16 (DIN EN 24035)"],
  [/DIN 6885-1 A A 5 x 5 x 18.*/i, "Chaveta Paralela 5x5x18 (DIN 6885)"],
  [/DIN 471 16x1.*/i, "Anel Elástico Externo (DIN 471, Ø16)"],
  [/SFS-ISO 7049.*/i, "Parafuso Autoatarrachante (SFS-ISO 7049)"],
  [/ISO 2009 M5 x 8.*/i, "Parafuso Escareado Fenda M5 (ISO 2009)"],
  [/BS EN ISO 7045.*M2.*/i, "Parafuso Phillips Cabeça Panela M2 (BS EN ISO 7045)"],
  [/Engrenagem reta1/i, "Engrenagem Reta 1"],
  [/Engrenagem reta2/i, "Engrenagem Reta 2"],
  [/DOBRADICA1/i, "Dobradiça 1"],
  [/DOBRADICA2/i, "Dobradiça 2"]
];

function limparNomePeca(nomeBruto) {
  let nome = nomeBruto || "";
  nome = nome.replace(/:\d+$/i, "");
  for (const [regex, sub] of TRADUCOES_HARDWARE) {
    if (regex.test(nome)) return sub;
  }
  nome = nome.trim();
  return nome || nomeBruto;
}

// =========================================================
// FICHA TÉCNICA
// =========================================================
const METADADOS_PRINCIPAIS = {
  "BASE DA MOENDA": { funcao: "Estrutura de sustentação de toda a montagem", material: "Ferro fundido / aço estrutural", norma: "Projeto interno", torque: "—", ferramenta: "—", manutencao: "Inspeção visual de trincas e corrosão" },
  "BUCHA DO MANCAL DIREITO": { funcao: "Reduz atrito entre eixo e mancal direito, permite rotação suave", material: "Bronze SAE 40", norma: "—", torque: "—", ferramenta: "—", manutencao: "Trocar quando houver folga excessiva ou desgaste visível" },
  "MANCAL DIREITO": { funcao: "Suporta e alinha o eixo do lado direito", material: "Ferro fundido cinzento", norma: "Projeto interno", torque: "—", ferramenta: "Chave fixa", manutencao: "Verificar alinhamento e lubrificação" },
  "MANCAL ESQUERDO": { funcao: "Suporta e alinha o eixo do lado esquerdo", material: "Ferro fundido cinzento", norma: "Projeto interno", torque: "—", ferramenta: "Chave fixa", manutencao: "Verificar alinhamento e lubrificação" },
  "BASE DO MANCAL DIREITO": { funcao: "Sustenta e fixa o mancal direito à base da moenda", material: "Ferro fundido cinzento", norma: "Projeto interno", torque: "—", ferramenta: "Chave fixa", manutencao: "Verificar trincas e fixação" },
  "BASE DO MANCAL ESQUERDO": { funcao: "Sustenta e fixa o mancal esquerdo à base da moenda", material: "Ferro fundido cinzento", norma: "Projeto interno", torque: "—", ferramenta: "Chave fixa", manutencao: "Verificar trincas e fixação" },
  "TIRANTE": { funcao: "Ajusta a distância entre os rolos, controlando a pressão de moagem", material: "Aço SAE 1045", norma: "—", torque: "Conforme regulagem de moagem", ferramenta: "Chave de boca / manivela de ajuste", manutencao: "Verificar rosca e lubrificar periodicamente" },
  "CALHA DE ESCOAMENTO": { funcao: "Coleta e direciona o caldo extraído da cana para fora da moenda", material: "Chapa de aço inox ou galvanizada", norma: "Contato com alimento — inox recomendado", torque: "—", ferramenta: "—", manutencao: "Higienização após cada uso, verificar corrosão" },
  "EIXO PRINCIPAL": { funcao: "Transmite o torque da manivela para o rolo principal", material: "Aço SAE 1045 (temperado)", norma: "—", torque: "—", ferramenta: "—", manutencao: "Verificar alinhamento e desgaste nos mancais" },
  "EIXO SECUNDÁRIO": { funcao: "Transmite rotação para o segundo rolo moedor via engrenagens", material: "Aço SAE 1045", norma: "—", torque: "—", ferramenta: "—", manutencao: "Verificar engrenamento e folga" },
  "ALAVANCA DA MANIVELA": { funcao: "Converte o esforço manual do operador em torque de acionamento", material: "Aço carbono", norma: "—", torque: "Esforço manual típico", ferramenta: "—", manutencao: "Verificar fixação na chaveta do eixo" },
  "MANÍPULO": { funcao: "Empunhadura ergonômica para o operador aplicar força na manivela", material: "Aço ou madeira", norma: "—", torque: "—", ferramenta: "—", manutencao: "Verificar folga de giro e lubrificação" },
  "CALHA DE PROTEÇÃO DAS ENGRENAGENS": { funcao: "Proteção de segurança contra contato acidental com as engrenagens em movimento", material: "Chapa de aço", norma: "NR-12", torque: "—", ferramenta: "—", manutencao: "Verificar fixação antes de cada operação — item crítico de segurança" },
  "PROTECAO DOS ROLOS": { funcao: "Proteção de segurança contra contato acidental com os rolos moedores", material: "Chapa de aço", norma: "NR-12", torque: "—", ferramenta: "—", manutencao: "Verificar fixação antes de cada operação — item crítico de segurança" },
  "PROTECAO DOS ROLOS CONT": { funcao: "Continuação da proteção de segurança dos rolos moedores", material: "Chapa de aço", norma: "NR-12", torque: "—", ferramenta: "—", manutencao: "Verificar fixação antes de cada operação — item crítico de segurança" },
  "Dobradiça 1": { funcao: "Permite abertura da proteção para manutenção/limpeza", material: "Aço inoxidável", norma: "—", torque: "—", ferramenta: "Chave de fenda", manutencao: "Lubrificar e verificar folga de giro" },
  "Dobradiça 2": { funcao: "Permite abertura da proteção para manutenção/limpeza", material: "Aço inoxidável", norma: "—", torque: "—", ferramenta: "Chave de fenda", manutencao: "Lubrificar e verificar folga de giro" },
  "Engrenagem Reta 1": { funcao: "Transmite rotação/torque entre os eixos, sincronizando os rolos", material: "Aço liga (SAE 4340 ou similar)", norma: "—", torque: "—", ferramenta: "—", manutencao: "Lubrificação e inspeção de desgaste dos dentes" },
  "Engrenagem Reta 2": { funcao: "Transmite rotação/torque entre os eixos, sincronizando os rolos", material: "Aço liga (SAE 4340 ou similar)", norma: "—", torque: "—", ferramenta: "—", manutencao: "Lubrificação e inspeção de desgaste dos dentes" }
};

function metadadosGenericos(nomeExibicao) {
  const n = nomeExibicao.toLowerCase();
  const base = { material: "Aço", norma: "Componente comercial padrão (norma DIN/ISO/BS conforme nome)", torque: "Consultar tabela de torque conforme diâmetro/classe", ferramenta: "—", manutencao: "Inspeção visual periódica" };

  if (n.includes("inox")) base.material = "Aço inoxidável";

  if (n.includes("parafuso")) return { ...base, funcao: "Fixação mecânica entre componentes", ferramenta: n.includes("allen") ? "Chave Allen" : n.includes("phillips") ? "Chave Phillips" : n.includes("fenda") ? "Chave de fenda" : "—" };
  if (n.includes("porca")) return { ...base, funcao: "Fixação roscada, trava o conjunto parafuso/eixo", ferramenta: "Chave combinada ou catraca" };
  if (n.includes("pressão")) return { ...base, funcao: "Evita afrouxamento por vibração" };
  if (n.includes("arruela")) return { ...base, funcao: "Distribui a carga de aperto e protege a superfície" };
  if (n.includes("pino cônico") || n.includes("pino elástico")) return { ...base, funcao: "Fixação/alinhamento entre eixo e componente acoplado", ferramenta: "Martelo e punção" };
  if (n.includes("pino")) return { ...base, funcao: "Alinhamento e posicionamento entre peças", ferramenta: "Martelo e punção" };
  if (n.includes("anel elástico") || n.includes("retenção")) return { ...base, funcao: "Retém componente axialmente sobre o eixo", ferramenta: "Alicate para anéis de retenção" };
  if (n.includes("anel de vedação")) return { ...base, funcao: "Veda e protege o mancal contra entrada de sujeira/perda de graxa" };
  if (n.includes("chaveta")) return { ...base, funcao: "Transmite torque entre eixo e componente acoplado" };
  if (n.includes("rolamento")) return { ...base, funcao: "Reduz atrito e suporta cargas radiais na rotação do eixo", ferramenta: "Extrator de rolamento", manutencao: "Lubrificação periódica, verificar ruído/folga" };
  if (n.includes("retentor")) return { ...base, funcao: "Veda o eixo, evitando vazamento de lubrificante e entrada de sujeira", manutencao: "Trocar se houver ressecamento ou vazamento" };
  if (n.includes("engrenagem")) return { ...base, funcao: "Transmite rotação/torque entre eixos", manutencao: "Lubrificação e inspeção de desgaste dos dentes" };

  return { ...base, funcao: "Componente de fixação/montagem padrão" };
}

function obterMetadados(nomeExibicao) {
  return METADADOS_PRINCIPAIS[nomeExibicao] || metadadosGenericos(nomeExibicao);
}

// =========================================================
// SETUP BÁSICO DA CENA
// =========================================================
const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, { stencil: true, antialias: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.031, 0.039, 0.051, 1);

const camera = new ArcRotateCamera("camera", -Math.PI / 2.5, Math.PI / 2.5, 3, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 0.3;
camera.upperRadiusLimit = 30;
camera.wheelPrecision = 60;

const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.intensity = 0.55;
hemi.groundColor = new Color3(0.25, 0.26, 0.3);

const dir = new DirectionalLight("dir", new Vector3(-0.6, -1.6, -0.8), scene);
dir.intensity = 0.9;
dir.position = new Vector3(5, 10, 5);

const fill = new DirectionalLight("fill", new Vector3(0.8, -1, 0.9), scene);
fill.intensity = 0.25;
fill.specular = new Color3(0, 0, 0);

const shadowGenerator = new ShadowGenerator(1024, dir);
shadowGenerator.usePercentageCloserFiltering = true;
shadowGenerator.darkness = 0.5;

scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
  "https://assets.babylonjs.com/environments/environmentSpecular.env",
  scene
);
scene.environmentIntensity = 1.1;
scene.imageProcessingConfiguration.exposure = 0.95;
scene.imageProcessingConfiguration.contrast = 1.05;

let ssaoPipeline = null;
let defaultPipeline = null;
function configurarRenderizacaoRealista() {
  ssaoPipeline = new SSAO2RenderingPipeline("ssao", scene, 0.5, [camera]);
  ssaoPipeline.radius = 1;
  ssaoPipeline.totalStrength = 0.7;
  ssaoPipeline.expensiveBlur = false;
  ssaoPipeline.samples = 8;

  defaultPipeline = new DefaultRenderingPipeline("padrao", true, scene, [camera]);
  defaultPipeline.samples = 2;
  defaultPipeline.fxaaEnabled = true;
  defaultPipeline.bloomEnabled = true;
  defaultPipeline.bloomThreshold = 0.85;
  defaultPipeline.bloomWeight = 0.1;
  defaultPipeline.sharpenEnabled = true;
  defaultPipeline.sharpen.edgeAmount = 0.22;
}
function ativarRenderizacaoRealista(ativo) {
  if (ssaoPipeline) ssaoPipeline.isEnabled = ativo;
  if (defaultPipeline) {
    defaultPipeline.bloomEnabled = ativo;
    defaultPipeline.sharpenEnabled = ativo;
    defaultPipeline.fxaaEnabled = ativo;
  }
}
configurarRenderizacaoRealista();

const highlightLayer = new HighlightLayer("hl", scene);

// =========================================================
// ESTADO GLOBAL
// =========================================================
let containerMaquina = null;
let gruposMontagem = []; 
let grupoSelecionado = null;
let fatorExplosaoAtual = 0;
let modoAtual = "livre"; 
let passoGuiadoAtual = 0;
let dragBehaviors = [];
let xrHelper = null;
let chao = null;

// =========================================================
// FUNÇÃO GLOBAL DE AJUSTE DE ROTAÇÃO (Console)
// =========================================================
window.ajustarRotacaoGraus = (xg = 0, yg = 0, zg = 0) => {
  if (!containerMaquina) {
    console.warn("Aguarde o modelo carregar antes de ajustar a rotação.");
    return;
  }

  const todasPartes = gruposMontagem.flatMap((g) => g.meshes);

  containerMaquina.rotation.set(
    (xg * Math.PI) / 180,
    (yg * Math.PI) / 180,
    (zg * Math.PI) / 180
  );

  containerMaquina.computeWorldMatrix(true);
  todasPartes.forEach((p) => p.computeWorldMatrix(true));

  const novaBbox = calcularBoundingBoxMeshes(todasPartes);
  containerMaquina.position.y -= novaBbox.min.y;

  containerMaquina.computeWorldMatrix(true);
  todasPartes.forEach((p) => p.computeWorldMatrix(true));

  const bboxFinal = calcularBoundingBoxMeshes(todasPartes);
  enquadrarCamera(bboxFinal);
  prepararExplosao(bboxFinal);

  console.log(`Rotação ajustada: X=${xg}° | Y=${yg}° | Z=${zg}°`);
};

// =========================================================
// MATERIAIS / ILUMINAÇÃO
// =========================================================
function aplicarAcabamentoEspelhado(grupos) {
  const processados = new Set();
  grupos.forEach((grupo) => {
    grupo.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat || processados.has(mat.uniqueId)) return;
      processados.add(mat.uniqueId);

      if (mat instanceof PBRMaterial) {
        mat.metallic = 1.0;
        mat.roughness = 0.05;
      } else if (mat.specularColor) {
        mat.specularColor = new Color3(1, 1, 1);
        mat.specularPower = 256;
      }
    });
  });

  window.ajustarAcabamento = (metallic = 1.0, roughness = 0.05) => {
    processados.clear();
    grupos.forEach((grupo) => {
      grupo.meshes.forEach((mesh) => {
        const mat = mesh.material;
        if (!mat || processados.has(mat.uniqueId)) return;
        processados.add(mat.uniqueId);
        if (mat instanceof PBRMaterial) {
          mat.metallic = metallic;
          mat.roughness = roughness;
        }
      });
    });
    console.log(`Acabamento ajustado: metallic=${metallic} roughness=${roughness}`);
  };
}

function calcularBoundingBoxMeshes(meshes) {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  meshes.forEach((p) => {
    const bb = p.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, bb.minimumWorld);
    max = Vector3.Maximize(max, bb.maximumWorld);
  });
  return { min, max, centro: min.add(max).scale(0.5), tamanho: max.subtract(min) };
}

const splash = document.getElementById("splash");
const splashProgressBar = document.getElementById("splash-progress-bar");
const splashProgressLabel = document.getElementById("splash-progress-label");
const btnIniciar = document.getElementById("btn-iniciar");

function atualizarProgressoSplash(evento) {
  if (evento.lengthComputable && evento.total > 0) {
    const pct = Math.min(100, Math.round((evento.loaded / evento.total) * 100));
    splashProgressBar.style.width = `${pct}%`;
    splashProgressLabel.textContent = `Carregando modelo... ${pct}%`;
  } else {
    const kb = (evento.loaded / 1024).toFixed(0);
    splashProgressLabel.textContent = `Carregando modelo... ${kb} KB`;
  }
}
function liberarBotaoIniciar() {
  splashProgressBar.style.width = "100%";
  splashProgressLabel.textContent = "Pronto!";
  btnIniciar.disabled = false;
  btnIniciar.textContent = "Iniciar Simulação";
}
btnIniciar.addEventListener("click", () => splash.classList.add("hidden"));

// =========================================================
// CARREGAMENTO DO MODELO
// =========================================================
async function carregarModelo() {
  try {
    const result = await SceneLoader.ImportMeshAsync("", CONFIG.modelPath, CONFIG.modelFile, scene, atualizarProgressoSplash);

    containerMaquina = MeshBuilder.CreateBox("containerMaquina", { size: 0.05 }, scene);
    containerMaquina.isVisible = false;
    result.meshes[0].setParent(containerMaquina);

    containerMaquina.rotation.set(CONFIG.correcaoRotacao.x, CONFIG.correcaoRotacao.y, CONFIG.correcaoRotacao.z);
    containerMaquina.scaling.set(CONFIG.escala, CONFIG.escala, CONFIG.escala);
    
    containerMaquina.computeWorldMatrix(true);
    result.meshes.forEach((m) => m.computeWorldMatrix(true));

    const raizImportada = result.meshes[0];
    gruposMontagem = raizImportada.getChildren(undefined, true)
      .map((node) => {
        const meshes = node.getChildMeshes().filter((m) => m.getTotalVertices() > 0);
        if (meshes.length === 0) return null;
        return {
          node,
          nomeOriginal: node.name,
          nomeExibicao: limparNomePeca(node.name),
          meshes
        };
      })
      .filter(Boolean);

    const todasPartes = gruposMontagem.flatMap((g) => g.meshes);
    todasPartes.forEach((mesh) => {
      shadowGenerator.addShadowCaster(mesh);
      mesh.receiveShadows = true;
    });

    // Assentamento preciso no piso (Y = 0)
    let bbox = calcularBoundingBoxMeshes(todasPartes);
    containerMaquina.position.y -= bbox.min.y;
    
    containerMaquina.computeWorldMatrix(true);
    todasPartes.forEach((p) => p.computeWorldMatrix(true));
    bbox = calcularBoundingBoxMeshes(todasPartes);

    enquadrarCamera(bbox);
    aplicarAcabamentoEspelhado(gruposMontagem);

    prepararExplosao(bbox);
    prepararModoLivre();
    prepararSelecaoPorClique();
    popularPainelPecas();

    liberarBotaoIniciar();
    console.log(`Modelo carregado: ${gruposMontagem.length} grupos de montagem.`);
    console.log("%cDica: Digite ajustarRotacaoGraus(x, y, z) no console para reorientar.", "color:#4fd1c5");

  } catch (err) {
    console.error("Erro ao carregar modelo:", err);
    splashProgressLabel.textContent = "Erro ao carregar modelo.";
  }
}

function enquadrarCamera(bbox) {
  const tamanho = bbox.tamanho.length();
  camera.setTarget(bbox.centro);
  camera.radius = Math.max(tamanho * 1.8, 1.2);
}

// =========================================================
// EXPLOSÃO
// =========================================================
function prepararExplosao(bboxGeral) {
  const centroGeral = bboxGeral.centro;
  const inversaContainer = containerMaquina.getWorldMatrix().invert();

  gruposMontagem.forEach((grupo) => {
    const bboxGrupo = calcularBoundingBoxMeshes(grupo.meshes);
    const centroGrupo = bboxGrupo.centro;
    let direcao = centroGrupo.subtract(centroGeral);
    if (direcao.length() < 0.0001) direcao = new Vector3(0, 1, 0);
    direcao.normalize();
    direcao = Vector3.TransformNormal(direcao, inversaContainer).normalize();

    const nomeLower = grupo.nomeExibicao.toLowerCase();
    const ehPecaPequena = CONFIG.pecasPequenasKeywords.some((kw) => nomeLower.includes(kw));
    const distancia = (ehPecaPequena
      ? CONFIG.distanciaExplosaoPadrao * CONFIG.multiplicadorPecaPequena
      : CONFIG.distanciaExplosaoPadrao) * CONFIG.escala;

    grupo.posicaoOriginal = grupo.node.position.clone();
    grupo.direcao = direcao;
    grupo.distancia = distancia;
  });
}

function aplicarExplosao(fator) {
  fatorExplosaoAtual = fator;
  gruposMontagem.forEach((g) => {
    g.node.position = g.posicaoOriginal.add(g.direcao.scale(fator * g.distancia));
  });
}

function animarExplosaoPara(fatorAlvo, duracaoFrames = 30) {
  const easing = new CubicEase();
  easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  const anim = new Animation("explodeAnim", "_f", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
  anim.setEasingFunction(easing);
  anim.setKeys([{ frame: 0, value: fatorExplosaoAtual }, { frame: duracaoFrames, value: fatorAlvo }]);
  const proxy = { _f: fatorExplosaoAtual };
  scene.beginDirectAnimation(proxy, [anim], 0, duracaoFrames, false, 1, () => aplicarExplosao(fatorAlvo));
  const obs = scene.onBeforeRenderObservable.add(() => {
    aplicarExplosao(proxy._f);
    if (Math.abs(proxy._f - fatorAlvo) < 0.001) scene.onBeforeRenderObservable.remove(obs);
  });
}

// =========================================================
// MODO LIVRE
// =========================================================
function prepararModoLivre() {
  gruposMontagem.forEach((grupo) => {
    grupo.meshes.forEach((mesh) => {
      const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) });
      dragBehavior.moveAttached = false;
      dragBehavior.onDragObservable.add((evento) => {
        grupo.node.position.addInPlace(evento.delta);
      });
      mesh.addBehavior(dragBehavior);
      dragBehaviors.push({ mesh, behavior: dragBehavior });
    });
  });
  setDragEnabled(true);
}
function setDragEnabled(ativo) {
  dragBehaviors.forEach(({ behavior }) => (behavior.enabled = ativo));
}

// =========================================================
// SELEÇÃO / PAINEL
// =========================================================
const painelPecasLista = document.getElementById("pecas-lista");
const painelPecasContador = document.getElementById("pecas-contador");
const fichaTecnica = document.getElementById("ficha-tecnica");
const btnFecharFicha = document.getElementById("btn-fechar-ficha");

function popularPainelPecas() {
  painelPecasLista.innerHTML = "";
  gruposMontagem.forEach((grupo, indice) => {
    const item = document.createElement("div");
    item.className = "peca-item";
    item.textContent = grupo.nomeExibicao;
    item.dataset.indice = indice;
    item.addEventListener("click", () => selecionarGrupo(grupo));
    painelPecasLista.appendChild(item);
  });
  painelPecasContador.textContent = `0 / ${gruposMontagem.length} componentes`;
}

let contadorIdentificadas = new Set();

function selecionarGrupo(grupo) {
  highlightLayer.removeAllMeshes();
  grupo.meshes.forEach((m) => highlightLayer.addMesh(m, Color3.FromHexString("#4fd1c5")));
  grupoSelecionado = grupo;

  contadorIdentificadas.add(grupo.nomeOriginal);
  painelPecasContador.textContent = `${contadorIdentificadas.size} / ${gruposMontagem.length} componentes`;

  document.querySelectorAll(".peca-item").forEach((el) => el.classList.remove("selecionada"));
  const indice = gruposMontagem.indexOf(grupo);
  const item = painelPecasLista.querySelector(`[data-indice="${indice}"]`);
  if (item) {
    item.classList.add("selecionada");
    item.scrollIntoView({ block: "nearest" });
  }

  const meta = obterMetadados(grupo.nomeExibicao);
  document.getElementById("ficha-nome").textContent = grupo.nomeExibicao;
  document.getElementById("ficha-funcao").textContent = meta.funcao;
  document.getElementById("ficha-material").textContent = meta.material;
  document.getElementById("ficha-norma").textContent = meta.norma;
  document.getElementById("ficha-torque").textContent = meta.torque;
  document.getElementById("ficha-ferramenta").textContent = meta.ferramenta;
  document.getElementById("ficha-manutencao").textContent = meta.manutencao;
  fichaTecnica.classList.remove("hidden");
}

function fecharFicha() {
  fichaTecnica.classList.add("hidden");
  highlightLayer.removeAllMeshes();
  grupoSelecionado = null;
  document.querySelectorAll(".peca-item").forEach((el) => el.classList.remove("selecionada"));
}
btnFecharFicha.addEventListener("click", fecharFicha);

function prepararSelecaoPorClique() {
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
    const mesh = pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh;
    if (!mesh) return;
    const grupo = gruposMontagem.find((g) => g.meshes.includes(mesh));
    if (grupo) selecionarGrupo(grupo);
  });
}

// =========================================================
// MODO DE INTERAÇÃO
// =========================================================
function setModo(modo) {
  modoAtual = modo;
  document.querySelectorAll(".mode-btn").forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`btn-${modo}`).classList.add("active");

  document.getElementById("explode-panel").classList.toggle("show", modo === "explodido");
  document.getElementById("guided-panel").classList.toggle("show", modo === "guiado");

  setDragEnabled(modo === "livre");

  if (modo === "livre") {
    animarExplosaoPara(0);
  } else if (modo === "explodido") {
    const slider = document.getElementById("explode-slider");
    animarExplosaoPara(Number(slider.value) / 100);
  } else if (modo === "guiado") {
    irParaPassoGuiado(0);
  }
}

function irParaPassoGuiado(indice) {
  if (!gruposMontagem.length) return;
  passoGuiadoAtual = Math.max(0, Math.min(indice, gruposMontagem.length - 1));
  gruposMontagem.forEach((grupo, i) => {
    const distante = i > passoGuiadoAtual;
    const alvo = distante ? grupo.posicaoOriginal.add(grupo.direcao.scale(grupo.distancia)) : grupo.posicaoOriginal;
    Animation.CreateAndStartAnimation(`passo_${i}`, grupo.node, "position", 30, 20, grupo.node.position, alvo, Animation.ANIMATIONLOOPMODE_CONSTANT);
  });
  const grupoAtual = gruposMontagem[passoGuiadoAtual];
  document.getElementById("guided-step-label").textContent = `Passo ${passoGuiadoAtual + 1} de ${gruposMontagem.length}: ${grupoAtual.nomeExibicao}`;
  selecionarGrupo(grupoAtual);
}

function resetarTudo() {
  animarExplosaoPara(0);
  document.getElementById("explode-slider").value = 0;
  gruposMontagem.forEach((g) => {
    Animation.CreateAndStartAnimation("resetPos", g.node, "position", 30, 20, g.node.position, g.posicaoOriginal, Animation.ANIMATIONLOOPMODE_CONSTANT);
  });
  fecharFicha();
  setModo("livre");
}

document.getElementById("btn-livre").addEventListener("click", () => setModo("livre"));
document.getElementById("btn-guiado").addEventListener("click", () => setModo("guiado"));
document.getElementById("btn-explodido").addEventListener("click", () => setModo("explodido"));
document.getElementById("btn-reset").addEventListener("click", resetarTudo);
document.getElementById("btn-prev-step").addEventListener("click", () => irParaPassoGuiado(passoGuiadoAtual - 1));
document.getElementById("btn-next-step").addEventListener("click", () => irParaPassoGuiado(passoGuiadoAtual + 1));
document.getElementById("explode-slider").addEventListener("input", (e) => aplicarExplosao(Number(e.target.value) / 100));

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key.toLowerCase() === "e") {
    setModo("explodido");
    document.getElementById("explode-slider").value = 100;
    animarExplosaoPara(1);
  } else if (e.key.toLowerCase() === "r") {
    resetarTudo();
  }
});

// =========================================================
// WEBXR
// =========================================================
const btnVR = document.getElementById("btn-vr");
const btnAR = document.getElementById("btn-ar");
const xrStatus = document.getElementById("xr-status");

async function configurarXR() {
  if (!navigator.xr) {
    btnVR.disabled = true;
    btnAR.disabled = true;
    xrStatus.textContent = "WebXR indisponível neste navegador";
    return;
  }
  try {
    xrHelper = await scene.createDefaultXRExperienceAsync({
      floorMeshes: chao ? [chao] : [],
      disableDefaultUI: true,
      disableTeleportation: false,
      optionalFeatures: true
    });
    if (!xrHelper || !xrHelper.baseExperience) throw new Error("baseExperience ausente.");

    xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      if (state === 2) {
        xrStatus.textContent = "Sessão XR ativa";
        ativarRenderizacaoRealista(false);
      } else if (state === 0) {
        xrStatus.textContent = "";
        ativarRenderizacaoRealista(true);
      }
    });

    const vrSuportado = await verificarSuporteXR("immersive-vr");
    const arSuportado = await verificarSuporteXR("immersive-ar");
    btnVR.disabled = !vrSuportado;
    btnAR.disabled = !arSuportado;
  } catch (err) {
    console.warn("WebXR não disponível:", err.message || err);
    btnVR.disabled = true;
    btnAR.disabled = true;
    xrStatus.textContent = "WebXR indisponível neste navegador";
  }
}

async function verificarSuporteXR(modo) {
  if (!navigator.xr || !navigator.xr.isSessionSupported) return false;
  try { return await navigator.xr.isSessionSupported(modo); } catch { return false; }
}

async function entrarXR(modo) {
  if (!xrHelper) return;
  try {
    xrStatus.textContent = "Iniciando sessão...";
    await xrHelper.baseExperience.enterXRAsync(modo, "local-floor", xrHelper.renderTarget);
  } catch (err) {
    xrStatus.textContent = `Não foi possível iniciar ${modo === "immersive-ar" ? "RA" : "RV"}`;
  }
}

btnVR.addEventListener("click", () => entrarXR("immersive-vr"));
btnAR.addEventListener("click", () => entrarXR("immersive-ar"));

// =========================================================
// MANUAL
// =========================================================
const btnManual = document.getElementById("btn-manual");
const btnFecharManual = document.getElementById("btn-fechar-manual");
const manualOverlay = document.getElementById("manual-overlay");
const manualIframe = document.getElementById("manual-iframe");
const manualErro = document.getElementById("manual-erro");

async function abrirManual() {
  manualOverlay.classList.remove("hidden");
  manualErro.classList.add("hidden");
  manualIframe.classList.remove("hidden");
  try {
    const resposta = await fetch(CONFIG.manualPdf, { method: "HEAD" });
    if (!resposta.ok) throw new Error("PDF não encontrado");
    manualIframe.src = CONFIG.manualPdf;
  } catch {
    manualIframe.classList.add("hidden");
    manualErro.classList.remove("hidden");
  }
}
function fecharManual() {
  manualOverlay.classList.add("hidden");
  manualIframe.src = "";
}
btnManual.addEventListener("click", abrirManual);
btnFecharManual.addEventListener("click", fecharManual);
manualOverlay.addEventListener("click", (e) => { if (e.target === manualOverlay) fecharManual(); });

// =========================================================
// EXECUÇÃO INICIAL
// =========================================================
carregarModelo().then(() => configurarXR());
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

// =========================================================
// CONTROLE DE VISIBILIDADE DO MENU (TOGGLE)
// =========================================================
const hudMenu = document.getElementById("hud");
const btnToggleMenu = document.getElementById("btn-toggle-menu");
const btnCloseMenu = document.getElementById("btn-close-menu");

function alternarMenu() {
  if (hudMenu) {
    hudMenu.classList.toggle("collapsed");
  }
}

// Vincula os cliques dos botões
if (btnToggleMenu) {
  btnToggleMenu.addEventListener("click", (e) => {
    e.stopPropagation(); // Impede o clique de passar para o Canvas do Babylon.js
    alternarMenu();
  });
}

if (btnCloseMenu) {
  btnCloseMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    alternarMenu();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;

  if (e.key.toLowerCase() === "m") {
    // Se pelo menos um estiver visível, recolhe ambos. Senão, mostra ambos.
    const algumVisivel = !hudMenu?.classList.contains("collapsed") || !pecasPanel?.classList.contains("collapsed");

    if (algumVisivel) {
      hudMenu?.classList.add("collapsed");
      pecasPanel?.classList.add("collapsed");
    } else {
      hudMenu?.classList.remove("collapsed");
      pecasPanel?.classList.remove("collapsed");
    }
  } 


});

// =========================================================
// CONTROLE DO PAINEL DE PEÇAS (DIREITA)
// =========================================================
const pecasPanel = document.getElementById("pecas-panel");
const btnTogglePecas = document.getElementById("btn-toggle-pecas");
const btnClosePecas = document.getElementById("btn-close-pecas");

function alternarPainelPecas() {
  if (pecasPanel) {
    pecasPanel.classList.toggle("collapsed");
  }
}

if (btnTogglePecas) {
  btnTogglePecas.addEventListener("click", (e) => {
    e.stopPropagation();
    alternarPainelPecas();
  });
}

if (btnClosePecas) {
  btnClosePecas.addEventListener("click", (e) => {
    e.stopPropagation();
    alternarPainelPecas();
  });
}

// Atalho de teclado opcional (tecla 'P') para ocultar/exibir
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key.toLowerCase() === "p") {
    alternarPainelPecas();
  }
});