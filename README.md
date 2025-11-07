# 📋 SISTEMA ICMS - DOCUMENTAÇÃO COMPLETA

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)  
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Configuração das Variáveis de Ambiente](#configuração-das-variáveis-de-ambiente)
6. [Comandos Disponíveis](#comandos-disponíveis)
7. [Funcionalidades](#funcionalidades)
8. [Estrutura de Dados](#estrutura-de-dados)
9. [Agendamento Automático](#agendamento-automático)
10. [Monitoramento e Notificações](#monitoramento-e-notificações)
11. [Resolução de Problemas](#resolução-de-problemas)
12. [Arquivos de Log](#arquivos-de-log)

---

## 🎯 Visão Geral

O Sistema ICMS é uma aplicação Node.js/TypeScript desenvolvida para automatizar a coleta, processamento e armazenamento de dados de arrecadação do ICMS (Imposto sobre Circulação de Mercadorias e Serviços) diretamente do site do CONFAZ.

### ⚡ Principais Funcionalidades:
- **Coleta Automática**: Download dos dados ICMS do site oficial
- **Processamento Inteligente**: Extração e normalização dos dados das planilhas Excel
- **Armazenamento Seguro**: Persistência em banco MySQL com transações
- **Agendamento**: Execução automática via CRON
- **Monitoramento**: Relatórios detalhados via email
- **Modos de Operação**: Incremental ou substituição completa

---

## 🔧 Pré-requisitos

### Software Necessário:
- **Node.js** >= 16.0.0
- **MySQL** >= 5.7 ou >= 8.0
- **Git** (para clonagem do repositório)

### Conhecimentos Recomendados:
- Básico de Node.js/JavaScript
- Conceitos de banco de dados MySQL
- Configuração de variáveis de ambiente
- Noções de CRON para agendamento

---

## 📦 Instalação e Configuração

### 1. Clonar o Repositório
```bash
git clone [url-do-repositorio]
cd ICMS
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Compilar TypeScript (se necessário)
```bash
npm run build
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco de Dados
```sql
CREATE DATABASE icms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Criar Usuário (Opcional)
```sql
CREATE USER 'fecomercio'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON icms.* TO 'fecomercio'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Executar Migrações
```bash
npm run migration:run
```

---

## ⚙️ Configuração das Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```properties
# =================================================================
# SISTEMA ICMS - CONFIGURAÇÕES
# =================================================================

# -----------------------------------------------------------------
# AMBIENTE DE EXECUÇÃO
# -----------------------------------------------------------------
NODE_ENV=production

# -----------------------------------------------------------------
# CONFIGURAÇÕES DO BANCO DE DADOS MYSQL
# -----------------------------------------------------------------
HOST="localhost"
DB_USER="fecomercio"
DB_NAME="icms"
DB_PORT=3306
PASSWORD="sua_senha_mysql"

# -----------------------------------------------------------------
# CONFIGURAÇÃO DA API
# -----------------------------------------------------------------
BASE_URL=https://www.confaz.fazenda.gov.br/boletim-arrecadacao/sigdef-1.xlsx

# -----------------------------------------------------------------
# CONFIGURAÇÕES DE EMAIL/SMTP
# -----------------------------------------------------------------
EXCHANGE_HOST=smtp.office365.com
EXCHANGE_PORT=587
MAIL_USERNAME=no-reply@suaempresa.com.br
MAIL_PASSWORD=sua_senha_email
NOTIFICATION_EMAIL="destinatario@suaempresa.com.br"

# -----------------------------------------------------------------
# CONFIGURAÇÕES DE AGENDAMENTO CRON
# -----------------------------------------------------------------
# Formato: "minuto hora dia mês dia_da_semana"
SCHEDULE_ICMS="0 2 5 * *"  # Todo dia 5 às 02:00

# -----------------------------------------------------------------
# METODOLOGIA DE PROCESSAMENTO
# -----------------------------------------------------------------
# 'Incremental' = Adiciona apenas novos períodos
# 'Truncate and Load' = Substitui todos os dados
PROCESSING_METHOD='Incremental'
```

### 📋 Explicação das Configurações:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `development`, `production` |
| `HOST` | Endereço do servidor MySQL | `localhost`, `192.168.1.100` |
| `DB_USER` | Usuário do banco de dados | `fecomercio` |
| `DB_NAME` | Nome do banco de dados | `icms` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `PASSWORD` | Senha do banco de dados | `sua_senha` |
| `BASE_URL` | URL da planilha ICMS | URL do CONFAZ |
| `SCHEDULE_ICMS` | Agendamento CRON | `"0 2 5 * *"` |
| `PROCESSING_METHOD` | Modo de processamento | `Incremental` ou `Truncate and Load` |

---

## 🚀 Comandos Disponíveis

### Comandos de Execução:

```bash
# Iniciar aplicação com agendamento automático
npm start

# Executar em modo desenvolvimento
npm run dev

# Forçar execução imediata (com monitoramento)
npm run force

# Forçar execução em produção
npm run force-prod

# Compilar TypeScript
npm run build
```

### Comandos de Banco de Dados:

```bash
# Executar migrações
npm run migration:run

# Reverter última migração
npm run migration:revert

# Gerar nova migração
npm run migration:generate NomeDaMigracao

# Executar comando TypeORM customizado
npm run typeorm [comando]
```

---

## 🔄 Funcionalidades

### 1. Coleta Automática de Dados
- **Fonte**: Site oficial CONFAZ
- **Formato**: Planilha Excel (.xlsx)
- **Frequência**: Configurável via CRON
- **Armazenamento**: Preserva arquivo original + JSON processado

### 2. Processamento de Dados
- **Extração**: Leitura inteligente da planilha Excel
- **Normalização**: Conversão para formato padrão do banco
- **Validação**: Verificação de integridade dos dados
- **Mapeamento**: Conversão automática de colunas CNAE

### 3. Persistência no Banco
- **Transações**: Garantia de consistência dos dados
- **Batch Insert**: Processamento otimizado em lotes
- **Rollback**: Reversão automática em caso de erro
- **Duplicatas**: Prevenção automática de registros duplicados

### 4. Modos de Operação

#### Modo Incremental (Recomendado)
- Mantém dados existentes
- Adiciona apenas períodos novos
- Detecta e preenche lacunas
- Ideal para execução contínua

#### Modo Truncate and Load
- Remove todos os dados existentes
- Carrega dados completos do arquivo
- Garante base totalmente atualizada
- Ideal para recarga completa

---

## 📊 Estrutura de Dados

### Tabela ICMS

A estrutura principal armazena dados de arrecadação organizados por:

```sql
CREATE TABLE icms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_uf INT,
    uf VARCHAR(2),
    periodo VARCHAR(20),
    ano INT,
    mes INT,
    
    -- Outros tributos
    ipva_total DECIMAL(15,2),
    itcmd_total DECIMAL(15,2),
    taxa_total DECIMAL(15,2),
    outras_receitas_tributarias DECIMAL(15,2),
    total_outros_tributos DECIMAL(15,2),
    
    -- Dívidas ativas
    divida_ativa_icms DECIMAL(15,2),
    divida_ativa_ipva DECIMAL(15,2),
    divida_ativa_itcmd DECIMAL(15,2),
    total_dividas_ativas DECIMAL(15,2),
    
    -- Seções CNAE (A-U + ZZ)
    secao_a_agricultura DECIMAL(15,2),
    secao_b_industrias_extrativas DECIMAL(15,2),
    secao_c_industrias_transformacao DECIMAL(15,2),
    -- ... outras seções
    secao_zz_cnae_nao_identificado DECIMAL(15,2),
    
    -- Divisões CNAE (01-99)
    divisao_01_agricultura_pecuaria DECIMAL(15,2),
    divisao_02_producao_florestal DECIMAL(15,2),
    -- ... outras divisões
    
    -- Totais
    total_icms DECIMAL(15,2),
    total_icms_outros_tributos DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Campos Principais:
- **Identificação**: UF, período, ano, mês
- **ICMS por Seção**: 22 seções CNAE (A-U + ZZ)
- **ICMS por Divisão**: 120+ divisões específicas
- **Outros Tributos**: IPVA, ITCMD, Taxas
- **Dívidas Ativas**: Recuperação de tributos
- **Totalizadores**: Consolidações gerais

---

## ⏰ Agendamento Automático

### Configuração CRON

O sistema utiliza expressões CRON para agendamento automático:

```bash
# Formato: "minuto hora dia mês dia_da_semana"

# Exemplos comuns:
SCHEDULE_ICMS="0 2 5 * *"    # Todo dia 5 às 02:00
SCHEDULE_ICMS="0 8 * * 1"    # Toda segunda às 08:00  
SCHEDULE_ICMS="30 14 1,15 * *" # Dias 1 e 15 às 14:30
SCHEDULE_ICMS="0 */6 * * *"    # A cada 6 horas
```

### Expressões CRON Úteis:

| Expressão | Descrição |
|-----------|-----------|
| `"0 2 1 * *"` | Primeiro dia do mês às 02:00 |
| `"0 8 * * 1-5"` | Segunda a sexta às 08:00 |
| `"30 14 * * 0"` | Domingo às 14:30 |
| `"0 */4 * * *"` | A cada 4 horas |
| `"15 10 15 * *"` | Dia 15 de cada mês às 10:15 |

### Iniciar Agendamento:

```bash
npm start
```

O sistema ficará ativo aguardando os horários agendados.

---

## 📧 Monitoramento e Notificações

### Relatórios Automáticos

Após cada execução, é enviado um relatório detalhado por email contendo:

- **Resumo Executivo**: Sucessos, falhas, tempo de execução
- **Período Processado**: Datas de início e fim
- **Estatísticas**: Total de registros, taxa de sucesso
- **Detalhes Técnicos**: Performance, logs de erro
- **Status do Sistema**: Saúde geral da aplicação

### Exemplo de Relatório:
```
=== RELATÓRIO ICMS - 2024-03-15 02:00 ===

📊 RESUMO EXECUTIVO:
• Total de registros: 2.847
• Sucessos: 2.847 (100.0%)
• Falhas: 0 (0.0%)
• Tempo de execução: 45 segundos
• Performance: 63 registros/segundo

📅 PERÍODO PROCESSADO:
• Data início: 2020-01
• Data fim: 2024-02
• Modo: Incremental
• Novos períodos: 3

⚡ STATUS TÉCNICO:
• Conexão BD: OK
• Download arquivo: OK
• Processamento: OK
• Notificação: OK
```

### Configuração de Email:

Ajuste as configurações SMTP no `.env`:

```properties
EXCHANGE_HOST=smtp.office365.com
EXCHANGE_PORT=587
MAIL_USERNAME=sistema@empresa.com
MAIL_PASSWORD=senha_do_email
NOTIFICATION_EMAIL="admin@empresa.com,gestor@empresa.com"
```

---

## 🔍 Resolução de Problemas

### Problemas Comuns:

#### 1. Erro de Conexão com Banco
```bash
❌ Erro ao conectar banco de dados
```
**Soluções:**
- Verificar se MySQL está rodando
- Conferir credenciais no `.env`
- Testar conexão manual
- Verificar firewall/portas

#### 2. Erro no Download da Planilha
```bash
❌ Erro ao baixar arquivo ICMS
```
**Soluções:**
- Verificar conectividade com internet
- Testar URL manualmente no navegador
- Verificar proxy/firewall corporativo
- Aguardar e tentar novamente

#### 3. Erro no Processamento Excel
```bash
❌ Erro ao processar arquivo Excel
```
**Soluções:**
- Verificar integridade do arquivo baixado
- Confirmar formato da planilha
- Verificar espaço em disco
- Analisar logs detalhados

#### 4. Falha na Migração
```bash
❌ Erro ao executar migração
```
**Soluções:**
- Verificar permissões do usuário BD
- Conferir estrutura do banco
- Executar migração manualmente
- Verificar versão do MySQL

### Logs Detalhados:

Para debug avançado, analise:
- Console da aplicação
- Arquivos na pasta `storage/`
- Logs do MySQL
- Relatórios de email

---

## 📁 Arquivos de Log

### Estrutura de Armazenamento:
```
storage/
├── icms_2024-03-15_02-00-00/
│   ├── icms_original_2024-03-15_02-00-00.xlsx  # Arquivo original
│   └── icms_original_2024-03-15_02-00-00.json  # Dados processados
├── icms_2024-03-14_02-00-00/
└── icms_2024-03-13_02-00-00/
```

### Tipos de Arquivo:
- **`.xlsx`**: Planilha original do CONFAZ
- **`.json`**: Dados extraídos e normalizados
- **Pasta datada**: Organização cronológica

### Retenção:
- Arquivos são mantidos para auditoria
- Limpeza manual quando necessário
- Backup recomendado antes da limpeza

---

## 📞 Suporte e Manutenção

### Comandos de Diagnóstico:

```bash
# Verificar status da aplicação
npm start

# Testar conexão com banco
npm run migration:run

# Executar coleta manual
npm run force

# Verificar logs
tail -f storage/*/icms_*.json
```

### Manutenção Preventiva:

1. **Semanal**:
   - Verificar logs de erro
   - Confirmar execução dos agendamentos
   - Validar recebimento de relatórios

2. **Mensal**:
   - Backup do banco de dados
   - Limpeza de arquivos antigos
   - Análise de performance

3. **Semestral**:
   - Atualização de dependências
   - Revisão de configurações
   - Teste de recuperação

### Contatos de Suporte:
- **Desenvolvimento**: [email-dev@empresa.com]
- **Infraestrutura**: [infra@empresa.com]
- **Usuário Final**: [suporte@empresa.com]

---

## 📊 Exemplos de Uso

### Consultas SQL Úteis:

```sql
-- Arrecadação total por UF no último ano
SELECT uf, SUM(total_icms) as total_arrecadacao
FROM icms 
WHERE ano = 2024 
GROUP BY uf 
ORDER BY total_arrecadacao DESC;

-- Evolução mensal da arrecadação
SELECT periodo, SUM(total_icms) as total
FROM icms 
WHERE ano >= 2023
GROUP BY periodo 
ORDER BY periodo;

-- Top 5 seções CNAE por arrecadação
SELECT 
    SUM(secao_c_industrias_transformacao) as industrias,
    SUM(secao_g_comercio) as comercio,
    SUM(secao_h_transporte) as transporte
FROM icms 
WHERE ano = 2024;

-- Verificar integridade dos dados
SELECT COUNT(*) as total_registros,
       COUNT(DISTINCT periodo) as periodos_unicos,
       MIN(periodo) as periodo_inicial,
       MAX(periodo) as periodo_final
FROM icms;
```

### Scripts de Automação:

```bash
#!/bin/bash
# Script para backup e execução

# Backup do banco
mysqldump -u fecomercio -p icms > backup_icms_$(date +%Y%m%d).sql

# Executar coleta
cd /caminho/para/icms
npm run force

# Verificar resultado
echo "Execução concluída em $(date)"
```

---

## 🎯 Melhores Práticas

### Configuração:
- ✅ Use modo `Incremental` para produção
- ✅ Configure agendamento para horários de baixo uso
- ✅ Monitore espaço em disco regularmente
- ✅ Mantenha backup das configurações

### Segurança:
- ✅ Proteja credenciais no arquivo `.env`
- ✅ Use usuário de banco com permissões mínimas
- ✅ Configure firewall para acesso restrito
- ✅ Monitore logs de acesso

### Performance:
- ✅ Execute em horários de menor carga
- ✅ Monitore consumo de memória/CPU
- ✅ Configure timeout adequado para downloads
- ✅ Use índices apropriados no banco

### Monitoramento:
- ✅ Configure alertas para falhas
- ✅ Valide relatórios automaticamente
- ✅ Mantenha histórico de execuções
- ✅ Documente mudanças de configuração

---

## 📈 Roadmap e Melhorias

### Próximas Versões:
- 🔄 Interface web para monitoramento
- 📊 Dashboard analítico
- 🔔 Alertas via Slack/Teams
- 📱 App mobile para gestores
- 🤖 IA para detecção de anomalias

### Sugestões de Melhoria:
- Paralelização do processamento
- Cache inteligente de dados
- API REST para integração
- Exportação automatizada para BI

---

*© 2024 Sistema ICMS - Documentação v1.0*
*Última atualização: 7 de novembro de 2024*