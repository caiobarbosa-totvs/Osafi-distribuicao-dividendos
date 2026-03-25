function servicetask52(attempt, message) {
    try {
        var CODTBORCAMENTO = hAPI.getCardValue("_TXT_CODIGO_NATUREZA");
        if (CODTBORCAMENTO == "" || CODTBORCAMENTO == null || CODTBORCAMENTO == undefined){
        	CODTBORCAMENTO = hAPI.getCardValue("TXT_CODIGO_NATUREZA");
        }

        var dsColigada = DatasetFactory.getDataset("ds_coligadas_ativas", null, null, null);

        if (dsColigada != null && dsColigada.rowsCount > 0) {
            for (var i = 0; i < dsColigada.rowsCount; i++) {
                var CODCOLIGADA = dsColigada.getValue(i, "CODCOLIGADA");
                log.info("CODCOLIGADA: " + CODCOLIGADA)
                try {
                	var indexes = hAPI.getChildrenIndexes("tabelaContaContabil");
                	log.info("TAMANHO TABELA DE CONTA: " + indexes.length)
                	for(var k = 0; k < indexes.length; k++) {
                		log.info("código: " + hAPI.getCardValue("codContaContabil___" + indexes[k]))
                		var CODCONTA = hAPI.getCardValue("codContaContabil___" + indexes[k]);
                		var CLASSCONTA = hAPI.getCardValue("classificacaoConta___" + indexes[k]);
                		
                		
                		var constraintsIdCfoCont = [DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)];
                	    var datasetIdOrcamento = DatasetFactory.getDataset("ds_consulta_idtborcamentocont", null, constraintsIdCfoCont, null);
                	    var IDTBORCAMENTOCONT = 1;
                	    
                	    if (datasetIdOrcamento != null && datasetIdOrcamento.rowsCount > 0) {
                	        for (var l = 0; l < datasetIdOrcamento.rowsCount; l++) {
                	            var idAtual = parseInt(datasetIdOrcamento.getValue(l, "IDTBORCAMENTOCONT"));
                	            if (idAtual >= IDTBORCAMENTOCONT) {
                	            	IDTBORCAMENTOCONT = idAtual + 1;
                	            }
                	            
                	        }
                	    }
                	    
                	    log.info("passou por IDTBORCAMENTOCONT pela " + indexes[k] + " vez na coligada " + CODCOLIGADA)
                		
                		
                		var constraints = [
                            DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                            DatasetFactory.createConstraint("CODTBORCAMENTO", CODTBORCAMENTO, CODTBORCAMENTO, ConstraintType.MUST),
                            DatasetFactory.createConstraint("CODCONTA", CODCONTA, CODCONTA, ConstraintType.MUST),
                            DatasetFactory.createConstraint("CLASSCONTA", CLASSCONTA, CLASSCONTA, ConstraintType.MUST),
                            DatasetFactory.createConstraint("IDTBORCAMENTOCONT", IDTBORCAMENTOCONT, IDTBORCAMENTOCONT, ConstraintType.MUST)
                        ];

                        var dataset = DatasetFactory.getDataset("ds_insert_ttborcamentocont", null, constraints, null);

                        if (dataset != null && dataset.rowsCount > 0) {
                            for (var j = 0; j < dataset.rowsCount; j++) {
                                log.info("Resultado para CODCOLIGADA " + CODCOLIGADA + ": " + dataset.getValue(j, "RESULTADO"));
                            }
                        } else {
                            log.warn("Nenhum resultado encontrado para CODCOLIGADA " + CODCOLIGADA);
                        }
                    }
                } catch (e) {
                    log.error("Erro ao processar CODCOLIGADA " + CODCOLIGADA + ": " + e.message);
                    throw new Error("Erro ao processar CODCOLIGADA " + CODCOLIGADA + ": " + e.message);  // Lança a exceção
                }
            }
        } else {
            log.warn("Nenhuma coligada ativa encontrada.");
            throw new Error("Nenhuma coligada ativa encontrada.");  // Lança a exceção se não houver coligadas
        }
        
        var datasetUpdate = DatasetFactory.getDataset("ds_update_gautoinc", null, null, null);
        
    } catch (e) {
        log.error("Erro geral na execução do servicetask22: " + e.message);
        throw new Error("Erro geral na execução do servicetask22: " + e.message);  // Lança a exceção para falha geral
    }
}
