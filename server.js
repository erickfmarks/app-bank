const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const PORT = 2000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configuração do PostgreSQL
const pool = new Pool({
    user: "avnadmin",
    password: "AVNS_z0p21G-xhFQOIF_T1eT",
    host: "pg-app-bank-erickfmarks-8519.g.aivencloud.com",
    port: 16029,
    database: "app-bank",
    ssl: {
        rejectUnauthorized: false,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem')).toString()
    },
});

// Funções auxiliares para o banco
async function getUser(username, password) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    return rows[0];
}

async function getTransactions(usuario, mes, ano) {
    const { rows } = await pool.query('SELECT * FROM transactions WHERE usuario = $1 AND mes = $2 AND ano = $3', [usuario, mes, ano]);
    return rows;
}

async function saveTransactions(usuario, mes, ano, transacoes) {
    await pool.query('DELETE FROM transactions WHERE usuario = $1 AND mes = $2 AND ano = $3', [usuario, mes, ano]);
    for (const t of transacoes) {
        await pool.query(
            'INSERT INTO transactions (usuario, mes, ano, tipo, descricao, valor, categoria, conta_bancaria, data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [usuario, mes, ano, t.tipo, t.descricao, t.valor, t.categoria, t.contaBancaria, t.data || new Date()]
        );
    }
}

async function getBankAccounts(usuario, mes, ano) {
    const { rows } = await pool.query('SELECT * FROM bank_accounts WHERE usuario = $1 AND mes = $2 AND ano = $3', [usuario, mes, ano]);
    return rows;
}

async function saveBankAccounts(usuario, mes, ano, contas) {
    await pool.query('DELETE FROM bank_accounts WHERE usuario = $1 AND mes = $2 AND ano = $3', [usuario, mes, ano]);
    for (const c of contas) {
        await pool.query(
            'INSERT INTO bank_accounts (usuario, mes, ano, name, balance) VALUES ($1,$2,$3,$4,$5)',
            [usuario, mes, ano, c.name, c.balance]
        );
    }
}

async function getCofrinhos(usuario, mes, ano) {
    const { rows } = await pool.query('SELECT * FROM cofrinhos WHERE usuario = $1 AND mes = $2 AND ano = $3', [usuario, mes, ano]);
    return rows;
}

async function addCofrinho({ nome, valor, descricao, usuario, mes, ano }) {
    const { rows } = await pool.query(
        'INSERT INTO cofrinhos (usuario, mes, ano, nome, valor, descricao) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [usuario, mes, ano, nome, valor, descricao || '']
    );
    return rows[0];
}

async function deleteCofrinho(id) {
    await pool.query('DELETE FROM cofrinhos WHERE id = $1', [id]);
}

// Função para gerar chave única para dados por usuário/mês/ano
function generateKey(usuario, mes, ano) {
    return `${usuario}_${mes}_${ano}`;
}

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const user = await getUser(username, password);
        if (user) {
            res.json({ success: true, message: 'Login realizado com sucesso.', user: { username: user.username } });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Rotas para transações
app.get('/api/transactions', async (req, res) => {
    const { usuario, mes, ano } = req.query;
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    try {
        const transacoes = await getTransactions(usuario, mes, ano);
        res.json(transacoes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar transações.' });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { usuario, mes, ano, transacoes } = req.body;
    if (!usuario || mes === undefined || !ano || !Array.isArray(transacoes)) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    try {
        await saveTransactions(usuario, mes, ano, transacoes);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar transações.' });
    }
});

// Rotas para contas bancárias
app.get('/api/bank-accounts', async (req, res) => {
    const { usuario, mes, ano } = req.query;
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    try {
        const contas = await getBankAccounts(usuario, mes, ano);
        res.json(contas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar contas bancárias.' });
    }
});

app.post('/api/bank-accounts', async (req, res) => {
    const { usuario, mes, ano, contas } = req.body;
    if (!usuario || mes === undefined || !ano || !Array.isArray(contas)) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    try {
        await saveBankAccounts(usuario, mes, ano, contas);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar contas bancárias.' });
    }
});

// Rotas para cofrinhos
app.get('/api/cofrinhos', async (req, res) => {
    const { usuario, mes, ano } = req.query;
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    try {
        const cofrinhos = await getCofrinhos(usuario, mes, ano);
        res.json(cofrinhos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cofrinhos.' });
    }
});

app.post('/api/cofrinhos/add', async (req, res) => {
    const { nome, valor, descricao, usuario, mes, ano } = req.body;
    if (!nome || !valor || !usuario || mes === undefined || !ano) {
        return res.status(400).json({ success: false, message: 'Dados obrigatórios: nome, valor, usuario, mes, ano' });
    }
    try {
        const novoCofrinho = await addCofrinho({ nome, valor, descricao, usuario, mes, ano });
        res.json({ success: true, message: 'Cofrinho adicionado com sucesso.', cofrinho: novoCofrinho });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao adicionar cofrinho.' });
    }
});

app.post('/api/cofrinhos/:id/use', async (req, res) => {
    const cofrinhoId = parseInt(req.params.id);
    const { tipo, contaBancariaId, usuario, mes, ano } = req.body;
    if (!tipo || !contaBancariaId || !usuario || mes === undefined || !ano) {
        return res.status(400).json({
            success: false,
            message: 'Dados obrigatórios: tipo, contaBancariaId, usuario, mes, ano'
        });
    }
    try {
        // Buscar cofrinho
        const { rows: cofrinhos } = await pool.query('SELECT * FROM cofrinhos WHERE id = $1 AND usuario = $2 AND mes = $3 AND ano = $4', [cofrinhoId, usuario, mes, ano]);
        if (cofrinhos.length === 0) {
            return res.status(404).json({ success: false, message: 'Cofrinho não encontrado.' });
        }
        const cofrinho = cofrinhos[0];

        // Buscar conta bancária
        const { rows: contas } = await pool.query('SELECT * FROM bank_accounts WHERE id = $1 AND usuario = $2 AND mes = $3 AND ano = $4', [contaBancariaId, usuario, mes, ano]);
        if (contas.length === 0) {
            return res.status(404).json({ success: false, message: 'Conta bancária não encontrada.' });
        }
        const conta = contas[0];

        // Atualizar saldo da conta
        let novoSaldo = parseFloat(conta.balance);
        if (tipo === 'receita') {
            novoSaldo += parseFloat(cofrinho.valor);
        } else {
            novoSaldo -= parseFloat(cofrinho.valor);
        }
        await pool.query('UPDATE bank_accounts SET balance = $1 WHERE id = $2', [novoSaldo, contaBancariaId]);

        // Criar transação
        await pool.query(
            'INSERT INTO transactions (usuario, mes, ano, tipo, descricao, valor, categoria, conta_bancaria, data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [usuario, mes, ano, tipo, `${tipo === 'receita' ? 'Receita' : 'Despesa'} do cofrinho: ${cofrinho.nome}`, cofrinho.valor, tipo === 'despesa' ? 'cartao' : 'receita', contaBancariaId, new Date()]
        );

        // Remover cofrinho
        await pool.query('DELETE FROM cofrinhos WHERE id = $1', [cofrinhoId]);

        res.json({
            success: true,
            message: `Cofrinho usado como ${tipo} com sucesso.`
        });
    } catch (error) {
        console.error('Erro ao usar cofrinho:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
});

app.delete('/api/cofrinhos/:id', async (req, res) => {
    const cofrinhoId = parseInt(req.params.id);
    try {
        await deleteCofrinho(cofrinhoId);
        res.json({ success: true, message: 'Cofrinho excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir cofrinho.' });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Controle Financeiro Pro com Sistema de Login`);
    console.log(`👤 Usuários padrão: erick/123, admin/admin`);
    // Testar conexão com o banco
    try {
        const result = await pool.query('SELECT * FROM users LIMIT 1');
        console.log('✅ Conexão com o banco bem-sucedida! users:', result.rows);
    } catch (err) {
        console.error('❌ Erro ao conectar no banco ou buscar users:', err);
    }
});

