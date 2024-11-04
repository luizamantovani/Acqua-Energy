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

        if (faixa.fixa && consumoM3 <= faixa.faixaMax && !faixaFixaAplicada) {
            // Se está na faixa fixa e o consumo total é menor ou igual a 10 m³ e a faixa fixa ainda não foi aplicada
            custoAgua += faixa.agua;
            custoEsgoto += faixa.esgoto;
            faixaFixaAplicada = true;
            break;
        } else if (consumoRestante <= faixa.faixaMax - (i > 0 ? tarifas[i - 1].faixaMax : 0)) {
            // Consumo restante que cabe na faixa atual
            consumoFaixa = consumoRestante;
            custoAgua += consumoFaixa * faixa.agua;
            custoEsgoto += consumoFaixa * faixa.esgoto;
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
        consumoM3: consumoM3.toFixed(2),
        custoAgua: custoAgua.toFixed(2),
        custoEsgoto: custoEsgoto.toFixed(2),
        custoTotal: custoTotal.toFixed(2)
    };
    
    module.exports = calcularCustoAgua;
};