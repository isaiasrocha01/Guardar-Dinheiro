// ================= REFERÊNCIAS DOM =================
const metaEl = document.getElementById('meta');
const mesEl = document.getElementById('mes');
const anoEl = document.getElementById('ano');
const lista = document.getElementById('lista');
const guardadoEl = document.getElementById('guardado');
const faltaEl = document.getElementById('falta');
const percentEl = document.getElementById('percent');
const barra = document.getElementById('barra');
const graficoEl = document.getElementById('grafico');
const mostrarMetaEl = document.getElementById('mostrarMeta');
const descricaoGastoEl = document.getElementById('descricaoGasto');
const valorEl = document.getElementById('valor');
const listaGastosEl = document.getElementById('listaGastos');
const tipoAdicionarEl = document.getElementById("tipoAdicionar");
const camposGuardado = document.getElementById("camposGuardado");
const camposGasto = document.getElementById("camposGasto");
const btnAdicionar = document.getElementById("btnAdicionar");
const btnExport = document.getElementById("btnExport");

let meses = [];
let gastos = [];
let grafico;

const mesesReferencia = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ================= ADICIONAR =================
function adicionar() {
    const tipo = tipoAdicionarEl.value;
    if (tipo === "guardado") addMes();
    else if (tipo === "gasto") addGasto();
}

function addMes() {
    const mes = mesEl.value;
    const ano = anoEl.value;
    const valor = parseFloat(valorEl.value);

    if (!mes || !ano || isNaN(valor) || valor <= 0) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    const nome = `${mes} / ${ano}`;
    if (meses.find(m => m.nome === nome)) {
        alert("Esse mês já existe!");
        return;
    }

    meses.push({
        nome,
        valor,
        pago: false,
        mesIdx: mesesReferencia.indexOf(mes),
        anoNum: parseInt(ano)
    });

    valorEl.value = "";
    salvar();
    render();
}

function addGasto() {
    const descricao = descricaoGastoEl.value.trim();
    const valor = parseFloat(valorEl.value);

    if (!descricao || isNaN(valor) || valor <= 0) {
        alert("Preencha a descrição e o valor!");
        return;
    }

    gastos.push({ descricao, valor });
    descricaoGastoEl.value = "";
    valorEl.value = "";
    salvar();
    render();
}

// ================= RENDER =================
function render() {
    // 1. ORGANIZAÇÃO CRONOLÓGICA (Garante que Jan venha antes de Mai)
    meses.sort((a, b) => {
        // Se o dado for antigo e não tiver anoNum, tentamos extrair do nome ou usamos 0
        const anoA = a.anoNum || 0;
        const anoB = b.anoNum || 0;
        const idxA = a.mesIdx !== undefined ? a.mesIdx : -1;
        const idxB = b.mesIdx !== undefined ? b.mesIdx : -1;

        if (anoA !== anoB) return anoA - anoB;
        return idxA - idxB;
    });

    lista.innerHTML = "";
    let totalPoupado = 0;
    const meta = parseFloat(metaEl.value) || 0;

    meses.forEach((m, i) => {
        if (m.pago) totalPoupado += m.valor;
        lista.innerHTML += `
        <div class="mes">
            <span class="${m.pago ? 'pago' : ''}">${m.nome} - R$ ${m.valor.toFixed(2)}</span>
            <div class="actions">
                <button onclick="toggle(${i})">✔</button>
                <button onclick="remover(${i})">❌</button>
            </div>
        </div>`;
    });

    listaGastosEl.innerHTML = "";
    let totalGastos = 0;
    gastos.forEach((g, i) => {
        totalGastos += g.valor;
        listaGastosEl.innerHTML += `
        <div class="gasto">
            <span>🚨 ${g.descricao} - R$ ${g.valor.toFixed(2)}</span>
            <div class="actions">
                <button onclick="removerGasto(${i})">❌</button>
            </div>
        </div>`;
    });

    const saldoFinal = totalPoupado - totalGastos;
    const falta = Math.max(0, meta - saldoFinal);
    const percent = meta > 0 ? (saldoFinal / meta) * 100 : 0;

    guardadoEl.innerText = saldoFinal.toFixed(2);
    faltaEl.innerText = falta.toFixed(2);
    percentEl.innerText = Math.min(100, percent).toFixed(1) + "%";
    barra.style.width = Math.min(100, Math.max(0, percent)) + "%";

    atualizarGrafico(totalGastos);
}

// ================= AÇÕES =================
function toggle(i) { meses[i].pago = !meses[i].pago; salvar(); render(); }
function remover(i) { if (confirm("Remover?")) { meses.splice(i, 1); salvar(); render(); } }
function removerGasto(i) { if (confirm("Remover gasto?")) { gastos.splice(i, 1); salvar(); render(); } }

function atualizarGrafico() {
    // Labels: Nomes dos meses (ex: "Janeiro / 2025")
    const labels = meses.map(m => m.nome);
    
    // Dados: Apenas o valor individual de cada mês, independente de estar pago ou não
    // Se quiser que apareça 0 para meses não marcados como "OK", use: m.pago ? m.valor : 0
    const dados = meses.map(m => m.valor);

    if (grafico) grafico.destroy();
    if (labels.length === 0) return;

    grafico = new Chart(graficoEl, {
        type: 'line', // Você também pode testar 'bar' para ver colunas individuais
        data: {
            labels,
            datasets: [{
                label: 'Valor Guardado no Mês (R$)',
                data: dados,
                borderColor: '#00ffd5',
                backgroundColor: 'rgba(0, 255, 213, 0.1)',
                borderWidth: 3,
                tension: 0, // Linha reta entre os pontos para precisão total
                fill: true,
                pointBackgroundColor: '#fff',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Valor: R$ ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, // Garante que a escala comece no 0 para dar perspectiva
                    ticks: { color: '#aaa' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: { 
                    ticks: { color: '#aaa' }, 
                    grid: { display: false } 
                }
            }
        }
    });
}

// ================= PDF PROFISSIONAL =================
document.getElementById('btnPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Fundo Escuro
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 297, 'F');

    // Cabeçalho Ciano
    doc.setFillColor(0, 255, 213);
    doc.rect(0, 0, 210, 5, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 255, 213);
    doc.text("RELATÓRIO FINANCEIRO", 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Gerado em: ${dataAtual}`, 160, 25);

    // Linha Divisória
    doc.setDrawColor(80, 80, 80);
    doc.line(20, 40, 190, 40);

    // Resumo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Saldo Final: R$ ${guardadoEl.innerText}`, 20, 55);
    doc.text(`Meta: R$ ${metaEl.value || '0.00'}`, 20, 65);
    doc.text(`Progresso: ${percentEl.innerText}`, 20, 75);

    let y = 100;

    // Seção de Economias
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 255, 213);
    doc.text("HISTÓRICO DE ECONOMIAS", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255); // Texto branco para a lista
    meses.forEach(m => {
        if (y > 270) { doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        doc.text(`${m.nome} .......................... R$ ${m.valor.toFixed(2)} [${m.pago ? 'OK' : 'PENDENTE'}]`, 25, y);
        y += 8;
    });

    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 80, 80); // Vermelho para Gastos
    doc.text("DETALHAMENTO DE GASTOS", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    gastos.forEach(g => {
        if (y > 270) { doc.addPage(); doc.setFillColor(30, 30, 30); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        doc.text(`${g.descricao} .......................... R$ ${g.valor.toFixed(2)}`, 25, y);
        y += 8;
    });

    doc.save(`Relatorio_${dataAtual.replace(/\//g, '-')}.pdf`);
});

// ================= STORAGE =================
function salvar() {
    localStorage.setItem("poupanca", JSON.stringify({ meta: metaEl.value, meses, gastos }));
}

function carregar() {
    const data = JSON.parse(localStorage.getItem("poupanca"));
    if (data) {
        meses = data.meses || [];
        gastos = data.gastos || [];
        metaEl.value = data.meta || "";

        // Correção de dados antigos: se o mês existe mas não tem mesIdx, nós adicionamos agora
        meses.forEach(m => {
            if (m.mesIdx === undefined) {
                const mesNome = m.nome.split(' / ')[0];
                const anoNome = m.nome.split(' / ')[1];
                m.mesIdx = mesesReferencia.indexOf(mesNome);
                m.anoNum = parseInt(anoNome);
            }
        });

        if (data.meta) {
            mostrarMetaEl.checked = true;
            metaEl.style.display = 'block';
        }
    }
    render();
}

// Listeners
tipoAdicionarEl.addEventListener("change", function () {
    const v = this.value;
    valorEl.style.display = v ? "block" : "none";
    camposGuardado.style.display = v === "guardado" ? "flex" : "none";
    camposGasto.style.display = v === "gasto" ? "block" : "none";
    btnAdicionar.style.display = v ? "block" : "none";
});
mostrarMetaEl.addEventListener('change', function () { metaEl.style.display = this.checked ? 'block' : 'none'; });
btnAdicionar.addEventListener('click', adicionar);
metaEl.addEventListener('input', () => { salvar(); render(); });
btnExport.addEventListener('click', () => {
    const data = localStorage.getItem("poupanca");
    if (!data) return alert("Sem dados");
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = "meu_progresso.json"; a.click();
});

carregar();
// ================= IMPORTAR JSON =================
document.getElementById('inputFicheiro').addEventListener('change', function (event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function (e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);

            // Validação simples para ver se o arquivo é do nosso app
            if (dadosImportados.meses || dadosImportados.gastos) {
                if (confirm("Isso irá substituir seus dados atuais. Deseja continuar?")) {
                    localStorage.setItem("poupanca", JSON.stringify(dadosImportados));
                    location.reload(); // Recarrega a página para aplicar os dados
                }
            } else {
                alert("Arquivo JSON inválido para este sistema.");
            }
        } catch (erro) {
            alert("Erro ao ler o arquivo JSON.");
        }
    };
    leitor.readAsText(arquivo);
});