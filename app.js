const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = 3001;

app.use(express.json()); // Middleware para interpretar JSON

let data; // Variável para armazenar os dados recebidos

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Rota para servir o HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/calculosimulado.html');
});

// Rota para receber dados via POST do ESP32
app.post('/api/dados', (req, res) => {
    data = req.body.tempo_uso; // Armazena o tempo de uso recebido
    console.log(`Dado recebido: ${data}`);
    
    // Emite o dado para todos os clientes conectados via Socket.io
    io.emit('data', data);
    res.status(200).send({ message: 'Dados recebidos com sucesso!' });
});

// Configuração do Socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    
    // Envia o dado armazenado quando um cliente se conecta, caso o dado já exista
    if (data) {
        socket.emit('data', data);
    }
});

// Inicia o servidor
http.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
