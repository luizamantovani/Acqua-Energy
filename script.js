const dropdowns = document.querySelectorAll('.dropdown');
let tensaoSelecionada = '127V';
let potenciaSelecionada = '4400W';
let estacaoSelecionada = 'Verão';

let consumos = [];    // Array para armazenar os consumos de cada banho
let custos = [];      // Array para armazenar os custos em R$ de cada banho
let temposBanho = []; // Array para armazenar o tempo de cada banho (em minutos)
let especificacoes = []; // Array para as especificações do chuveiro
let vazoes = []; // Array para armazenar as vazões de cada banho

let contadorBanho = 0; // Contador de banhos

// Tabela de potências para cada tensão e estação
const potencias127V = {
    '4400W': { 'Verão': 1400, 'Outono': 3000, 'Inverno': 4400 },
    '5500W': { 'Verão': 2210, 'Outono': 3789, 'Inverno': 5500 }
};
const potencias220V = {
    '4400W': { 'Verão': 1400, 'Outono': 3000, 'Inverno': 4400 },
    '5500W': { 'Verão': 2400, 'Outono': 3050, 'Inverno': 5500 },
    '6400W': { 'Verão': 2400, 'Outono': 4700, 'Inverno': 6400 },
    '6800W': { 'Verão': 2240, 'Outono': 4300, 'Inverno': 6800 },
    '7500W': { 'Verão': 2617, 'Outono': 5150, 'Inverno': 7500 }
};

let isCalculating = false; // Variável para evitar duplicação de dados

let totalEnergia = 0;
let totalCustoEnergia = 0;
let totalTempoBanho = 0;
let totalVazaoLitros = 0;
let totalCustoAgua = 0;
let totalCustoEsgoto = 0;

// Função para calcular o consumo
function calcularConsumo() {
    if (isCalculating) return; // Evitar duplicação de dados
    isCalculating = true;

    const tempoMinutos = parseFloat(document.getElementById('tempo').value);
    const tempoHoras = tempoMinutos / 60; // Converter minutos para horas
    const agua = parseFloat(document.getElementById('agua').value);
    const vazao = agua * 6 * tempoMinutos; // Calcular a vazão e multiplicar pelos minutos

    let potencia;
    if (tensaoSelecionada === '127V') {
        potencia = potencias127V[potenciaSelecionada][estacaoSelecionada];
    } else if (tensaoSelecionada === '220V') {
        potencia = potencias220V[potenciaSelecionada][estacaoSelecionada];
    }

    const consumo = (potencia * tempoHoras) / 1000; // Consumo em kWh
    const precoKWh = 0.8315;
    const custo = consumo * precoKWh; // Custo em R$

    // Calcular custo de água e esgoto
    const { consumoM3, custoAgua, custoEsgoto, custoTotal } = calcularCustoAgua(vazao);

    // Atualizar a interface
    document.querySelector('.consumo').innerText = consumo.toFixed(5) + ' kWh';
    document.querySelector('.custo').innerText = 'R$ ' + custo.toFixed(2);
    document.querySelector('.consumoAgua').innerText = consumoM3 + ' m³ (' + vazao.toFixed(2) + ' L)';
    document.getElementById('resultado').style.display = 'block';
    document.getElementById('caixaResultado').style.display = 'flex';
    document.getElementById('resultadoAgua').style.display = 'block';
    document.getElementById('caixaResultadoAgua').style.display = 'flex';

    // Atualizar totais
    totalEnergia += consumo;
    totalCustoEnergia += custo;
    totalTempoBanho += tempoMinutos;
    totalVazaoLitros += vazao;

    // Recalcular custo de água e esgoto com base no total de consumo em m³
    const { custoAgua: totalCustoAguaAtualizado, custoEsgoto: totalCustoEsgotoAtualizado } = calcularCustoAgua(totalVazaoLitros);

    totalCustoAgua = parseFloat(totalCustoAguaAtualizado);
    totalCustoEsgoto = parseFloat(totalCustoEsgotoAtualizado);

    const totalGasto = totalCustoEnergia + totalCustoAgua + totalCustoEsgoto;

    document.querySelector('.totalEnergia').innerText = totalEnergia.toFixed(5) + ' kWh';
    document.querySelector('.totalCustoEnergia').innerText = 'R$ ' + totalCustoEnergia.toFixed(2);
    document.querySelector('.totalTempoBanho').innerText = totalTempoBanho + ' minutos';
    document.querySelector('.totalVazaoLitros').innerText = totalVazaoLitros.toFixed(2) + ' L (' + (totalVazaoLitros / 1000).toFixed(2) + ' m³)';
    document.querySelector('.totalVazaoM3').innerText = (totalVazaoLitros / 1000).toFixed(2) + ' m³';
    document.querySelector('.totalCustoAgua').innerText = 'R$ ' + totalCustoAgua.toFixed(2);
    document.querySelector('.totalCustoEsgoto').innerText = 'R$ ' + totalCustoEsgoto.toFixed(2);
    document.querySelector('.totalGasto').innerText = 'R$ ' + totalGasto.toFixed(2);

    fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            consumo: consumo.toFixed(4) + ' kWh',
            custo: custo.toFixed(2),
            tempo: tempoMinutos,
            potencia: potenciaSelecionada,
            tensao: tensaoSelecionada,
            estacao: estacaoSelecionada,
            vazao: vazao.toFixed(2), // Adicionar vazão
            consumoM3: consumoM3 // Adicionar consumo em m³
        })
    })
        .then(response => response.json())
        .then(data => {
            // Atualiza os gráficos com os dados recebidos da API
            consumos.push(parseFloat(data.consumo));
            custos.push(parseFloat(data.custo));
            temposBanho.push(parseFloat(data.tempo));
            especificacoes.push(`${data.tensao}, ${data.potencia}, ${data.estacao}`);
            vazoes.push(parseFloat(data.vazao)); // Adicionar vazão ao array
            contadorBanho++;

            atualizarGraficos(); // Atualiza todos os gráficos
            isCalculating = false; // Permitir novos cálculos
        })
        .catch(error => {
            console.error('Erro ao enviar dados para a API:', error);
            isCalculating = false; // Permitir novos cálculos mesmo em caso de erro
        });
}

// Função para carregar os dados da API ao iniciar a página
function carregarDadosIniciais() {
    fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro')
        .then(response => response.json())
        .then(data => {
            let totalConsumoM3 = 0;

            data.forEach(item => {
                const consumo = parseFloat(item.consumo);
                const custo = parseFloat(item.custo);
                const tempo = parseFloat(item.tempo);
                const vazao = parseFloat(item.vazao);
                const consumoM3 = parseFloat(item.consumoM3);

                consumos.push(consumo);
                custos.push(custo);
                temposBanho.push(tempo);
                especificacoes.push(`${item.tensao}, ${item.potencia}, ${item.estacao}`);
                vazoes.push(vazao);
                contadorBanho++;

                totalEnergia += consumo;
                totalCustoEnergia += custo;
                totalTempoBanho += tempo;
                totalVazaoLitros += vazao;
                totalConsumoM3 += consumoM3;

                const label = `Banho ${contadorBanho} (${item.tensao}, ${item.potencia}, ${item.estacao})`;
                graficoConsumo.data.labels.push(label);
                graficoConsumo.data.datasets[0].data.push(consumo);
                graficoCusto.data.labels.push(label);
                graficoCusto.data.datasets[0].data.push(custo);
                graficoTempo.data.labels.push(label);
                graficoTempo.data.datasets[0].data.push(tempo);
                graficoVazao.data.labels.push(label);
                graficoVazao.data.datasets[0].data.push(vazao);
            });

            // Recalcular custo de água e esgoto com base no total de consumo em m³
            const { custoAgua, custoEsgoto } = calcularCustoAgua(totalConsumoM3 * 1000); // Converter m³ para litros

            totalCustoAgua = parseFloat(custoAgua);
            totalCustoEsgoto = parseFloat(custoEsgoto);

            const totalGasto = totalCustoEnergia + totalCustoAgua + totalCustoEsgoto;

            document.querySelector('.totalEnergia').innerText = totalEnergia.toFixed(5) + ' kWh';
            document.querySelector('.totalCustoEnergia').innerText = 'R$ ' + totalCustoEnergia.toFixed(2);
            document.querySelector('.totalTempoBanho').innerText = totalTempoBanho + ' minutos';
            document.querySelector('.totalVazaoLitros').innerText = totalVazaoLitros.toFixed(2) + ' L (' + (totalVazaoLitros / 1000).toFixed(2) + ' m³)';
            document.querySelector('.totalVazaoM3').innerText = (totalVazaoLitros / 1000).toFixed(2) + ' m³';
            document.querySelector('.totalCustoAgua').innerText = 'R$ ' + totalCustoAgua.toFixed(2);
            document.querySelector('.totalCustoEsgoto').innerText = 'R$ ' + totalCustoEsgoto.toFixed(2);
            document.querySelector('.totalGasto').innerText = 'R$ ' + totalGasto.toFixed(2);

            graficoConsumo.update();
            graficoCusto.update();
            graficoTempo.update();
            graficoVazao.update();
        })
        .catch(error => console.error('Erro ao carregar dados da API:', error));
}

let graficoConsumo, graficoCusto, graficoTempo, graficoVazao;
// Função para mostrar todos os banhos ao iniciar a página
function mostrarTodosBanhos() {
    fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const label = `Banho ${item.id} (${item.tensao}, ${item.potencia}, ${item.estacao})`;

                graficoConsumo.data.labels.push(label);
                graficoConsumo.data.datasets[0].data.push(parseFloat(item.consumo));
                graficoConsumo.update();

                graficoCusto.data.labels.push(label);
                graficoCusto.data.datasets[0].data.push(parseFloat(item.custo));
                graficoCusto.update();

                graficoTempo.data.labels.push(label);
                graficoTempo.data.datasets[0].data.push(parseFloat(item.tempo));
                graficoTempo.update();
            });
        })
        .catch(error => console.error('Erro ao carregar dados da API:', error));
};

// Removido para evitar duplicação de dados
// Função para configurar os gráficos com Chart.js
function configurarGraficos() {
    const ctxConsumo = document.getElementById('graficoConsumo').getContext('2d');
    const ctxCusto = document.getElementById('graficoCusto').getContext('2d');
    const ctxTempo = document.getElementById('graficoTempo').getContext('2d');
    const ctxVazao = document.getElementById('graficoVazao').getContext('2d'); // Contexto do gráfico de vazão

    graficoConsumo = new Chart(ctxConsumo, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Consumo de energia por banho (kWh)',
                data: [],
                backgroundColor: 'rgba(64, 74, 153, 0.6)',
                borderColor: 'rgba(64, 74, 153, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Banhos' } } } }
    });

    graficoCusto = new Chart(ctxCusto, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Custo por banho (R$)',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Banhos' } } } }
    });

    graficoTempo = new Chart(ctxTempo, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tempo de banho (minutos)',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Banhos' } } } }
    });

    graficoVazao = new Chart(ctxVazao, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Vazão de água por banho (L/min)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Banhos' } } } }
    });
}

// Função para atualizar os gráficos com os dados mais recentes
function atualizarGraficos() {
    const label = `Banho ${contadorBanho} (${especificacoes[contadorBanho - 1]})`;

    graficoConsumo.data.labels.push(label);
    graficoConsumo.data.datasets[0].data.push(consumos[consumos.length - 1]);
    graficoConsumo.update();

    graficoCusto.data.labels.push(label);
    graficoCusto.data.datasets[0].data.push(custos[custos.length - 1]);
    graficoCusto.update();

    graficoTempo.data.labels.push(label);
    graficoTempo.data.datasets[0].data.push(temposBanho[temposBanho.length - 1]);
    graficoTempo.update();

    graficoVazao.data.labels.push(label); // Adicionar label ao gráfico de vazão
    graficoVazao.data.datasets[0].data.push(vazoes[vazoes.length - 1]); // Adicionar dados ao gráfico de vazão
    graficoVazao.update(); // Atualizar gráfico de vazão
}

// Função para limpar todos os dados da API
function limparDados() {
    fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro')
        .then(response => response.json())
        .then(data => {
            const deletePromises = data.map(item => 
                fetch(`https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro/${item.id}`, {
                    method: 'DELETE'
                })
            );
            return Promise.all(deletePromises);
        })
        .then(() => {
            // Limpar os arrays locais
            consumos = [];
            custos = [];
            temposBanho = [];
            especificacoes = [];
            vazoes = []; // Limpar array de vazões
            contadorBanho = 0;

            // Resetar totais
            totalEnergia = 0;
            totalCustoEnergia = 0;
            totalTempoBanho = 0;
            totalVazaoLitros = 0;
            totalCustoAgua = 0;
            totalCustoEsgoto = 0;

            // Atualizar os gráficos
            graficoConsumo.data.labels = [];
            graficoConsumo.data.datasets[0].data = [];
            graficoConsumo.update();

            graficoCusto.data.labels = [];
            graficoCusto.data.datasets[0].data = [];
            graficoCusto.update();

            graficoTempo.data.labels = [];
            graficoTempo.data.datasets[0].data = [];
            graficoTempo.update();

            graficoVazao.data.labels = [];
            graficoVazao.data.datasets[0].data = [];
            graficoVazao.update(); // Atualizar gráfico de vazão

            // Atualizar a interface
            document.querySelector('.totalEnergia').innerText = '0 kWh';
            document.querySelector('.totalCustoEnergia').innerText = 'R$ 0.00';
            document.querySelector('.totalTempoBanho').innerText = '0 minutos';
            document.querySelector('.totalVazaoLitros').innerText = '0 L';
            document.querySelector('.totalVazaoM3').innerText = '0 m³';
            document.querySelector('.totalCustoAgua').innerText = 'R$ 0.00';
            document.querySelector('.totalCustoEsgoto').innerText = 'R$ 0.00';
            document.querySelector('.totalGasto').innerText = 'R$ 0.00';

            console.log('Dados limpos com sucesso.');
        })
        .catch(error => console.error('Erro ao limpar dados da API:', error));
}

// Função para calcular o custo da água
function calcularCustoAgua(consumoLitros) {
    // Converter litros para m³
    let consumoM3 = consumoLitros / 1000;

    // Definir faixas de consumo e tarifas
    const tarifas = [
        { faixaMax: 10, agua: 20.11, esgoto: 18.60, fixa: true },
        { faixaMax: 15, agua: 3.02, esgoto: 2.79, fixa: false },
        { faixaMax: 20, agua: 4.40, esgoto: 4.07, fixa: false },
        { faixaMax: 25, agua: 6.38, esgoto: 5.90, fixa: false },
        { faixaMax: 30, agua: 7.02, esgoto: 6.49, fixa: false },
        { faixaMax: 40, agua: 7.36, esgoto: 6.81, fixa: false },
        { faixaMax: 50, agua: 7.74, esgoto: 7.16, fixa: false },
        { faixaMax: 75, agua: 8.14, esgoto: 7.53, fixa: false },
        { faixaMax: 100, agua: 8.34, esgoto: 7.71, fixa: false },
        { faixaMax: 200, agua: 10.00, esgoto: 9.25, fixa: false },
        { faixaMax: 300, agua: 12.00, esgoto: 11.10, fixa: false },
        { faixaMax: Infinity, agua: 14.39, esgoto: 13.31, fixa: false }
    ];

    let consumoRestante = consumoM3;
    let custoAgua = 0;
    let custoEsgoto = 0;
    let faixaFixaAplicada = false;

    for (let i = 0; i < tarifas.length; i++) {
        const faixa = tarifas[i];
        let consumoFaixa;

        if (faixa.fixa && !faixaFixaAplicada) {
            // Aplicar a tarifa fixa para os primeiros 10 m³
            custoAgua += faixa.agua;
            custoEsgoto += faixa.esgoto;
            faixaFixaAplicada = true;
            consumoRestante = Math.max(0, consumoRestante - faixa.faixaMax);
        } else if (consumoRestante <= faixa.faixaMax - (i > 0 ? tarifas[i - 1].faixaMax : 0)) {
            // Consumo restante que cabe na faixa atual
            consumoFaixa = consumoRestante;
            custoAgua += consumoFaixa * faixa.agua;
            custoEsgoto += consumoFaixa * faixa.esgoto;
            consumoRestante = 0;
            break;
        } else {
            // Consumo total para a faixa atual
            consumoFaixa = faixa.faixaMax - (i > 0 ? tarifas[i - 1].faixaMax : 0);
            custoAgua += consumoFaixa * faixa.agua;
            custoEsgoto += consumoFaixa * faixa.esgoto;
            consumoRestante -= consumoFaixa;
        }
    }

    const custoTotal = custoAgua + custoEsgoto;

    return {
        consumoM3: consumoM3.toFixed(3),
        custoAgua: custoAgua.toFixed(2),
        custoEsgoto: custoEsgoto.toFixed(2),
        custoTotal: custoTotal.toFixed(2)
    };
}

// Inicializa os gráficos ao carregar a página
configurarGraficos();

// Carregar os dados iniciais ao iniciar a página
carregarDadosIniciais();

// Adicionar evento de clique para o botão de limpar
document.getElementById('btnLimpar').addEventListener('click', limparDados);

// Adicionar evento de clique para o botão de calcular
document.querySelector('.btnCalcular').addEventListener('click', calcularConsumo);

// Lógica para manipular os dropdowns e capturar as seleções
dropdowns.forEach(dropdown => {
    const select = dropdown.querySelector('.select');
    const caret = dropdown.querySelector('.caret');
    const menu = dropdown.querySelector('.menu');
    const options = dropdown.querySelectorAll('.menu li');

    select.addEventListener('click', () => {
        select.classList.toggle('select-clicked');
        caret.classList.toggle('caret-rotate');
        menu.classList.toggle('menu-open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            select.querySelector('span').innerText = option.innerText;
            select.classList.remove('select-clicked');
            caret.classList.remove('caret-rotate');
            menu.classList.remove('menu-open');

            options.forEach(option => {
                option.classList.remove('active');
            });
            option.classList.add('active');

            if (dropdown.closest('.selecioneTensao')) {
                tensaoSelecionada = option.innerText;
            }
            if (dropdown.closest('.selecionePotencia')) {
                potenciaSelecionada = option.innerText;
            }
            if (dropdown.closest('.selecioneEstacao')) {
                estacaoSelecionada = option.innerText;
            }
        });
    });
});

document.getElementById('toggleTheme').addEventListener('click', () => {
    const currentTheme = document.getElementById('themeStylesheet').getAttribute('href');
    if (currentTheme === 'style.css') {
        document.getElementById('themeStylesheet').setAttribute('href', 'style-escuro.css');
        document.getElementById('toggleTheme').innerText = 'Modo Claro';
    } else {
        document.getElementById('themeStylesheet').setAttribute('href', 'style.css');
        document.getElementById('toggleTheme').innerText = 'Modo Escuro';
    }
});
