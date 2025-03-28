const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const importProducts = async (req, res) => {
    try{
        const { file, filename } = req.body;
        if (!file || !filename) {
            return res.status(400).json({ error: "Arquivo inválido ou não enviado." });
        }

        // Decodificar Base64 e salvar temporariamente
        const tempFilePath = path.join(__dirname, "../uploads", filename);
        fs.writeFileSync(tempFilePath, Buffer.from(file, "base64"));

        // Ler o arquivo Excel
        const workbook = xlsx.readFile(tempFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!sheetData.length || !sheetData[0].ean || !sheetData[0].name) {
            fs.unlinkSync(tempFilePath); // Excluir arquivo temporário
            return res.status(400).json({ error: "Arquivo inválido. Campos obrigatórios: ean, name" });
        }

        // Inserir no banco (exemplo fictício)
        const insertedProducts = [];
        for (const row of sheetData) {
            const { name, ean } = row;
            insertedProducts.push({ name, ean }); // Aqui você chamaria o serviço real do banco
        }

        // Excluir arquivo temporário após processamento
        fs.unlinkSync(tempFilePath);

        res.json({ message: "Produtos importados com sucesso", products: insertedProducts })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao importar produtos" });
    }
}

module.exports = { importProducts}