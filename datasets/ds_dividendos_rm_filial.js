function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    // 1. Colunas Oficiais (O Contrato perfeito com o HTML que acabamos de validar)
    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("NOME");
    dataset.addColumn("CNPJ");
    dataset.addColumn("ATIVO");
	dataset.addColumn("CAMPO_ZOOM");


    // 2. Parâmetros Oficiais do RM 
    var codSentenca  = "FLUIG.016"; // Sentença oficial mantida
    var codAplicacao = "T";         // Sistema global (Oficial)
    var codColigada  = 0;         // Traz todas as coligadas (Oficial)

    // Campos que o motor genérico vai extrair do XML
    var campos = new Array("CODCOLIGADA", "NOME", "CNPJ", "ATIVO");
    var params = new Array();

    params.push(DatasetFactory.createConstraint("CODSENTENCA", codSentenca, codSentenca, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODAPLICACAO", codAplicacao, codAplicacao, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST));

    try {
        // 3. Chamada REAL utilizando nossa Camada de Abstração (Bate no RM de verdade)
        var datasetRM = DatasetFactory.getDataset("ds_generic_rm_sql", campos, params, null);

        if (datasetRM != null && datasetRM.rowsCount > 0) {
            for (var i = 0; i < datasetRM.rowsCount; i++) {
	
				var ativo       = datasetRM.getValue(i, "ATIVO"); 
                if (ativo == "T") {
              
                // Extração dos dados vindos do banco de dados
	                var retColigada = datasetRM.getValue(i, "CODCOLIGADA");
	                var nome        = datasetRM.getValue(i, "NOME");
	                var cnpj        = datasetRM.getValue(i, "CNPJ");
                    var campoZoom = retColigada + " - " + nome;

                    dataset.addRow(new Array(retColigada, nome, cnpj, ativo, campoZoom));
                }
            }
        }
        return dataset;

    } catch (e) {
        log.error("ERRO [ds_dividendos_rm_filial]: " + e.toString());
        return dataset;
    }
}