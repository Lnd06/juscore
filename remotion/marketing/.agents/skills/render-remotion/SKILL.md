name: render-remotion
description: Ensina a CLI do Remotion a receber propriedades estruturadas dinâmicas (props) do backend Python e renderizar vídeos MP4.

## Fluxo de Renderização Automatizada

Quando precisar gerar um vídeo a partir de um post aprovado:
1. Gere um arquivo JSON estruturado contendo as propriedades do vídeo (legenda, caminho da imagem gerada, áudio, etc.).
2. Salve este arquivo na pasta do projeto do Remotion como `props.json`.
3. Chame o renderizador via CLI passando o nome da composição e o caminho das props:
   ```bash
   npx remotion render FeatureVideo out/output.mp4 --props=./props.json
   ```
4. Monitore a conclusão do processo. O arquivo de vídeo final deve ser movido para o diretório de mídias acessível pelo backend FastAPI para reprodução ou upload posterior.
