import express from "express";
import { convertCSharpToMapper } from "./converts";

const app = express();

app.use(express.text());

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Conversor C# → Mapper TS</title>
        <style>
          textarea { width: 100%; height: 200px; }
          pre { background: #f0f0f0; padding: 10px; white-space: pre-wrap; }
          button { margin-top: 10px; padding: 6px 12px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>Coloque seu código C# aqui:</h2>
        <textarea id="csharp"></textarea>
        <br/>
        <button onclick="convert()">Converter</button>
        <h2>Resultado TS:</h2>
        <pre id="resultado"></pre>
        <button id="copyBtn" style="display:none;" onclick="copyCode()">Copiar Resultado</button>

        <script>
          async function convert() {
            const code = document.getElementById("csharp").value;
            if (!code) return alert("Cole algum código primeiro!");
            const response = await fetch("/convert", {
              method: "POST",
              headers: { "Content-Type": "text/plain" },
              body: code
            });
            const text = await response.text();
            document.getElementById("resultado").innerText = text;
            document.getElementById("copyBtn").style.display = "inline-block";
          }

          function copyCode() {
            const text = document.getElementById("resultado").innerText;
            navigator.clipboard.writeText(text).then(() => {
              alert("Código copiado para a área de transferência!");
            }).catch(err => {
              alert("Erro ao copiar: " + err);
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/convert", (req, res) => {
  if (!req.body) return res.status(400).send("Nenhum código enviado!");
  const tsCode = convertCSharpToMapper(req.body);
  res.send(tsCode);
});

app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000")
);
