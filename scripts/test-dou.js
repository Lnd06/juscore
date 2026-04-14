const { buscarDOU } = require("../backend/services/dou.js");

(async () => {
  console.log("Teste de Busca DOU - Simple Query Only");

  const { lerConteudoDOU } = require("../backend/services/dou.js");

  // Test case: Read Content
  console.log(`\n2. Lendo Conteúdo (Home Page)`);
  const texto = await lerConteudoDOU(
    "https://www.in.gov.br/leitura-dos-jornais",
  );
  console.log(
    `Conteúdo (primeiros 200 chars): ${texto ? texto.substring(0, 200) : "Falha"}`,
  );
})();
