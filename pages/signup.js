import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Signup(){
  const router = useRouter()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')

  async function handleSignUp(e){
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if(error){
      setError(error.message)
      return
    }
    alert('Usuário criado com sucesso!')
    router.push('/login')
  }

  return(
    <div className="signupPage">
      <div className="signupBox">
        <div className="signupTitle">Cadastrar</div>

        <form onSubmit={handleSignUp}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>

          {error && <div style={{color:'#ff6b47', marginBottom:'12px'}}>{error}</div>}

          <button className="signupBtn" type="submit">Cadastrar</button>
        </form>
      </div>
    </div>
  )
}
