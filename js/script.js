document.addEventListener('DOMContentLoaded', function () {

    let tensaoSelecionada = '127V';
    let potenciaSelecionada = '4400W';
    let estacaoSelecionada = 'Verão';

    let contadorBanho = 0;

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

    function atualizarConsumo(tempoSegundos) {
        let potencia = tensaoSelecionada === '127V' ? potencias127V[potenciaSelecionada][estacaoSelecionada] : potencias220V[potenciaSelecionada][estacaoSelecionada];
        const tempoHoras = Math.abs(tempoSegundos) / 3600;
        const consumo = (potencia * tempoHoras) / 1000;
        const custo = consumo * 0.92;
    
        // Atualiza o consumo e custo na interface
        document.querySelector('.consumo').innerText = consumo.toFixed(4) + ' kWh';
        document.querySelector('.custo').innerText = 'R$ ' + custo.toFixed(2);
    
        // Garante que a caixa de resultado esteja visível
        document.getElementById('caixaResultado').style.display = 'block';
    
        // Atualiza o cronômetro
        document.getElementById('sample').innerText = `Tempo de banho: ${formatTime(tempoSegundos)}`;
    
        // Atualiza os gráficos em tempo real
        graficoConsumo.data.datasets[0].data[contadorBanho] = consumo;
        graficoTempo.data.datasets[0].data[contadorBanho] = tempoSegundos / 60;
        graficoCusto.data.datasets[0].data[contadorBanho] = custo;
        graficoConsumo.update();
        graficoTempo.update();
        graficoCusto.update();
    }
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const ctxConsumo = document.getElementById('graficoConsumo').getContext('2d');
    const graficoConsumo = new Chart(ctxConsumo, {
        type: 'bar',
        data: {
            labels: ['Banho ' + (contadorBanho + 1)],
            datasets: [{
                label: 'Consumo (kWh)',
                data: [0],
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

    const ctxTempo = document.getElementById('graficoTempo').getContext('2d');
    const graficoTempo = new Chart(ctxTempo, {
        type: 'line',
        data: {
            labels: ['Banho ' + (contadorBanho + 1)],
            datasets: [{
                label: 'Tempo (min)',
                data: [0],
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tempo (min)'
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

    const ctxCusto = document.getElementById('graficoCusto').getContext('2d');
    const graficoCusto = new Chart(ctxCusto, {
        type: 'line',
        data: {
            labels: ['Banho ' + (contadorBanho + 1)],
            datasets: [{
                label: 'Custo (R$)',
                data: [0],
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Custo (R$)'
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

    window.novoBanho = function () {
        contadorBanho++;
        graficoConsumo.data.labels.push('Banho ' + (contadorBanho + 1));
        graficoConsumo.data.datasets[0].data.push(0);
        graficoTempo.data.labels.push('Banho ' + (contadorBanho + 1));
        graficoTempo.data.datasets[0].data.push(0);
        graficoCusto.data.labels.push('Banho ' + (contadorBanho + 1));
        graficoCusto.data.datasets[0].data.push(0);
        graficoConsumo.update();
        graficoTempo.update();
        graficoCusto.update();
    };

    var socket = io();
    socket.on('data', function (data) {
        const tempoSegundos = data;
        atualizarConsumo(tempoSegundos);
    });
});

// Configuração dos dropdowns e eventos
document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown');
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

