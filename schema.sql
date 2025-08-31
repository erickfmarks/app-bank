-- Script para criar as tabelas necessárias no PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(15,2) NOT NULL,
    UNIQUE(usuario, mes, ano, name)
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descricao TEXT,
    valor NUMERIC(15,2) NOT NULL,
    categoria VARCHAR(50),
    conta_bancaria INTEGER,
    data TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (conta_bancaria) REFERENCES bank_accounts(id)
);

CREATE TABLE IF NOT EXISTS cofrinhos (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    descricao TEXT,
    data_creacao TIMESTAMP NOT NULL DEFAULT NOW()
);
