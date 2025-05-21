import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 3333;

// Middleware
app.use(cors());
app.use(express.json());

// Rota básica de teste
app.get("/", (req, res) => {
  res.send("Servidor rodando corretamente!");
});

// Exemplo rota usando uuid
app.get("/uuid", (req, res) => {
  res.json({ id: uuidv4() });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

//