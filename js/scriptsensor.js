document.addEventListener('DOMContentLoaded', function () {
    // ...existing code...

    let tensaoSelecionada = '127V';
    let potenciaSelecionada = '4400W';
    let estacaoSelecionada = 'Verão';

    let contadorBanho = 0;
    let ultimoId = 0;

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

    let totalEnergia = 0;
    let totalCustoEnergia = 0;
    let totalTempoBanho = 0;
    let totalVazaoLitros = 0;
    let totalCustoAgua = 0;
    let totalCustoEsgoto = 0;

    function atualizarConsumo(tempoSegundos) {
        let potencia = tensaoSelecionada === '127V' ? potencias127V[potenciaSelecionada][estacaoSelecionada] : potencias220V[potenciaSelecionada][estacaoSelecionada];
        const tempoHoras = Math.abs(tempoSegundos) / 3600;
        const consumo = (potencia * tempoHoras) / 1000;
        const custo = consumo * 0.92;
        const vazao = tempoSegundos * 0.2; // Cálculo da vazão (0,2 litros por segundo)
        const vazaoM3 = vazao / 1000; // Calcular a vazão em m³

        // Atualiza o consumo e custo na interface
        document.querySelector('.consumo').innerText = consumo.toFixed(4) + ' kWh';
        document.querySelector('.custo').innerText = 'R$ ' + custo.toFixed(2);
        document.querySelector('.vazao').innerText = vazao.toFixed(2) + ' L';
        document.querySelector('.vazaoM3').innerText = vazaoM3.toFixed(3) + ' m³'; // Atualizar a vazão em m³

        // Garante que a caixa de resultado esteja visível
        document.getElementById('caixaResultado').style.display = 'block';
    
        // Atualiza o cronômetro
        document.getElementById('sample').innerText = `Tempo de banho: ${formatTime(tempoSegundos)}`;
    
        // Enviar dados para a API com o último ID
        if (ultimoId > 0) { // Verifica se o último ID é válido
            fetch(`https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro/${ultimoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    consumo: parseFloat(consumo.toFixed(4)), // Corrigir formatação
                    custo: parseFloat(custo.toFixed(2)), // Corrigir formatação
                    tempo: parseFloat((tempoSegundos / 60).toFixed(2)), // Corrigir formatação
                    potencia: potenciaSelecionada,
                    tensao: tensaoSelecionada,
                    estacao: estacaoSelecionada,
                    vazao: parseFloat(vazao.toFixed(2)), // Corrigir formatação
                    consumoM3: parseFloat((vazao / 1000).toFixed(3)) // Corrigir formatação
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Dados enviados para a API:', data);
                // Atualiza os gráficos com os dados da API
                const label = `Banho ${data.id} (${data.tensao}, ${data.potencia}, ${data.estacao})`;
                graficoConsumo.data.labels[graficoConsumo.data.labels.length - 1] = label;
                graficoConsumo.data.datasets[0].data[graficoConsumo.data.datasets[0].data.length - 1] = parseFloat(data.consumo);
                graficoTempo.data.labels[graficoTempo.data.labels.length - 1] = label;
                graficoTempo.data.datasets[0].data[graficoTempo.data.datasets[0].data.length - 1] = parseFloat(data.tempo);
                graficoCusto.data.labels[graficoCusto.data.labels.length - 1] = label;
                graficoCusto.data.datasets[0].data[graficoCusto.data.datasets[0].data.length - 1] = parseFloat(data.custo);
                graficoVazao.data.labels[graficoVazao.data.labels.length - 1] = label;
                graficoVazao.data.datasets[0].data[graficoVazao.data.datasets[0].data.length - 1] = parseFloat(data.vazao);
                graficoConsumo.update();
                graficoTempo.update();
                graficoCusto.update();
                graficoVazao.update();
            })
            .catch(error => {
                console.error('Erro ao enviar dados para a API:', error);
            });
        }

        totalEnergia += consumo;
        totalCustoEnergia += custo;
        totalTempoBanho += tempoSegundos / 60;
        totalVazaoLitros += vazao;

        const { custoAgua: totalCustoAguaAtualizado, custoEsgoto: totalCustoEsgotoAtualizado } = calcularCustoAgua(totalVazaoLitros);

        totalCustoAgua = parseFloat(totalCustoAguaAtualizado);
        totalCustoEsgoto = parseFloat(totalCustoEsgotoAtualizado);

        const totalGasto = totalCustoEnergia + totalCustoAgua + totalCustoEsgoto;

        document.querySelector('.totalEnergia').innerText = totalEnergia.toFixed(5) + ' kWh';
        document.querySelector('.totalCustoEnergia').innerText = 'R$ ' + totalCustoEnergia.toFixed(2);
        document.querySelector('.totalTempoBanho').innerText = totalTempoBanho.toFixed(2) + ' minutos';
        document.querySelector('.totalVazaoLitros').innerText = totalVazaoLitros.toFixed(2) + ' L';
        document.querySelector('.totalVazaoM3').innerText = (totalVazaoLitros / 1000).toFixed(3) + ' m³';
        document.querySelector('.totalCustoAgua').innerText = 'R$ ' + totalCustoAgua.toFixed(2);
        document.querySelector('.totalCustoEsgoto').innerText = 'R$ ' + totalCustoEsgoto.toFixed(2);
        document.querySelector('.totalGasto').innerText = 'R$ ' + totalGasto.toFixed(2);
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
            labels: [],
            datasets: [{
                label: 'Consumo (kWh)',
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

    const ctxTempo = document.getElementById('graficoTempo').getContext('2d');
    const graficoTempo = new Chart(ctxTempo, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tempo (min)',
                data: [],
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
            labels: [],
            datasets: [{
                label: 'Custo (R$)',
                data: [],
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

    const ctxVazao = document.getElementById('graficoVazao').getContext('2d');
    const graficoVazao = new Chart(ctxVazao, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Vazão (L)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Vazão (L)'
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
                    const label = `Banho ${item.id} (${item.tensao}, ${item.potencia}, ${item.estacao})`;

                    graficoConsumo.data.labels.push(label);
                    graficoConsumo.data.datasets[0].data.push(consumo);
                    graficoCusto.data.labels.push(label);
                    graficoCusto.data.datasets[0].data.push(custo);
                    graficoTempo.data.labels.push(label);
                    graficoTempo.data.datasets[0].data.push(tempo);
                    graficoVazao.data.labels.push(label);
                    graficoVazao.data.datasets[0].data.push(vazao);

                    ultimoId = Math.max(ultimoId, item.id); // Atualiza o último ID

                    totalEnergia += consumo;
                    totalCustoEnergia += custo;
                    totalTempoBanho += tempo;
                    totalVazaoLitros += vazao;
                    totalConsumoM3 += consumoM3;
                });

                graficoConsumo.update();
                graficoCusto.update();
                graficoTempo.update();
                graficoVazao.update();

                const { custoAgua, custoEsgoto } = calcularCustoAgua(totalVazaoLitros);

                totalCustoAgua = parseFloat(custoAgua);
                totalCustoEsgoto = parseFloat(custoEsgoto);

                const totalGasto = totalCustoEnergia + totalCustoAgua + totalCustoEsgoto;

                document.querySelector('.totalEnergia').innerText = totalEnergia.toFixed(5) + ' kWh';
                document.querySelector('.totalCustoEnergia').innerText = 'R$ ' + totalCustoEnergia.toFixed(2);
                document.querySelector('.totalTempoBanho').innerText = totalTempoBanho.toFixed(2) + ' minutos';
                document.querySelector('.totalVazaoLitros').innerText = totalVazaoLitros.toFixed(2) + ' L';
                document.querySelector('.totalVazaoM3').innerText = (totalVazaoLitros / 1000).toFixed(3) + ' m³';
                document.querySelector('.totalCustoAgua').innerText = 'R$ ' + totalCustoAgua.toFixed(2);
                document.querySelector('.totalCustoEsgoto').innerText = 'R$ ' + totalCustoEsgoto.toFixed(2);
                document.querySelector('.totalGasto').innerText = 'R$ ' + totalGasto.toFixed(2);

                // Atualizar a interface com os dados do último banho
                if (data.length > 1) { // Verifica se há mais de um banho
                    const penultimoBanho = data[data.length - 2];
                    document.querySelector('.consumo').innerText = parseFloat(penultimoBanho.consumo).toFixed(4) + ' kWh';
                    document.querySelector('.custo').innerText = 'R$ ' + parseFloat(penultimoBanho.custo).toFixed(2);
                    document.querySelector('.vazao').innerText = parseFloat(penultimoBanho.vazao).toFixed(2) + ' L';
                    document.getElementById('sample').innerText = `Tempo de banho: ${formatTime(parseFloat(penultimoBanho.tempo) * 60)}`;
                    document.getElementById('caixaResultado').style.display = 'block';
                }

                // Criar um novo banho com o próximo ID
                return fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        consumo: '0 kWh',
                        custo: '0.00',
                        tempo: '0.00',
                        potencia: potenciaSelecionada,
                        tensao: tensaoSelecionada,
                        estacao: estacaoSelecionada,
                        vazao: '0.00',
                        consumoM3: '0.000'
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Novo banho criado na API:', data);
                const label = `Banho ${data.id} (${data.tensao}, ${data.potencia}, ${data.estacao})`;
                graficoConsumo.data.labels.push(label);
                graficoConsumo.data.datasets[0].data.push(0);
                graficoCusto.data.labels.push(label);
                graficoCusto.data.datasets[0].data.push(0);
                graficoTempo.data.labels.push(label);
                graficoTempo.data.datasets[0].data.push(0);
                graficoVazao.data.labels.push(label);
                graficoVazao.data.datasets[0].data.push(0);
                graficoConsumo.update();
                graficoCusto.update();
                graficoTempo.update();
                graficoVazao.update();
                ultimoId = data.id; // Atualiza o último ID
            })
            .catch(error => console.error('Erro ao criar novo banho na API:', error));
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
                // Limpar os gráficos
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
                graficoVazao.update();

                // Resetar o último ID
                ultimoId = 0;

                // Atualizar a interface
                document.querySelector('.consumo').innerText = '0 kWh';
                document.querySelector('.custo').innerText = 'R$ 0.00';
                document.querySelector('.vazao').innerText = '0 L';
                document.getElementById('sample').innerText = 'Tempo de banho: 00:00:00';
                document.getElementById('caixaResultado').style.display = 'none';

                totalEnergia = 0;
                totalCustoEnergia = 0;
                totalTempoBanho = 0;
                totalVazaoLitros = 0;
                totalCustoAgua = 0;
                totalCustoEsgoto = 0;

                document.querySelector('.totalEnergia').innerText = '0 kWh';
                document.querySelector('.totalCustoEnergia').innerText = 'R$ 0.00';
                document.querySelector('.totalTempoBanho').innerText = '0 minutos';
                document.querySelector('.totalVazaoLitros').innerText = '0 L';
                document.querySelector('.totalVazaoM3').innerText = '0 m³';
                document.querySelector('.totalCustoAgua').innerText = 'R$ 0.00';
                document.querySelector('.totalCustoEsgoto').innerText = 'R$ 0.00';
                document.querySelector('.totalGasto').innerText = 'R$ 0.00';

                console.log('Dados limpos com sucesso.');

                // Criar um novo banho com o próximo ID
                return fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        consumo: '0 kWh',
                        custo: '0.00',
                        tempo: '0.00',
                        potencia: potenciaSelecionada,
                        tensao: tensaoSelecionada,
                        estacao: estacaoSelecionada,
                        vazao: '0.00',
                        consumoM3: '0.000'
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Novo banho criado na API:', data);
                const label = `Banho ${data.id} (${data.tensao}, ${data.potencia}, ${data.estacao})`;
                graficoConsumo.data.labels.push(label);
                graficoConsumo.data.datasets[0].data.push(0);
                graficoCusto.data.labels.push(label);
                graficoCusto.data.datasets[0].data.push(0);
                graficoTempo.data.labels.push(label);
                graficoTempo.data.datasets[0].data.push(0);
                graficoVazao.data.labels.push(label);
                graficoVazao.data.datasets[0].data.push(0);
                graficoConsumo.update();
                graficoCusto.update();
                graficoTempo.update();
                graficoVazao.update();
                ultimoId = data.id; // Atualiza o último ID
            })
            .catch(error => console.error('Erro ao criar novo banho na API:', error));
    }

    // Função para criar um novo banho
    function novoBanho() {
        // Criar um novo banho na API
        fetch('https://6727d6c8270bd0b97553b20b.mockapi.io/chuveiro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                consumo: '0 kWh',
                custo: '0.00',
                tempo: '0.00',
                potencia: potenciaSelecionada,
                tensao: tensaoSelecionada,
                estacao: estacaoSelecionada,
                vazao: '0.00',
                consumoM3: '0.000'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Novo banho criado na API:', data);
            const label = `Banho ${data.id} (${data.tensao}, ${data.potencia}, ${data.estacao})`;
            graficoConsumo.data.labels.push(label);
            graficoConsumo.data.datasets[0].data.push(0);
            graficoCusto.data.labels.push(label);
            graficoCusto.data.datasets[0].data.push(0);
            graficoTempo.data.labels.push(label);
            graficoTempo.data.datasets[0].data.push(0);
            graficoVazao.data.labels.push(label);
            graficoVazao.data.datasets[0].data.push(0);
            graficoConsumo.update();
            graficoCusto.update();
            graficoTempo.update();
            graficoVazao.update();
            ultimoId = data.id; // Atualiza o último ID
        })
        .catch(error => console.error('Erro ao criar novo banho na API:', error));
    }

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
    carregarDadosIniciais();

    var socket = io();
    socket.on('data', function (data) {
        const tempoSegundos = data;
        atualizarConsumo(tempoSegundos);
    });

    document.getElementById('toggleTheme').addEventListener('click', () => {
        const currentTheme = document.getElementById('themeStylesheet').getAttribute('href');
        if (currentTheme.includes('stylesensor.css')) {
            document.getElementById('themeStylesheet').setAttribute('href', 'stylesensorescuro.css');
            document.getElementById('toggleTheme').innerText = 'Modo Claro';
        } else {
            document.getElementById('themeStylesheet').setAttribute('href', 'stylesensor.css');
            document.getElementById('toggleTheme').innerText = 'Modo Escuro';
        }
    });

    // Adicionar evento de clique para o botão de limpar
    document.getElementById('btnLimpar').addEventListener('click', limparDados);

    // Adicionar evento de clique para o botão de novo banho
    document.getElementById('novoBanhoBtn').addEventListener('click', novoBanho);
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