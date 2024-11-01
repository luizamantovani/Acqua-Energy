document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown'); // Seleciona todos os dropdowns

    let tensaoSelecionada = '127V';
    let potenciaSelecionada = '4400W';
    let estacaoSelecionada = 'Verão';

    // Array para armazenar os consumos de cada banho
    let consumos = [];
    let contadorBanho = 0; // Para rastrear o número de banhos

    // Zera o gráfico, contador de banhos e define data como 0 ao recarregar a página
    function resetDados() {
        consumos = [];
        contadorBanho = 0;
        graficoConsumo.data.labels = [];
        graficoConsumo.data.datasets[0].data = [];
        graficoConsumo.update();
        
        // Define o tempo inicial como 0 ao carregar a página
        calcularConsumo(0);
    }

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

    // Função para calcular o consumo e atualizar o gráfico
    function calcularConsumo(tempoSegundos) {
        let potencia;
        if (tensaoSelecionada === '127V') {
            potencia = potencias127V[potenciaSelecionada][estacaoSelecionada];
        } else if (tensaoSelecionada === '220V') {
            potencia = potencias220V[potenciaSelecionada][estacaoSelecionada];
        }

        const tempoHoras = Math.abs(tempoSegundos) / 3600; // Converte segundos em horas
        const consumo = (potencia * tempoHoras) / 1000; // Consumo em kWh
        const custo = consumo * 0.92; // Calcula o custo com base no preço do kWh

        // Atualiza a interface com o consumo e custo
        document.querySelector('.consumo').innerText = consumo.toFixed(4) + ' kWh';
        document.querySelector('.custo').innerText = 'R$ ' + custo.toFixed(2);

        // Exibe os resultados
        document.getElementById('resultado').style.display = 'block';
        document.getElementById('caixaResultado').style.display = 'flex';

        // Formata e exibe o tempo
        document.getElementById('sample').innerText = `Tempo de banho: ${formatTime(tempoSegundos)}`;

        // Atualiza o gráfico em tempo real
        if (consumo > 0) {
            // Adiciona o consumo atual ao gráfico
            if (graficoConsumo.data.labels.length <= contadorBanho) {
                graficoConsumo.data.labels.push('Banho ' + (contadorBanho + 1));
                graficoConsumo.data.datasets[0].data.push(consumo);
            } else {
                graficoConsumo.data.datasets[0].data[contadorBanho] = consumo;
            }
            graficoConsumo.update();
        }

        // Incrementa o contador de banhos ao receber 1 (fim do banho)
        if (tempoSegundos === 1) {
            consumos.push(consumo); // Armazena o consumo ao final do banho
            contadorBanho++;
        }
    }

    // Função para formatar o tempo em HH:MM:SS
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Configura o gráfico
    let ctx = document.getElementById('graficoConsumo').getContext('2d');
    const graficoConsumo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Rótulos de cada banho
            datasets: [{
                label: 'Consumo de energia por banho (kWh)',
                data: [],
                backgroundColor: 'rgba(64, 74, 153, 0.6)',
                borderColor: 'rgba(64, 74, 153, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consumo (kWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Número do Banho'
                    }
                }
            }
        }
    });

    // Reseta os dados e define o tempo inicial como 0 ao carregar a página
    resetDados();

    // Escuta os eventos do socket
    var socket = io();
    socket.on('data', function (data) {
        console.log(data); // Log do dado recebido
        var tempoSegundos = data; // Supõe que os dados contêm o tempo em segundos
        calcularConsumo(tempoSegundos); // Chama a função de cálculo
    });

    // Configuração dos dropdowns e eventos
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

                // Se tensão for selecionada, exibe a potência
                if (dropdown.closest('.selecioneTensao')) {
                    tensaoSelecionada = option.innerText;
                }

                // Se potência for selecionada, exibe a estação
                if (dropdown.closest('.selecionePotencia')) {
                    potenciaSelecionada = option.innerText;
                }

                // Se estação for selecionada, salva a seleção
                if (dropdown.closest('.selecioneEstacao')) {
                    estacaoSelecionada = option.innerText;
                }
            });
        });
    });
});