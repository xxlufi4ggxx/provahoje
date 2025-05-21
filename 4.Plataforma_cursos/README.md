# 🧠 Consultas e Filtragens
GET /instrutores
→ Retorna todos os usuários do tipo "instrutor".

GET /cursos/com-muitos-comentarios?min=3
→ Retorna cursos com mais de 3 comentários.

GET /usuarios/:id/cursos
→ Retorna os cursos em que o usuário com :id está matriculado.

GET /usuarios/com-progresso-acima?min=80
→ Lista usuários com progresso acima de 80% em qualquer curso.

GET /usuarios/:id/comentarios
→ Retorna todos os comentários feitos por um usuário específico.

# 📊 Cálculos e Estatísticas
GET /cursos/:id/media-progresso
→ Calcula a média de progresso dos alunos no curso.

GET /cursos/:id/media-nota
→ Retorna a média de notas dos comentários do curso.

GET /cursos/:id/duracao-total
→ Retorna a duração total das aulas do curso.

GET /instrutores/:id/quantidade-cursos
→ Retorna o número de cursos criados pelo instrutor.

GET /certificados/por-curso
→ Retorna a quantidade de certificados emitidos por curso.

# 🧩 Transformações e Agrupamentos
GET /usuarios/agrupados-por-tipo
→ Agrupa usuários por tipo (estudante/instrutor) e conta quantos há de cada tipo.

GET /cursos/ordenados-por-nota
→ Lista cursos ordenados pela média de notas dos comentários.

GET /usuarios/com-multiplos-certificados
→ Lista alunos com mais de um certificado.

GET /cursos/:id/alunos-progresso-alto?min=90
→ Lista os alunos do curso com progresso acima de 90%.

GET /usuarios/:id/status-cursos
→ Transforma progresso em status (completo, em andamento, não iniciado).

# 🛠️ Simulações e Atualizações
PATCH /usuarios/:id/progresso/:cursoId
→ Simula avanço de 10% no progresso de um curso.

POST /cursos
→ Cria um novo curso com aulas e vincula a um instrutor.

POST /cursos/:id/comentarios
→ Adiciona um comentário a um curso.

POST /certificados
→ Gera certificado para alunos com progresso ≥ 90%.

DELETE /cursos/sem-comentarios
→ Remove cursos que não têm comentários.