// pages/login.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="page container centerArea">
      <form onSubmit={handleLogin} className="formStack card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="topicTitle">Entrar</h1>

        <label className="formLabel">Email</label>
        <input
          type="email"
          className="formInput"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label className="formLabel">Senha</label>
        <input
          type="password"
          className="formInput"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p style={{ color: '#ff6b47', fontWeight: 'bold' }}>{error}</p>}

        <button type="submit" className="btn btnYellow">Entrar</button>

        <p style={{ marginTop: '10px' }}>
          Não tem conta? <Link href="/signup">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}
