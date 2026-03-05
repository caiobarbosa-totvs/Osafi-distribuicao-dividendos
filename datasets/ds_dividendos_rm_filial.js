function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    // 1. Colunas Oficiais baseadas no modelo da empresa
    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("NOME");
    dataset.addColumn("CNPJ");
    dataset.addColumn("ATIVO");
    dataset.addColumn("CAMPO_ZOOM"); // Nossa coluna de UX para o Front-end

    // 2. Parâmetros Oficiais do RM 
    var codSentenca  = 'FLUIG.016'; // Sentença oficial mantida
    var codAplicacao = 'T';         // Sistema global (Oficial)
    var codColigada  = '0';         // Traz todas as coligadas (Oficial)

    // Campos que vamos pedir para o nosso motor genérico extrair do XML
    var campos = new Array("CODCOLIGADA", "NOME", "CNPJ", "ATIVO");
    var params = new Array();

    params.push(DatasetFactory.createConstraint("CODSENTENCA", codSentenca, codSentenca, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODAPLICACAO", codAplicacao, codAplicacao, ConstraintType.MUST));
    params.push(DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST));

    try {
        // 3. Chamada limpa utilizando nossa Camada de Abstração
        var datasetRM = DatasetFactory.getDataset("ds_dividendos_generic_rm_sql", campos, params, null);

        if (datasetRM != null && datasetRM.rowsCount > 0) {
            for (var i = 0; i < datasetRM.rowsCount; i++) {
                
                // Extração dos dados oficiais
                var retColigada = datasetRM.getValue(i, "CODCOLIGADA");
                var nome        = datasetRM.getValue(i, "NOME");
                var cnpj        = datasetRM.getValue(i, "CNPJ");
                var ativo       = datasetRM.getValue(i, "ATIVO");
                
                // 4. Regra de Negócio: Só exibe coligadas que estejam ATIVAS ('T' = True, '1', etc.)
                // (Muitas vezes o RM retorna 'T' ou '1'. Ajustamos para garantir que inativas sejam ignoradas)
                if (ativo == "T" || ativo == "1" || ativo.toUpperCase() == "TRUE" || ativo.toUpperCase() == "SIM") {
                    
                    // 5. UX: Concatenação para o campo Zoom ficar elegante
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