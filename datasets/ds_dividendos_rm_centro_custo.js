function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    // 1. Colunas Oficiais baseadas no modelo da empresa
    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("CODCCUSTO");
    dataset.addColumn("NOME");
    dataset.addColumn("CAMPO_ZOOM");

    // 2. Parâmetros Oficiais do RM
    var codSentenca = "FLUIG.023";
    var codColigada = 0; // 
    var codAplicacao = "T";
 	var coligada = ""; // parâmetro SQL

    // Captura a coligada enviada como filtro pelo Front-end
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName.toUpperCase() == 'CODCOLIGADA') {
                coligada = constraints[i].initialValue;
            }
        }
    }

    // Campos que vamos pedir para o motor genérico trazer do banco
    var campos = new Array("CODCOLIGADA", "CODCCUSTO", "NOME");
    var params = new Array();

    params.push(DatasetFactory.createConstraint("CODSENTENCA", codSentenca, codSentenca, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODAPLICACAO", codAplicacao, codAplicacao, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST));
 	params.push(DatasetFactory.createConstraint("COLIGADA", coligada, coligada, ConstraintType.MUST));

    try {
        // 3. Chamada limpa utilizando a nossa arquitetura (Single Source of Truth)
        var datasetRM = DatasetFactory.getDataset("ds_generic_rm_sql", campos, params, null);

        if (datasetRM != null && datasetRM.rowsCount > 0) {
            for (var i = 0; i < datasetRM.rowsCount; i++) {
                // Extração dos dados
                var retColigada = datasetRM.getValue(i, "CODCOLIGADA");
                var codCCusto   = datasetRM.getValue(i, "CODCCUSTO");
                var nome        = datasetRM.getValue(i, "NOME");

                var campoZoom = codCCusto + " - " + nome;

                // Adiciona a linha formatada no dataset
                dataset.addRow(new Array(retColigada, codCCusto, nome, campoZoom));
            }
        }

        return dataset;
    } catch (e) {
        log.error("ERRO [ds_dividendos_rm_centro_custo]: " + e.toString());
        return dataset;
    }
}