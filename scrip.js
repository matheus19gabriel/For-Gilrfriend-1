console.log("scrip.js carregou");


//  Botões SIM / NÃO


(function () {
    try {
        const perg = document.getElementById("perg");
        const surpresa = document.getElementById("surpresa");
        const ameaca = document.getElementById("ameaca");
        const btnSim = document.getElementById("btn-sim");
        const btnNao = document.getElementById("btn-nao");
        const esconde = document.getElementById("esconde");

        let fugas = 0;

        // SIM: esconde a pergunta, a ameaça e o coração; mostra a surpresa
        btnSim.addEventListener("click", () => {
            perg.classList.add("escondido");
            ameaca.classList.add("escondido");
            esconde.classList.add("escondido");
            surpresa.classList.remove("escondido");
            window.scrollTo(0, 0);

            // Monta o título em partículas (se falhar, o texto normal continua visível)
            try {
                if (window.iniciarTitulo) window.iniciarTitulo();
            } catch (erro) {
                console.error("Erro no título em partículas:", erro);
            }
        });

        // NÃO: foge nos primeiros cliques e, no 5º, some e mostra a ameaça
        btnNao.addEventListener("click", () => {
            fugas++;

            if (fugas >= 5) {
                btnNao.style.display = "none";
                ameaca.classList.remove("escondido");
                return;
            }

            const maxX = window.innerWidth - btnNao.offsetWidth;
            const maxY = window.innerHeight - btnNao.offsetHeight;

            btnNao.style.position = "fixed";
            btnNao.style.left = Math.random() * maxX + "px";
            btnNao.style.top = Math.random() * maxY + "px";
        });
    } catch (erro) {
        console.error("Erro nos botões SIM/NÃO:", erro);
    }
})();



//  Livro: monta as páginas a partir do #conteudo 




(function () {
    try {
        const conteudo = document.getElementById("conteudo");
        const livro = document.querySelector(".livro");
        const capa = document.getElementById("capa");
        const folha = document.getElementById("folha");
        const btnAnt = document.getElementById("btn-ant");
        const btnProx = document.getElementById("btn-prox");
        const contador = document.getElementById("contador");

        // Cada foto abre uma página; fotos seguidas ficam juntas na mesma página
        const paginas = [];
        let atual = null;
        let ultimoFoiImg = false;

        Array.from(conteudo.children).forEach((el) => {
            const ehImg = el.tagName === "IMG";
            if (ehImg && (!atual || !ultimoFoiImg)) {
                atual = { imgs: [], resto: [] };
                paginas.push(atual);
            }
            if (!atual) {
                atual = { imgs: [], resto: [] };
                paginas.push(atual);
            }
            (ehImg ? atual.imgs : atual.resto).push(el.cloneNode(true));
            ultimoFoiImg = ehImg;
        });

        let indice = 0;
        let ocupado = false;

        function mostrar(i) {
            indice = i;
            folha.innerHTML = "";

            const pag = paginas[i];
            if (pag.imgs.length) {
                const div = document.createElement("div");
                div.className = "fotos";
                pag.imgs.forEach((img) => div.appendChild(img.cloneNode(true)));
                folha.appendChild(div);
            }
            pag.resto.forEach((el) => folha.appendChild(el.cloneNode(true)));

            folha.scrollTop = 0;
            contador.textContent = (i + 1) + " / " + paginas.length;
            btnAnt.disabled = i === 0;
            btnProx.disabled = i === paginas.length - 1;
        }

        // dir = 1 (próxima) ou -1 (anterior): a folha "vira", troca o conteúdo e volta
        function virar(dir) {
            const novo = indice + dir;
            if (ocupado || novo < 0 || novo >= paginas.length) return;
            ocupado = true;

            folha.style.transform = "rotateY(" + (-90 * dir) + "deg)";
            setTimeout(() => {
                mostrar(novo);
                folha.style.transition = "none";
                folha.style.transform = "rotateY(" + (90 * dir) + "deg)";
                folha.offsetWidth; // força o navegador a aplicar o estilo
                folha.style.transition = "";
                folha.style.transform = "rotateY(0deg)";
                setTimeout(() => { ocupado = false; }, 400);
            }, 400);
        }

        capa.addEventListener("click", () => livro.classList.add("aberto"));
        btnProx.addEventListener("click", () => virar(1));
        btnAnt.addEventListener("click", () => virar(-1));

        mostrar(0);
    } catch (erro) {
        console.error("Erro no livro:", erro);
    }
})();



//  3) Confete: canhões embaixo, sobe em arco e cai com gravidade



(function () {
    try {
        const canvas = document.createElement("canvas");
        canvas.style.cssText =
            "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");

        let L = 0, A = 0;
        function ajustar() {
            L = canvas.width = window.innerWidth;
            A = canvas.height = window.innerHeight;
        }
        ajustar();
        window.addEventListener("resize", ajustar);

        const cores = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff9a1a", "#ff66c4"];
        let pecas = [];
        let rodando = false;

        // angulo em graus: 90 = reto para cima, menor que 90 = inclinado para a direita
        function criar(origemX, anguloMin, anguloMax) {
            const ang = (anguloMin + Math.random() * (anguloMax - anguloMin)) * Math.PI / 180;
            return {
                x: origemX + (Math.random() - 0.5) * 20,
                y: A + 10,                                      // nasce logo abaixo da tela
                ang: ang,
                vel: A * 0.055 * (0.5 + Math.random() * 2.00),  // força do disparo
                decay: 0.91 + Math.random() * 0.02,             // resistência do ar
                queda: 0,                                       // velocidade de queda (gravidade)
                maxQueda: 2 + Math.random() * 2.5,              // velocidade máxima de queda
                w: 7 + Math.random() * 5,
                h: 5 + Math.random() * 4,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.3,
                inclin: Math.random() * Math.PI * 2,            // balanço do papel no ar
                vinclin: 0.08 + Math.random() * 0.14,
                cor: cores[Math.floor(Math.random() * cores.length)]
            };
        }

        function quadro() {
            ctx.clearRect(0, 0, L, A);

            pecas.forEach((p) => {
                p.vel *= p.decay;
                p.queda = Math.min(p.queda + 0.1, p.maxQueda);
                p.inclin += p.vinclin;
                p.rot += p.vrot;

                p.x += Math.cos(p.ang) * p.vel + Math.sin(p.inclin) * 0.8;
                p.y += -Math.sin(p.ang) * p.vel + p.queda;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.scale(1, Math.cos(p.inclin)); // simula o papelzinho virando no ar
                ctx.fillStyle = p.cor;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            // some quando passa da borda de baixo
            pecas = pecas.filter((p) => p.y < A + 60);

            if (pecas.length) {
                requestAnimationFrame(quadro);
            } else {
                rodando = false;
                ctx.clearRect(0, 0, L, A);
            }
        }

        // qtd = total de pedacinhos, dividido entre os dois canhões e em estouros seguidos
        window.dispararConfete = function (qtd) {
            qtd = qtd || 400;
            ajustar(); // garante o tamanho certo da tela na hora do disparo
            const ondas = 4;
            for (let w = 0; w < ondas; w++) {
                setTimeout(() => {
                    const n = Math.round(qtd / ondas / 2);
                    for (let i = 0; i < n; i++) {
                        pecas.push(criar(L * 0.04, 50, 85));   // canhão esquerdo, mira para a direita
                        pecas.push(criar(L * 0.96, 95, 130));  // canhão direito, mira para a esquerda
                    }
                    if (!rodando) {
                        rodando = true;
                        requestAnimationFrame(quadro);
                    }
                }, w * 200);
            }
            console.log("Confete disparado!");
        };

        // Única rajada: ao abrir a página
        setTimeout(() => window.dispararConfete(100), 600);
    } catch (erro) {
        console.error("Erro no confete:", erro);
    }
})();




//  Gato laranja: baixa a animação, troca as cores e recarrega




(function () {
    try {
        const URL_GATO = "https://lottie.host/8cf4ba71-e5fb-44f3-8134-178c4d389417/0CCsdcgNIP.json";

        // Cores no formato do Lottie: [vermelho, verde, azul] de 0 a 1
        const TROCAS_GATO = [
            { de: [1, 0.4, 0.7686],         para: [1, 0.6, 0.1] },      // corpo, patas e rabo: rosa -> laranja
            { de: [0.7451, 0.0118, 0.4627], para: [0.85, 0.38, 0.05] } // orelhas: magenta -> laranja escuro
        ];

        function mesmaCor(a, b) {
            return Array.isArray(a) && a.length >= 3 &&
                [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) < 0.002);
        }

        function recolorir(no) {
            if (Array.isArray(no)) {
                no.forEach(recolorir);
            } else if (no && typeof no === "object") {
                if (no.c && Array.isArray(no.c.k)) {
                    TROCAS_GATO.forEach((t) => {
                        if (mesmaCor(no.c.k, t.de)) no.c.k = t.para.slice();
                    });
                }
                Object.values(no).forEach(recolorir);
            }
        }

        async function deixarGatoLaranja() {
            const gato = document.querySelector(".gato");
            if (!gato) return;
            try {
                await customElements.whenDefined("lottie-player");
                const resposta = await fetch(URL_GATO);
                const dados = await resposta.json();
                recolorir(dados);
                gato.load(dados);
                console.log("Gato recolorido!");
            } catch (erro) {
                console.warn("Não foi possível recolorir o gato, mantendo a cor original.", erro);
            }
        }
        deixarGatoLaranja();
    } catch (erro) {
        console.error("Erro no gato:", erro);
    }
})();




//  Título em partículas (h1 + h2 do início da surpresa) 




(function () {
    try {
        // Ajustes
        const OPC = {
            maxParticulas: 30000,        // quantidade máxima de partículas
            tamanho: 1,                  // tamanho de cada partícula (1 = 1 pixel de tela)
            repulsao: 350,               // força com que o mouse empurra
            influenciaVelocidade: 10000, // quanto a velocidade do mouse joga as partículas
            aleatoriedade: 0.4,          // variação aleatória da força
            raioMouse: 80,               // alcance do mouse, em pixels
            mola: 30,                    // força que puxa de volta para o lugar
            amortecimento: 0.99,         // atrito (menor = para mais rápido)
            montarAoAparecer: false      // true = as partículas se juntam quando a tela abre
        };

        const secao = document.getElementById("surpresa");
        const tituloH1 = secao.querySelector("h1");
        const tituloH2 = secao.querySelector("h2");
        if (!tituloH1 || !tituloH2) throw new Error("Não achei o h1 e o h2 dentro de #surpresa");

        // Envolve o h1 e o h2 em uma caixa e coloca o canvas das partículas por cima
        const caixa = document.createElement("div");
        caixa.style.cssText = "position:relative;";
        tituloH1.parentNode.insertBefore(caixa, tituloH1);
        caixa.append(tituloH1, tituloH2);

        const tela = document.createElement("canvas");
        tela.style.cssText = "position:absolute;left:0;pointer-events:none;";
        caixa.append(tela);
        const ctxT = tela.getContext("2d");

        const coresOriginais = new Map();
        const MARGEM = 50; // folga em cima e embaixo para as partículas voarem para fora do texto

        let dpr = 1, W = 0, H = 0, N = 0, tam = 1;
        let pos, og, vel, cor, imagem, buffer;
        let idAnimacao = 0, tempoAnterior = 0;
        let mouseTela = null;   // posição do mouse/dedo na janela
        let mouseAnterior = null;

        // Quebra o texto em linhas, como o navegador faz
        function quebrarLinhas(c, texto, larguraMax) {
            const palavras = texto.trim().split(/\s+/);
            const linhas = [];
            let linha = "";
            palavras.forEach((p) => {
                const teste = linha ? linha + " " + p : p;
                if (linha && c.measureText(teste).width > larguraMax) {
                    linhas.push(linha);
                    linha = p;
                } else {
                    linha = teste;
                }
            });
            if (linha) linhas.push(linha);
            return linhas;
        }

        function montar() {
            cancelAnimationFrame(idAnimacao);

            const caixaRect = caixa.getBoundingClientRect();
            if (caixaRect.width === 0) return; // a tela da surpresa ainda está escondida

            dpr = Math.min(window.devicePixelRatio || 1, 2);
            const cssW = caixaRect.width;
            const cssH = caixaRect.height + 2 * MARGEM;
            W = Math.round(cssW * dpr);
            H = Math.round(cssH * dpr);

            tela.style.top = -MARGEM + "px";
            tela.style.width = cssW + "px";
            tela.style.height = cssH + "px";
            tela.width = W;
            tela.height = H;

            // Desenha os textos num canvas escondido para descobrir onde ficam os pontos
            const fora = document.createElement("canvas");
            fora.width = W;
            fora.height = H;
            const o = fora.getContext("2d", { willReadFrequently: true });
            o.scale(dpr, dpr);

            [tituloH1, tituloH2].forEach((el) => {
                if (!coresOriginais.has(el)) coresOriginais.set(el, getComputedStyle(el).color);
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();

                o.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
                o.fillStyle = coresOriginais.get(el);
                o.textAlign = "center";
                o.textBaseline = "middle";

                const linhas = quebrarLinhas(o, el.textContent, r.width);
                const alturaLinha = r.height / linhas.length;
                linhas.forEach((linha, i) => {
                    o.fillText(
                        linha,
                        r.left - caixaRect.left + r.width / 2,
                        MARGEM + (r.top - caixaRect.top) + alturaLinha * (i + 0.5)
                    );
                });
            });

            // Lê os pixels desenhados: cada pixel com tinta vira uma partícula
            const dados = o.getImageData(0, 0, W, H).data;
            let total = 0;
            for (let i = 3; i < dados.length; i += 4) if (dados[i] > 30) total++;

            const indices = new Uint32Array(total);
            let k = 0;
            for (let i = 0; i < W * H; i++) if (dados[i * 4 + 3] > 30) indices[k++] = i;

            // Sorteia no máximo "maxParticulas" pontos
            N = Math.min(total, OPC.maxParticulas);
            for (let i = 0; i < N; i++) {
                const j = i + Math.floor(Math.random() * (total - i));
                const t = indices[i]; indices[i] = indices[j]; indices[j] = t;
            }
            if (N === 0) throw new Error("Nenhum pixel de texto encontrado");

            pos = new Float32Array(N * 2);
            og = new Float32Array(N * 2);
            vel = new Float32Array(N * 2);
            cor = new Uint32Array(N);

            for (let i = 0; i < N; i++) {
                const p = indices[i];
                const x = p % W;
                const y = (p / W) | 0;
                og[i * 2] = x;
                og[i * 2 + 1] = y;

                if (OPC.montarAoAparecer) {
                    pos[i * 2] = x + (Math.random() - 0.5) * 300 * dpr;
                    pos[i * 2 + 1] = y + (Math.random() - 0.5) * 160 * dpr;
                } else {
                    pos[i * 2] = x;
                    pos[i * 2 + 1] = y;
                }

                const r = dados[p * 4], g = dados[p * 4 + 1], b = dados[p * 4 + 2], a = dados[p * 4 + 3];
                cor[i] = (a << 24) | (b << 16) | (g << 8) | r;
            }

            tam = Math.max(1, Math.round(dpr * OPC.tamanho));
            imagem = ctxT.createImageData(W, H);
            buffer = new Uint32Array(imagem.data.buffer);

            // Esconde o texto real (continua na página, só fica transparente)
            tituloH1.style.color = "transparent";
            tituloH2.style.color = "transparent";

            tempoAnterior = performance.now();
            idAnimacao = requestAnimationFrame(quadroTitulo);
        }

        function quadroTitulo(agora) {
            const dtMs = Math.max(1, agora - tempoAnterior);
            tempoAnterior = agora;
            const dt = Math.min(dtMs / 1000, 0.01);

            // Mouse relativo ao canvas, em pixels do canvas
            let temMouse = false, mx = 0, my = 0, velMag = 0, nvx = 0, nvy = 0;
            if (mouseTela) {
                const r = tela.getBoundingClientRect();
                mx = (mouseTela.x - r.left) * dpr;
                my = (mouseTela.y - r.top) * dpr;
                temMouse = true;
                if (mouseAnterior) {
                    const dx = mx - mouseAnterior.x;
                    const dy = my - mouseAnterior.y;
                    const dist = Math.hypot(dx, dy);
                    velMag = dist / dtMs; // pixels por milissegundo
                    if (dist > 0) { nvx = dx / dist; nvy = dy / dist; }
                }
                mouseAnterior = { x: mx, y: my };
            } else {
                mouseAnterior = null;
            }

            const R = OPC.raioMouse * dpr;
            const R2 = R * R;

            for (let i = 0; i < N; i++) {
                const i2 = i * 2;
                let px = pos[i2], py = pos[i2 + 1];
                let vx = vel[i2], vy = vel[i2 + 1];

                // 1) O mouse empurra as partículas para longe
                if (temMouse) {
                    const dx = px - mx, dy = py - my;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < R2 && d2 > 0.0001) {
                        const dist = Math.sqrt(d2);
                        const forca = Math.min(1, 1 - dist / R);
                        const kr = forca * OPC.repulsao * dt *
                            (1 + OPC.aleatoriedade * (2 * Math.random() - 1)) / dist;
                        vx += dx * kr;
                        vy += dy * kr;

                        // ...e a velocidade do mouse joga as partículas na direção do movimento
                        if (velMag > 0.01) {
                            const kv = forca * OPC.influenciaVelocidade * dt * Math.sqrt(velMag) *
                                (1 + OPC.aleatoriedade * (2 * Math.random() - 1));
                            vx += nvx * kv;
                            vy += nvy * kv;
                        }
                    }
                }

                // 2) Mola: puxa de volta para a posição original
                const tx = og[i2] - px, ty = og[i2 + 1] - py;
                const t2 = tx * tx + ty * ty;
                if (t2 > 0.0001) {
                    const d = Math.sqrt(t2);
                    const molaForca = Math.min(1 - d, -1);
                    const km = molaForca * OPC.mola * dt / d;
                    vx -= tx * km;
                    vy -= ty * km;
                }

                // 3) Movimento e atrito
                px += vx * dt;
                py += vy * dt;
                vx *= OPC.amortecimento;
                vy *= OPC.amortecimento;

                pos[i2] = px; pos[i2 + 1] = py;
                vel[i2] = vx; vel[i2 + 1] = vy;
            }

            // Desenha todas as partículas de uma vez
            buffer.fill(0);
            for (let i = 0; i < N; i++) {
                const ix = pos[i * 2] | 0;
                const iy = pos[i * 2 + 1] | 0;
                if (ix < 0 || iy < 0 || ix > W - tam || iy > H - tam) continue;
                const c = cor[i];
                for (let dy = 0; dy < tam; dy++) {
                    const base = (iy + dy) * W + ix;
                    for (let dx = 0; dx < tam; dx++) buffer[base + dx] = c;
                }
            }
            ctxT.putImageData(imagem, 0, 0);

            idAnimacao = requestAnimationFrame(quadroTitulo);
        }

        // Mouse e dedo
        window.addEventListener("mousemove", (e) => {
            mouseTela = { x: e.clientX, y: e.clientY };
        });
        const tocar = (e) => {
            const t = e.touches[0];
            if (t) mouseTela = { x: t.clientX, y: t.clientY };
        };
        window.addEventListener("touchstart", tocar, { passive: true });
        window.addEventListener("touchmove", tocar, { passive: true });
        window.addEventListener("touchend", () => { mouseTela = null; });
        window.addEventListener("touchcancel", () => { mouseTela = null; });
        document.addEventListener("mouseleave", () => { mouseTela = null; });

        // Se a janela mudar de tamanho, recalcula as partículas
        let esperaResize = 0;
        window.addEventListener("resize", () => {
            clearTimeout(esperaResize);
            esperaResize = setTimeout(() => {
                try { montar(); } catch (erro) { console.error("Erro no título em partículas:", erro); }
            }, 250);
        });

        window.iniciarTitulo = montar; // chamado quando você clica em SIM
        console.log("Título em partículas pronto");
    } catch (erro) {
        console.error("Erro no título em partículas:", erro);
    }
})();