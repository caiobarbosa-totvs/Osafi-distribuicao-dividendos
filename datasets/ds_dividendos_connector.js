function createDataset(fields, constraints, sortFields) {

	// AMBIENTE DE TESTE1
	var INTEGRADOR = "fluig"; // Alterar para o usuario de integracao
	var SENHA = "Uniqo@2024"; // Alterar para a senha de integracao
	var EMAIL = "teste@teste.com";

	var COLUNAS = new Array("INTEGRADOR", "SENHA", "EMAIL");
	var dataset = DatasetBuilder.newDataset();

	for (var i = 0; i < COLUNAS.length; i++) {
		dataset.addColumn(COLUNAS[i]);
	}
	
	dataset.addRow(new Array(INTEGRADOR, SENHA, EMAIL));
	
	return dataset;
}