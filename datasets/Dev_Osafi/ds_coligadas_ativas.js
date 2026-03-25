function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("NOME");
    dataset.addColumn("ATIVO");
    dataset.addColumn("CNPJ");

    try {
        var codSentenca = "FLUIG.016";
        var codColigada = 0;
        var codSistema = "T";
        var parametros = "";
        var codigoServico = ServiceManager.getService("WSCONSSQL");
        var helperServico = codigoServico.getBean();
        var locatorServico = codigoServico.instantiate("com.totvs.WsConsultaSQL");
        var servico = locatorServico.getRMIwsConsultaSQL();
        var authServico = helperServico.getBasicAuthenticatedClient(servico, "com.totvs.IwsConsultaSQL", "fluig", "Uniqo@2024");
        var result = authServico.realizarConsultaSQL(codSentenca, codColigada, codSistema, parametros);
        log.info("Result################" + result);

        var JSONObj = org.json.XML.toJSONObject(result).get("NewDataSet");
        log.info("JSONObj################" + JSONObj);

        if (JSONObj.has("Resultado")) {
            log.info("ENTREI NO IF################");

            var entitys = JSONObj.get("Resultado");
            try {
                log.info("ENTREI NO FOR################ - " + entitys.length());
                for (var i = 0; i < entitys.length(); i++) {
                    var row = null;
                    if (entitys.isNull(i)) {
                        row = entitys;
                    } else {
                        row = entitys.get(i);
                    }

                    var CODCOLIGADA = row.has("CODCOLIGADA") ? row.get("CODCOLIGADA") : "";
                    var NOME = row.has("NOME") ? row.get("NOME") : "";
                    var ATIVO = row.has("ATIVO") ? row.get("ATIVO") : "";
                    var CNPJ = row.has("CNPJ") ? row.get("CNPJ") : "";

                    if (entitys.isNull(i)) { return dataset; }
                    dataset.addRow(new Array(CODCOLIGADA, NOME, ATIVO, CNPJ));
                }
            }
            catch (e) {
                log.error("ERROR - " + e);
            }
        }
    } catch (e) {
        var mensagemErro = "Erro na comunicação com o Serviço do RM " + e;
        log.error("consulta_ac.createDataset: " + mensagemErro);

        dataset = DatasetBuilder.newDataset();
        dataset.addColumn("ERROR");
        dataset.addColumn("MESSAGE_ERROR");
        dataset.addRow(new Array(-1, mensagemErro));
    }
    return dataset;
}

