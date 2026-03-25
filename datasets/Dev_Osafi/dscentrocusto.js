/*function createDataset(fields, constraints, sortFields) {
	var dataset = DatasetBuilder.newDataset();
	
	//RM
	dataset.addColumn("CODIGO");
    dataset.addColumn("DESCRICAO");
    dataset.addColumn("CAMPO_ZOOM");
    
	dataset.addRow(new Array(
			'0001',
			'TECNOLOGIA DA INFORMAÇÃO',
			'0001 - TECNOLOGIA DA INFORMAÇÃO'
	));
	
	dataset.addRow(new Array(
			'0002',
			'COMPRAS',
			'0002 - COMPRAS'
	));
	
	dataset.addRow(new Array(
			'0003',
			'ENGENHARIA',
			'0003 - ENGENHARIA'
	));
	
	dataset.addRow(new Array(
			'0004',
			'ALMOXARIFADO',
			'0004 - ALMOXARIFADO'
	));
	
    return dataset;
}*/

function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("CODCCUSTO");
    dataset.addColumn("NOME");
    dataset.addColumn("CAMPO_ZOOM");
    
    var CODCOLIGADA = obterParametro(constraints, "CODCOLIGADA");

    try {
        var codSentenca = "FLUIG.023";
        var codColigada = 0;
        var codSistema = "T";
        var parametros = "CODCOLIGADA=" + CODCOLIGADA;
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
                    var CODCCUSTO = row.has("CODCCUSTO") ? row.get("CODCCUSTO") : "";
                    var NOME = row.has("NOME") ? row.get("NOME") : "";
                    var CAMPO_ZOOM = CODCCUSTO + " - " + NOME;

                    if (entitys.isNull(i)) { return dataset; }
                    dataset.addRow(new Array(CODCOLIGADA, CODCCUSTO, NOME, CAMPO_ZOOM));
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

function obterParametro(constraints, campo){
    var valor = "";
    if ((constraints != null) && (constraints.length > 0)) {
          for each(con in constraints) {
                 if (con.getFieldName().trim().toUpperCase() == campo.trim().toUpperCase()) {
                        valor = con.getInitialValue();
                        break;
                 }
          }
    }
    return valor;
}