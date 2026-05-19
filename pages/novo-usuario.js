<select
  value={role}
  onChange={(e) => setRole(e.target.value)}
>
  <option value="usuario">Usuário</option>
  <option value="supervisor">Supervisor</option>
  <option value="admin">Admin</option>
</select>
