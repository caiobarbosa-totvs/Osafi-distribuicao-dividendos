function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    // ========== LOG: INÍCIO DA EXECUÇÃO ==========
    log.info("==================================================");
    log.info("INICIANDO ds_dividendos_rm_socio.js");
    log.info("==================================================");

    // 1. Colunas Oficiais baseadas no modelo do RM
    dataset.addColumn("CODIGO");            // Código do Fornecedor/Sócio
    dataset.addColumn("RAZAO_SOCIAL");      // Razão social legal
    dataset.addColumn("NOME");              // Nome fantasia
    dataset.addColumn("CNPJ");              // CGCCFO (CNPJ ou CPF formatado)
    dataset.addColumn("ATIVO");             // Status: SIM/NAO
    dataset.addColumn("STATUS_BLOQUEIO");   // CFOIMOB: SIM(bloqueado) / NAO(desbloqueado)
    dataset.addColumn("TIPO_PAGAMENTO");    // Descrição do tipo de pagamento
    dataset.addColumn("BANCO");             // Número do banco
    dataset.addColumn("AGENCIA");           // Código da agência
    dataset.addColumn("DIGITO_AGENCIA");    // Dígito da agência
    dataset.addColumn("CONTA_CORRENTE");    // Número da conta
    dataset.addColumn("DIGITO_CC");         // Dígito da conta
    dataset.addColumn("CHAVE_PIX");         // Chave PIX (se houver)
    dataset.addColumn("CAMPO_ZOOM");        // Campo formatado para zoom (exibição)

    log.info("[LOG] Colunas do dataset criadas com sucesso");

    // 2. Parâmetros Oficiais do RM (Sentença FLUIG.050)
    var codSentenca = "FLUIG.050";
    var codAplicacao = "F";     // Sistema Financeiro
    var codColigada = 0;        // Traz de TODAS as coligadas

    log.info("[LOG] Parâmetros padrão inicializados:");
    log.info("      - codSentenca: " + codSentenca);
    log.info("      - codAplicacao: " + codAplicacao);
    log.info("      - codColigada: " + codColigada);

    // ========== LOG: CONFIGURAÇÃO SEM FILTROS ==========
    log.info("[LOG] Configurando dataset SEM filtros de CODCFO/ATIVO");
    log.info("[LOG] Retornará TODOS os sócios ativos conforme FLUIG.050");

    // Campos que vamos pedir para o motor genérico trazer do banco
    var campos = new Array("CODIGO", "RAZAO_SOCIAL", "NOME", "CNPJ", "ATIVO", 
                          "STATUS_BLOQUEIO", "TIPO_PAGAMENTO", "BANCO", "AGENCIA", "DIGITO_AGENCIA", 
                          "CONTA_CORRENTE", "DIGITO_CC", "CHAVE_PIX");
    var params = new Array();

    log.info("[LOG] Campos solicitados ao motor genérico: " + campos.join(", "));

    // ========== LOG: CRIAÇÃO DE CONSTRAINTS (OBRIGATÓRIOS APENAS) ==========
    params.push(DatasetFactory.createConstraint("CODSENTENCA", codSentenca, codSentenca, ConstraintType.MUST));
    log.info("[LOG] Constraint criado: CODSENTENCA = " + codSentenca);
    
    params.push(DatasetFactory.createConstraint("CODAPLICACAO", codAplicacao, codAplicacao, ConstraintType.MUST));
    log.info("[LOG] Constraint criado: CODAPLICACAO = " + codAplicacao);
    
    params.push(DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST));
    log.info("[LOG] Constraint criado: CODCOLIGADA = " + codColigada);
    
    // ⚠️ IMPORTANTE: A sentença FLUIG.050 tem parâmetros :CODCFO e :ATIVO na query
    // Se não fornecermos valores, a query retorna 0 registros
    // Solução: Enviar valores que aceitam TODOS (% para LIKE ou deixar em branco)
    params.push(DatasetFactory.createConstraint("CODCFO", "%", "%", ConstraintType.MUST));
    log.info("[LOG] Constraint criado: CODCFO = % (aceita todos)");
    
    params.push(DatasetFactory.createConstraint("ATIVO", "%", "%", ConstraintType.MUST));
    log.info("[LOG] Constraint criado: ATIVO = % (aceita todos)");

    try {
        // 3. Chamada REAL utilizando nossa Camada de Abstração (Bate no RM de verdade)
        log.info("[LOG] ========== CHAMANDO ds_generic_rm_sql ==========");
        log.info("[LOG] Dataset: ds_generic_rm_sql");
        log.info("[LOG] Campos solicitados: " + campos.length + " campos");
        log.info("[LOG] Constraints: " + params.length + " constraints");
        
        var datasetRM = DatasetFactory.getDataset("ds_generic_rm_sql", campos, params, null);

        log.info("[LOG] Retorno do ds_generic_rm_sql recebido");
        
        if (datasetRM == null) {
            log.error("[ERRO] ds_generic_rm_sql retornou NULL!");
            return dataset;
        }
        
        log.info("[LOG] Dataset retornado não é null");
        log.info("[LOG] Quantidade de linhas retornadas: " + datasetRM.rowsCount);

        if (datasetRM.rowsCount > 0) {
            log.info("[LOG] Processando " + datasetRM.rowsCount + " registro(s)...");
            
            for (var i = 0; i < datasetRM.rowsCount; i++) {
                // Extração dos dados vindos do banco de dados
                var codigo = datasetRM.getValue(i, "CODIGO");
                var razaoSocial = datasetRM.getValue(i, "RAZAO_SOCIAL");
                var nome = datasetRM.getValue(i, "NOME");
                var cnpj = datasetRM.getValue(i, "CNPJ");
                var ativoVal = datasetRM.getValue(i, "ATIVO");
                var statusBloqueio = datasetRM.getValue(i, "STATUS_BLOQUEIO");
                var tipoPagamento = datasetRM.getValue(i, "TIPO_PAGAMENTO");
                var banco = datasetRM.getValue(i, "BANCO");
                var agencia = datasetRM.getValue(i, "AGENCIA");
                var digitoAgencia = datasetRM.getValue(i, "DIGITO_AGENCIA");
                var contaCorrente = datasetRM.getValue(i, "CONTA_CORRENTE");
                var digitoCc = datasetRM.getValue(i, "DIGITO_CC");
                var chavePix = datasetRM.getValue(i, "CHAVE_PIX");
                
                log.info("[LOG] Linha " + (i+1) + ": CODIGO=" + codigo + " | RAZAO_SOCIAL=" + razaoSocial + 
                         " | CNPJ=" + cnpj + " | STATUS_BLOQUEIO=" + statusBloqueio);
                
                // Formata campo para zoom (exibição no formulário)
                var campoZoom = razaoSocial + " (" + cnpj + ")";

                // Adiciona a linha formatada no dataset
                dataset.addRow(new Array(codigo, razaoSocial, nome, cnpj, ativoVal, statusBloqueio,
                                        tipoPagamento, banco, agencia, digitoAgencia, 
                                        contaCorrente, digitoCc, chavePix, campoZoom));
            }
            log.info("[LOG] ✓ Todas as " + datasetRM.rowsCount + " linhas foram adicionadas ao dataset");
        } else {
            log.warn("[AVISO] ds_generic_rm_sql retornou 0 registros (rowsCount = 0)");
            log.warn("[AVISO] Verifique: 1) Se a sentença FLUIG.050 está correta");
            log.warn("[AVISO] Verifique: 2) Se existem dados no RM ativos com CODTCF=1000");
            log.warn("[AVISO] Verifique: 3) Se os constraints foram aplicados corretamente");
        }
        
        log.info("[LOG] Retornando dataset com " + dataset.rowsCount + " linha(s)");
        log.info("==================================================");
        return dataset;
        
    } catch (e) {
        log.error("==================================================");
        log.error("[ERRO CRÍTICO] Exceção em ds_dividendos_rm_socio.js");
        log.error("[ERRO] Mensagem: " + e.toString());
        log.error("[ERRO] Stack: " + e.stack);
        log.error("==================================================");
        return dataset;
    }
}