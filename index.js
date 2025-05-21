import express from "express";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import fs from "fs";

const PORT = 3333;
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use(express.json());

const DB_FILE = "./base_dados.json";

function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { usuarios: [], cursos: [], comentarios: [], certificados: [] };
  }
}

function saveDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ROTAS...

// (Todas as suas rotas anteriores estão OK)

// POST /certificados → gera certificado para alunos com progresso ≥ 90%
app.post("/certificados", (req, res) => {
  const db = readDatabase();
  let certificadosCriados = 0;

  db.usuarios.forEach(usuario => {
    if (!usuario.progressoCursos) return;

    for (const cursoId in usuario.progressoCursos) {
      const progresso = usuario.progressoCursos[cursoId];
      if (progresso >= 90) {
        const jaTem = db.certificados.some(c => c.usuarioId === usuario.id && c.cursoId === cursoId);
        if (!jaTem) {
          db.certificados.push({
            id: uuidv4(),
            usuarioId: usuario.id,
            cursoId,
            dataEmissao: new Date().toISOString(),
          });
          certificadosCriados++;
        }
      }
    }
  });

  saveDatabase(db);
  res.status(201).json({ message: `Certificados criados: ${certificadosCriados}` });
});

// DELETE /cursos/sem-comentarios → remove cursos sem comentários
app.delete("/cursos/sem-comentarios", (req, res) => {
  const db = readDatabase();

  const cursosComComentarios = new Set(db.comentarios.map(c => c.cursoId));
  const cursosAntes = db.cursos.length;

  db.cursos = db.cursos.filter(c => cursosComComentarios.has(c.id));
  const cursosDepois = db.cursos.length;

  saveDatabase(db);
  res.status(200).json({ message: `Cursos removidos: ${cursosAntes - cursosDepois}` });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
