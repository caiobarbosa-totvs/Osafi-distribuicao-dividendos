function createDataset(fields, constraints, sortFields) {
    // 1. Instancia o construtor nativo do dataset no Fluig
    var dataset = DatasetBuilder.newDataset();
    
    // 2. Cria as colunas exatas que o seu HTML (data-zoom) e o JS estão esperando
    dataset.addColumn("CPF_CNPJ");
    dataset.addColumn("NOME_SOCIO");
    dataset.addColumn("BANCO");
    dataset.addColumn("AGENCIA");
    dataset.addColumn("CONTA");
	dataset.addColumn("STATUS_BLOQUEIO");

    // 3. Parâmetros de Integração Específicos do RM (Ajuste para a sua realidade)
    var codSentenca  = 'FLUIG.016';
    var codAplicacao = 'F';       
    var codColigada  = '0';
    
    // 4. Captura e Tratamento de Constraints (Filtros que vêm da tela)
	var filtroBusca = '';
	var colunaFiltro = '';
	
	if (constraints != null) {
	    for (var i = 0; i < constraints.length; i++) {
	        var nomeCampo = constraints[i].fieldName.toUpperCase();
	        // O Fluig pode mandar a busca tanto pelo CPF quanto pelo NOME_SOCIO
	        if (nomeCampo == 'CPF_CNPJ' || nomeCampo == 'NOME_SOCIO') {
	            colunaFiltro = nomeCampo;
	            filtroBusca = constraints[i].initialValue;
	        }
	    }
	}


    // 5. Array de campos que o RM deve devolver e montagem dos parâmetros para o Genérico
    var campos = new Array("CPF_CNPJ", "NOME_SOCIO", "BANCO", "AGENCIA", "CONTA", "STATUS_BLOQUEIO");
    var params = new Array();

    // Adiciona os parâmetros obrigatórios exigidos pelo seu ds_dividendos_generic_rm_sql
    params.push(DatasetFactory.createConstraint("CODSENTENCA", codSentenca, codSentenca, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODAPLICACAO", codAplicacao, codAplicacao, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST));

    // Se houver um filtro de CPF (buscado no Zoom), adiciona na constraint do RM
    if (filtroBusca !== '') {
    	// Envia para o RM a mesma coluna que o usuário usou na pesquisa
    	params.push(DatasetFactory.createConstraint(colunaFiltro, filtroBusca, filtroBusca, ConstraintType.MUST));
	}

    try {
        // 6. Chamada ao Motor Genérico (Aqui trocamos o nome do exemplo para o seu dataset real)
        var datasetRM = DatasetFactory.getDataset("ds_dividendos_generic_rm_sql", campos, params, null);

        // Se a integração falhar ou não retornar dados, devolvemos o dataset vazio mas estruturado
        if (datasetRM == null || datasetRM == undefined || datasetRM.rowsCount < 1) {
            return dataset;
        }

        // 7. Varre o resultado do RM e converte em linhas para o Dataset do Fluig
        for (var i = 0; i < datasetRM.rowsCount; i++) {
            var cpfCnpj = datasetRM.getValue(i, "CPF_CNPJ");
            var nome    = datasetRM.getValue(i, "NOME_SOCIO");
            var banco   = datasetRM.getValue(i, "BANCO");
            var agencia = datasetRM.getValue(i, "AGENCIA");
            var conta   = datasetRM.getValue(i, "CONTA");
			var status  = datasetRM.getValue(i, "STATUS_BLOQUEIO");

            // Adiciona a linha (add r)
            dataset.addRow(new Array(cpfCnpj, nome, banco, agencia, conta, status));
        }

        return dataset;

    } catch (e) {
        // Tratamento de Erro: Evita que a tela do usuário quebre com um stacktrace de Java
        log.error("ERRO [ds_rm_socios]: " + e.toString());
        // Opcional: Retornar uma linha de erro visual para facilitar o debug em tela
        dataset.addRow(new Array("ERRO", "Falha na comunicação com o RM", "", "", "", ""));
        return dataset;
    }
}