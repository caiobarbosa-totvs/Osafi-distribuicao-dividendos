function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODIGOINSS");
    dataset.addColumn("DESCRICAO");

    try {
        var codSentenca = "FLUIG.015";
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


                    var CODIGOINSS = row.has("CODIGOINSS") ? row.get("CODIGOINSS") : "";
                    var DESCRICAO = row.has("DESCRICAO") ? row.get("DESCRICAO") : "";

                    if (entitys.isNull(i)) { return dataset; }
                    dataset.addRow(new Array(CODIGOINSS, DESCRICAO));
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
