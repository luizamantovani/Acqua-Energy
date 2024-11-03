const dropdowns = document.querySelectorAll('.dropdown');
let tensaoSelecionada = '127V';
let potenciaSelecionada = '4400W';
let estacaoSelecionada = 'Verão';

let consumos = [];    // Array para armazenar os consumos de cada banho
let custos = [];      // Array para armazenar os custos em R$ de cada banho
let temposBanho = []; // Array para armazenar o tempo de cada banho (em minutos)
let especificacoes = []; // Array para as especificações do chuveiro

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

// Função para calcular o consumo
function calcularConsumo() {
    const tempoMinutos = parseFloat(document.getElementById('tempo').value);
    const tempoHoras = tempoMinutos / 60; // Converter minutos para horas

    let potencia;
    if (tensaoSelecionada === '127V') {
        potencia = potencias127V[potenciaSelecionada][estacaoSelecionada];
    } else if (tensaoSelecionada === '220V') {
        potencia = potencias220V[potenciaSelecionada][estacaoSelecionada];
    }

    const consumo = (potencia * tempoHoras) / 1000; // Consumo em kWh
    const precoKWh = 0.92;
    const custo = consumo * precoKWh; // Custo em R$

    // Atualizar a interface
    document.querySelector('.consumo').innerText = consumo.toFixed(5) + ' kWh';
    document.querySelector('.custo').innerText = 'R$ ' + custo.toFixed(2);
    document.getElementById('resultado').style.display = 'block';
    document.getElementById('caixaResultado').style.display = 'flex';

    // // Armazena os dados e especificações
    // consumos.push(consumo);
    // custos.push(custo);
    // temposBanho.push(tempoMinutos);
    // especificacoes.push(`${tensaoSelecionada}, ${potenciaSelecionada}, ${estacaoSelecionada}`);
    // contadorBanho++;

    // atualizarGraficos(); // Atualiza todos os gráficos

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
        })
    })
        .then(response => response.json())
        .then(data => {
            // Atualiza os gráficos com os dados recebidos da API
            consumos.push(parseFloat(data.consumo));
            custos.push(parseFloat(data.custo));
            temposBanho.push(parseFloat(data.tempo));
            especificacoes.push(`${data.tensao}, ${data.potencia}, ${data.estacao}`);
            contadorBanho++;

            atualizarGraficos(); // Atualiza todos os gráficos
        })
        .catch(error => console.error('Erro ao enviar dados para a API:', error));
}

// Função para carregar os dados da API ao iniciar a página
function carregarDadosIniciais() {
    fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                consumos.push(parseFloat(item.consumo));
                custos.push(parseFloat(item.custo));
                temposBanho.push(parseFloat(item.tempo));
                especificacoes.push(`${item.tensao}, ${item.potencia}, ${item.estacao}`);
                contadorBanho++;

                const label = `Banho ${contadorBanho} (${item.tensao}, ${item.potencia}, ${item.estacao})`;
                graficoConsumo.data.labels.push(label);
                graficoConsumo.data.datasets[0].data.push(parseFloat(item.consumo));
                graficoCusto.data.labels.push(label);
                graficoCusto.data.datasets[0].data.push(parseFloat(item.custo));
                graficoTempo.data.labels.push(label);
                graficoTempo.data.datasets[0].data.push(parseFloat(item.tempo));
            });

            graficoConsumo.update();
            graficoCusto.update();
            graficoTempo.update();
        })
        .catch(error => console.error('Erro ao carregar dados da API:', error));
}

let graficoConsumo, graficoCusto, graficoTempo;
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
}

// Removido para evitar duplicação de dados
// Função para configurar os gráficos com Chart.js
function configurarGraficos() {
    const ctxConsumo = document.getElementById('graficoConsumo').getContext('2d');
    const ctxCusto = document.getElementById('graficoCusto').getContext('2d');
    const ctxTempo = document.getElementById('graficoTempo').getContext('2d');

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
            contadorBanho = 0;

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

            console.log('Dados limpos com sucesso.');
        })
        .catch(error => console.error('Erro ao limpar dados da API:', error));
}

// Inicializa os gráficos ao carregar a página
configurarGraficos();

// Carregar os dados iniciais ao iniciar a página
carregarDadosIniciais();

// Adicionar evento de clique para o botão de limpar
document.getElementById('btnLimpar').addEventListener('click', limparDados);

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
