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

// Função para ler o banco
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { usuarios: [], cursos: [], comentarios: [], certificados: [] };
  }
}

// Função para salvar o banco
function saveDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- Rotas ---

// GET /instrutores → todos usuários do tipo "instrutor"
app.get("/instrutores", (req, res) => {
  const db = readDatabase();
  const instrutores = db.usuarios.filter(u => u.tipo === "instrutor");
  res.status(200).json(instrutores);
});

// GET /cursos/com-muitos-comentarios?min=3
app.get("/cursos/com-muitos-comentarios", (req, res) => {
  const db = readDatabase();
  const min = parseInt(req.query.min) || 3;

  const cursosFiltrados = db.cursos.filter(curso => {
    const comentariosCurso = db.comentarios.filter(com => com.cursoId === curso.id);
    return comentariosCurso.length > min;
  });

  res.status(200).json(cursosFiltrados);
});

// GET /usuarios/:id/cursos
app.get("/usuarios/:id/cursos", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const usuario = db.usuarios.find(u => u.id === id);
  if (!usuario) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  const cursosUsuario = db.cursos.filter(c => usuario.cursosMatriculados?.includes(c.id));
  res.status(200).json(cursosUsuario);
});

// GET /usuarios/com-progresso-acima?min=80
app.get("/usuarios/com-progresso-acima", (req, res) => {
  const db = readDatabase();
  const min = parseFloat(req.query.min) || 80;

  const usuariosFiltrados = db.usuarios.filter(usuario => {
    if (!usuario.progressoCursos) return false;
    return Object.values(usuario.progressoCursos).some(prog => prog > min);
  });

  res.status(200).json(usuariosFiltrados);
});

// GET /usuarios/:id/comentarios
app.get("/usuarios/:id/comentarios", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const comentariosUsuario = db.comentarios.filter(c => c.usuarioId === id);
  res.status(200).json(comentariosUsuario);
});

// GET /cursos/:id/media-progresso
app.get("/cursos/:id/media-progresso", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;

  const progressos = db.usuarios
    .map(u => u.progressoCursos?.[id])
    .filter(p => p !== undefined);

  if (progressos.length === 0) return res.status(404).json({ message: "Nenhum progresso encontrado" });

  const media = progressos.reduce((a, b) => a + b, 0) / progressos.length;
  res.status(200).json({ cursoId: id, mediaProgresso: media });
});

// GET /cursos/:id/media-nota
app.get("/cursos/:id/media-nota", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;

  const notas = db.comentarios.filter(c => c.cursoId === id).map(c => c.nota).filter(n => n !== undefined);

  if (notas.length === 0) return res.status(404).json({ message: "Nenhuma nota encontrada" });

  const media = notas.reduce((a, b) => a + b, 0) / notas.length;
  res.status(200).json({ cursoId: id, mediaNota: media });
});

// GET /cursos/:id/duracao-total
app.get("/cursos/:id/duracao-total", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;

  const curso = db.cursos.find(c => c.id === id);
  if (!curso) return res.status(404).json({ message: "Curso não encontrado" });

  const duracaoTotal = curso.aulas?.reduce((acc, aula) => acc + (aula.duracao || 0), 0) || 0;

  res.status(200).json({ cursoId: id, duracaoTotal });
});

// GET /instrutores/:id/quantidade-cursos
app.get("/instrutores/:id/quantidade-cursos", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const cursosDoInstrutor = db.cursos.filter(c => c.instrutorId === id);
  res.status(200).json({ instrutorId: id, quantidadeCursos: cursosDoInstrutor.length });
});

// GET /certificados/por-curso
app.get("/certificados/por-curso", (req, res) => {
  const db = readDatabase();

  const certificadosPorCurso = db.certificados.reduce((acc, cert) => {
    acc[cert.cursoId] = (acc[cert.cursoId] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json(certificadosPorCurso);
});

// GET /usuarios/agrupados-por-tipo
app.get("/usuarios/agrupados-por-tipo", (req, res) => {
  const db = readDatabase();

  const agrupados = db.usuarios.reduce((acc, u) => {
    acc[u.tipo] = (acc[u.tipo] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json(agrupados);
});

// GET /cursos/ordenados-por-nota
app.get("/cursos/ordenados-por-nota", (req, res) => {
  const db = readDatabase();

  const cursosComMedia = db.cursos.map(curso => {
    const notas = db.comentarios.filter(com => com.cursoId === curso.id).map(com => com.nota).filter(n => n !== undefined);
    const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    return { ...curso, mediaNota: media };
  });

  cursosComMedia.sort((a, b) => b.mediaNota - a.mediaNota);

  res.status(200).json(cursosComMedia);
});

// GET /usuarios/com-multiplos-certificados
app.get("/usuarios/com-multiplos-certificados", (req, res) => {
  const db = readDatabase();

  const usuariosCertificados = db.certificados.reduce((acc, cert) => {
    acc[cert.usuarioId] = (acc[cert.usuarioId] || 0) + 1;
    return acc;
  }, {});

  const usuariosMulti = db.usuarios.filter(u => usuariosCertificados[u.id] > 1);

  res.status(200).json(usuariosMulti);
});

// GET /cursos/:id/alunos-progresso-alto?min=90
app.get("/cursos/:id/alunos-progresso-alto", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const min = parseFloat(req.query.min) || 90;

  const alunos = db.usuarios.filter(u => {
    const prog = u.progressoCursos?.[id];
    return prog !== undefined && prog > min;
  });

  res.status(200).json(alunos);
});

// GET /usuarios/:id/status-cursos
app.get("/usuarios/:id/status-cursos", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;

  const usuario = db.usuarios.find(u => u.id === id);
  if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });

  const status = {};
  for (const cursoId in usuario.progressoCursos) {
    const prog = usuario.progressoCursos[cursoId];
    if (prog >= 100) status[cursoId] = "completo";
    else if (prog > 0) status[cursoId] = "em andamento";
    else status[cursoId] = "não iniciado";
  }

  res.status(200).json(status);
});

// PATCH /usuarios/:id/progresso/:cursoId
app.patch("/usuarios/:id/progresso/:cursoId", (req, res) => {
  const db = readDatabase();
  const { id, cursoId } = req.params;

  const usuarioIndex = db.usuarios.findIndex(u => u.id === id);
  if (usuarioIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });

  if (!db.usuarios[usuarioIndex].progressoCursos) db.usuarios[usuarioIndex].progressoCursos = {};

  const atual = db.usuarios[usuarioIndex].progressoCursos[cursoId] || 0;
  let novoProgresso = atual + 10;
  if (novoProgresso > 100) novoProgresso = 100;

  db.usuarios[usuarioIndex].progressoCursos[cursoId] = novoProgresso;

  saveDatabase(db);

  res.status(200).json({ message: "Progresso atualizado", progresso: novoProgresso });
});

// POST /cursos
app.post("/cursos", (req, res) => {
  const db = readDatabase();
  const { nome, instrutorId, aulas } = req.body;

  if (!nome || !instrutorId || !Array.isArray(aulas)) {
    return res.status(400).json({ message: "Nome, instrutorId e aulas são obrigatórios" });
  }

  const instrutor = db.usuarios.find(u => u.id === instrutorId && u.tipo === "instrutor");
  if (!instrutor) return res.status(400).json({ message: "Instrutor não encontrado" });

  const novoCurso = {
    id: uuidv4(),
    nome,
    instrutorId,
    aulas,
  };

  db.cursos.push(novoCurso);
  saveDatabase(db);

  res.status(201).json({ message: "Curso criado", curso: novoCurso });
});

// POST /cursos/:id/comentarios
app.post("/cursos/:id/comentarios", (req, res) => {
  const db = readDatabase();
  const { id } = req.params;
  const { usuarioId, texto, nota } = req.body;

  if (!usuarioId || !texto) {
    return res.status(400).json({ message: "usuarioId e texto são obrigatórios" });
  }

  const curso = db.cursos.find(c => c.id === id);
  if (!curso) return res.status(404).json({ message: "Curso não encontrado" });

  const usuario = db.usuarios.find(u => u.id === usuarioId);
  if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });

  const comentario = {
    id: uuidv4(),
    cursoId: id,
    usuarioId,
    texto,
    nota: nota || null,
  };

  db.comentarios.push(comentario);
  saveDatabase(db);

  res.status(201).json({ message: "Comentário adicionado", comentario });
});

// POST /certificados
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

// DELETE /cursos/sem-comentarios
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
