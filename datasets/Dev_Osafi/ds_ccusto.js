function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
	var dataset = DatasetBuilder.newDataset();
	
	dataset.addColumn("Descricao");
	dataset.addColumn("Codigo");
	
	dataset.addRow(new Array("Administração Matriz","001.001.0001"));
	dataset.addRow(new Array("Administração Filial","001.001.0002"));
	dataset.addRow(new Array("Comunicação e Publicidade","001.001.0005"));
	dataset.addRow(new Array("Projetos e Desenvolvimento","001.001.0007"));
	dataset.addRow(new Array("Expansão - Fase 01","001.003.0001"));
	dataset.addRow(new Array("Expansão - Fase 02","001.003.0002"));
	dataset.addRow(new Array("Expansão - Fase 03","001.003.0003"));
	dataset.addRow(new Array("Expansão - Fase 04","001.003.0004"));
	dataset.addRow(new Array("Expansão - Fase 05","001.003.0005"));
	dataset.addRow(new Array("Resíduos Sólidos de Saúde","001.004.0010"));
	dataset.addRow(new Array("Resíduos Sólidos Urbanos","001.004.0011"));
	dataset.addRow(new Array("Estação de pré tratamento","001.004.0013"));
	dataset.addRow(new Array("Operação Externa na Prolagos (Tanques)","001.004.0026"));
	dataset.addRow(new Array("RSU - Célula expandida - 01","001.004.0027"));
	dataset.addRow(new Array("RSS - Célula expandida - 01","001.004.0028"));
	dataset.addRow(new Array("Comercial","001.005.0001"));
	dataset.addRow(new Array("Tributos","001.005.0002"));
	dataset.addRow(new Array("Investimentos","001.006.0005"));
		
	return dataset;
	
}function onMobileSync(user) {

}