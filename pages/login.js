import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Login(){
  const router = useRouter()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')

  async function handleLogin(){
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error){
      setError(error.message)
      return
    }
    router.push('/dashboard')
  }

  return(
    <div className="loginPage">
      <div className="loginBox">
        <div className="loginTitle">Entrar</div>

        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>

        <div className="field">
          <label>Senha</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>

        {error && <div style={{color:'#ff6b47', marginBottom:'12px'}}>{error}</div>}

        <button className="loginBtn" onClick={handleLogin}>Entrar</button>

        <p style={{marginTop:'10px'}}>
          Não tem conta? <Link href="/signup">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}
