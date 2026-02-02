# upload.video

Uma plataforma SaaS **Multi-tenant** robusta para gerenciamento e hospedagem de vídeos, construída com foco em performance e controle de acesso granular.

O projeto utiliza uma arquitetura moderna para isolamento de dados por organização e permissões baseadas em funções (Role-Based Access Control).

## Features
### Autenticação

- [ ] Deve ser possível autenticar usando e-mail & magic link;
- [ ] Deve ser possível criar uma conta usando e-mail e nome completo.

### Organizações

- [ ] Deve ser possível criar novas organizações;
- [ ] Deve ser possível obter todas as organizações ao qual o usuário pertence;
- [ ] Deve ser possível alterar as informações da organização;
- [ ] Deve ser possível pausar ou encerrar as atividades de uma organização;
- [ ] Deve ser possível transferir uma organização para outro usuário.

### Invites/Convites

- [ ] Deve ser possível enviar convites a novos membros (e-mail e role);
- [ ] Deve ser possível aceitar um convite;
- [ ] Deve ser possível revogar convites pendentes.

### Membros

- [ ] Deve ser possível obter os membros da organização; 
- [ ] Deve ser possível atualizar a role de um membros da organização.

### Folder/Collections

- [ ] Deve ser possível criar as pastas para armazenar os vídeos;
- [ ] Deve ser possível obter todas as pastas da organização;
- [ ] Deve ser possível excluir as pastas da organização.
- [ ] Deve ser possível atualizar as informações da pasta da organização (nome).

### Uploads/Videos

- [ ] Deve ser possível obter todos os arquivos e uploads da organização;
- [ ] Dever ser possível fazer uploads de arquivos para pastas da organização;
- [ ] Deve ser possível atualizar as informações do arquivo (título, slug)
- [ ] Deve ser possível deletar um vídeo da organização.

## 🔐 Quadro de Permissões (RBAC)

| Funcionalidade | Admin | Member | Viewer |
| :--- | :---: | :---: | :---: |
| **Organização** | | | |
| Alterar informações | ✅ | ❌ | ❌ |
| Pausar/Encerrar atividades | ✅ | ❌ | ❌ |
| Transferir propriedade | ⚠️ | ❌ | ❌ |
| **Membros e Convites** | | | |
| Convidar novos membros | ✅ | ❌ | ❌ |
| Revogar convites | ✅ | ❌ | ❌ |
| Listar membros | ✅ | ✅ | ✅ |
| Atualizar função (role) | ✅ | ❌ | ❌ |
| Remover membros | ✅ | ⚠️ | ❌ |
| **Pastas (Collections)** | | | |
| Criar pastas | ✅ | ✅ | ❌ |
| Listar pastas | ✅ | ✅ | ✅ |
| Atualizar informações | ✅ | ⚠️ | ❌ |
| Excluir pastas | ✅ | ⚠️ | ❌ |
| **Vídeos e Uploads** | | | |
| Realizar uploads | ✅ | ✅ | ❌ |
| Listar arquivos/uploads | ✅ | ✅ | ✅ |
| Atualizar metadados | ✅ | ⚠️ | ❌ |
| Deletar vídeos | ✅ | ⚠️ | ❌ |

**Legenda:**
* ✅ **Permitido**: Acesso total à funcionalidade.
* ❌ **Não permitido**: Acesso bloqueado pelo middleware de autorização.
* ⚠️ **Condicional**: Permitido apenas se o usuário for o proprietário do recurso ou sob validação de hierarquia.