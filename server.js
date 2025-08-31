const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Diretório para dados
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Arquivos de dados
const usersFile = path.join(dataDir, 'users.json');
const transactionsFile = path.join(dataDir, 'transactions.json');
const bankAccountsFile = path.join(dataDir, 'bank-accounts.json');
const cofrinhosFile = path.join(dataDir, 'cofrinhos.json');

// Funções auxiliares para carregar e salvar dados
function loadUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
    
    // Criar usuário padrão se não existir
    const defaultUsers = [
        { username: 'erick', password: '123' },
        { username: 'admin', password: 'admin' }
    ];
    saveUsers(defaultUsers);
    return defaultUsers;
}

function saveUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erro ao salvar usuários:', error);
    }
}

function loadTransactions() {
    try {
        if (fs.existsSync(transactionsFile)) {
            const data = fs.readFileSync(transactionsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
    }
    return {};
}

function saveTransactions(transactions) {
    try {
        fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2));
    } catch (error) {
        console.error('Erro ao salvar transações:', error);
    }
}

function loadBankAccounts() {
    try {
        if (fs.existsSync(bankAccountsFile)) {
            const data = fs.readFileSync(bankAccountsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar contas bancárias:', error);
    }
    return {};
}

function saveBankAccounts(bankAccounts) {
    try {
        fs.writeFileSync(bankAccountsFile, JSON.stringify(bankAccounts, null, 2));
    } catch (error) {
        console.error('Erro ao salvar contas bancárias:', error);
    }
}

function loadCofrinhos() {
    try {
        if (fs.existsSync(cofrinhosFile)) {
            const data = fs.readFileSync(cofrinhosFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar cofrinhos:', error);
    }
    return {};
}

function saveCofrinhos(cofrinhos) {
    try {
        fs.writeFileSync(cofrinhosFile, JSON.stringify(cofrinhos, null, 2));
    } catch (error) {
        console.error('Erro ao salvar cofrinhos:', error);
    }
}

// Função para gerar chave única para dados por usuário/mês/ano
function generateKey(usuario, mes, ano) {
    return `${usuario}_${mes}_${ano}`;
}

// Rotas de autenticação
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Usuário e senha são obrigatórios.'
        });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            message: 'Login realizado com sucesso.',
            user: { username: user.username }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Usuário ou senha incorretos.'
        });
    }
});

// Rotas para transações
app.get('/api/transactions', (req, res) => {
    const { usuario, mes, ano } = req.query;
    
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    
    const allTransactions = loadTransactions();
    const key = generateKey(usuario, mes, ano);
    const userTransactions = allTransactions[key] || [];
    
    res.json(userTransactions);
});

app.post('/api/transactions', (req, res) => {
    const { usuario, mes, ano, transacoes } = req.body;
    
    if (!usuario || mes === undefined || !ano || !Array.isArray(transacoes)) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    const allTransactions = loadTransactions();
    const key = generateKey(usuario, mes, ano);
    allTransactions[key] = transacoes;
    
    saveTransactions(allTransactions);
    res.json({ success: true });
});

// Rotas para contas bancárias
app.get('/api/bank-accounts', (req, res) => {
    const { usuario, mes, ano } = req.query;
    
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    
    const allBankAccounts = loadBankAccounts();
    const key = generateKey(usuario, mes, ano);
    const userBankAccounts = allBankAccounts[key] || [];
    
    res.json(userBankAccounts);
});

app.post('/api/bank-accounts', (req, res) => {
    const { usuario, mes, ano, contas } = req.body;
    
    if (!usuario || mes === undefined || !ano || !Array.isArray(contas)) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    const allBankAccounts = loadBankAccounts();
    const key = generateKey(usuario, mes, ano);
    allBankAccounts[key] = contas;
    
    saveBankAccounts(allBankAccounts);
    res.json({ success: true });
});

// Rotas para cofrinhos
app.get('/api/cofrinhos', (req, res) => {
    const { usuario, mes, ano } = req.query;
    
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: usuario, mes, ano' });
    }
    
    const allCofrinhos = loadCofrinhos();
    const key = generateKey(usuario, mes, ano);
    const userCofrinhos = allCofrinhos[key] || [];
    
    res.json(userCofrinhos);
});

app.post('/api/cofrinhos/add', (req, res) => {
    const { nome, valor, descricao, usuario, mes, ano } = req.body;
    
    if (!nome || !valor || !usuario || mes === undefined || !ano) {
        return res.status(400).json({
            success: false,
            message: 'Dados obrigatórios: nome, valor, usuario, mes, ano'
        });
    }
    
    const allCofrinhos = loadCofrinhos();
    const key = generateKey(usuario, mes, ano);
    
    if (!allCofrinhos[key]) {
        allCofrinhos[key] = [];
    }
    
    const novoCofrinho = {
        id: Date.now(),
        nome: nome,
        valor: valor,
        descricao: descricao || '',
        dataCreacao: new Date().toISOString()
    };
    
    allCofrinhos[key].push(novoCofrinho);
    saveCofrinhos(allCofrinhos);
    
    res.json({
        success: true,
        message: 'Cofrinho adicionado com sucesso.',
        cofrinho: novoCofrinho
    });
});

app.post('/api/cofrinhos/:id/use', (req, res) => {
    const cofrinhoId = parseInt(req.params.id);
    const { tipo, contaBancariaId, usuario, mes, ano } = req.body;
    
    if (!tipo || !contaBancariaId || !usuario || mes === undefined || !ano) {
        return res.status(400).json({
            success: false,
            message: 'Dados obrigatórios: tipo, contaBancariaId, usuario, mes, ano'
        });
    }
    
    try {
        // Carregar cofrinhos
        const allCofrinhos = loadCofrinhos();
        const key = generateKey(usuario, mes, ano);
        const userCofrinhos = allCofrinhos[key] || [];
        
        // Encontrar cofrinho
        const cofrinhoIndex = userCofrinhos.findIndex(c => c.id === cofrinhoId);
        if (cofrinhoIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Cofrinho não encontrado.'
            });
        }
        
        const cofrinho = userCofrinhos[cofrinhoIndex];
        
        // Carregar contas bancárias
        const allBankAccounts = loadBankAccounts();
        const userBankAccounts = allBankAccounts[key] || [];
        
        // Encontrar conta bancária
        const accountIndex = userBankAccounts.findIndex(acc => acc.id === parseInt(contaBancariaId));
        if (accountIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Conta bancária não encontrada.'
            });
        }
        
        // Atualizar saldo da conta
        if (tipo === 'receita') {
            userBankAccounts[accountIndex].balance += cofrinho.valor;
        } else {
            userBankAccounts[accountIndex].balance -= cofrinho.valor;
        }
        
        // Carregar transações
        const allTransactions = loadTransactions();
        const userTransactions = allTransactions[key] || [];
        
        // Criar transação
        const novaTransacao = {
            id: Date.now(),
            tipo: tipo,
            descricao: `${tipo === 'receita' ? 'Receita' : 'Despesa'} do cofrinho: ${cofrinho.nome}`,
            valor: cofrinho.valor,
            categoria: tipo === 'despesa' ? 'cartao' : 'receita',
            contaBancaria: parseInt(contaBancariaId),
            data: new Date(),
            mes: parseInt(mes),
            ano: parseInt(ano),
            usuario: usuario
        };
        
        userTransactions.push(novaTransacao);
        
        // Remover cofrinho
        userCofrinhos.splice(cofrinhoIndex, 1);
        
        // Salvar tudo
        allCofrinhos[key] = userCofrinhos;
        allBankAccounts[key] = userBankAccounts;
        allTransactions[key] = userTransactions;
        
        saveCofrinhos(allCofrinhos);
        saveBankAccounts(allBankAccounts);
        saveTransactions(allTransactions);
        
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

app.delete('/api/cofrinhos/:id', (req, res) => {
    const cofrinhoId = parseInt(req.params.id);
    const { usuario, mes, ano } = req.body;
    
    if (!usuario || mes === undefined || !ano) {
        return res.status(400).json({
            success: false,
            message: 'Dados obrigatórios: usuario, mes, ano'
        });
    }
    
    const allCofrinhos = loadCofrinhos();
    const key = generateKey(usuario, mes, ano);
    const userCofrinhos = allCofrinhos[key] || [];
    
    const cofrinhoIndex = userCofrinhos.findIndex(c => c.id === cofrinhoId);
    if (cofrinhoIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Cofrinho não encontrado.'
        });
    }
    
    userCofrinhos.splice(cofrinhoIndex, 1);
    allCofrinhos[key] = userCofrinhos;
    saveCofrinhos(allCofrinhos);
    
    res.json({
        success: true,
        message: 'Cofrinho excluído com sucesso.'
    });
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Controle Financeiro Pro com Sistema de Login`);
    console.log(`👤 Usuários padrão: erick/123, admin/admin`);
    console.log(`💾 Dados salvos em: ${dataDir}`);
});

