function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("CODTCF");
    dataset.addColumn("DESCRICAO");

    try {
        log.info("ENTROU NO TRY################");
        var codSentenca = "FLUIG.005";
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
                    var CODTCF = row.has("CODTCF") ? row.get("CODTCF") : "";
                    var DESCRICAO = row.has("DESCRICAO") ? row.get("DESCRICAO") : "";


                    if (entitys.isNull(i)) { return dataset; }
                    dataset.addRow(new Array(CODCOLIGADA, CODTCF, DESCRICAO));
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
