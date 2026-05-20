import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Treinamento() {
  const [file, setFile] = useState(null);

  async function upload() {
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('treinamentos')
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    alert('Arquivo enviado com sucesso!');
  }

  return (
    <div>
      <h1>Treinamento</h1>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={e => setFile(e.target.files[0])}
      />

      <button onClick={upload}>Enviar</button>
    </div>
  );
}
