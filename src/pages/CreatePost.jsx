import { useState } from 'react'
import CreateActionPicker from '../components/create/CreateActionPicker';
import CreateNitipBawakan from '../components/create/CreateNitipBawakan';
import CreateNitipBelikan from '../components/create/CreateNitipBelikan';
import CreateBawaTitipan from '../components/create/CreateBawaTitipan';
import CreateWarung from '../components/create/CreateWarung';
import CreateContent from '../components/create/CreateContent';

export default function CreatePost() {

  const [action, setAction] = useState(null);

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-[#e8f5e9] to-[#d7efe3] dark:from-[#020617] dark:to-[#020617]">
      
      {!action && (
        <>
          <h1 className="text-xl font-bold mb-4 text-center">
            Mau ngapain hari ini?
          </h1>
          <CreateActionPicker onSelect={setAction} />
        </>
      )}

      {action === "nitip_bawakan" && <CreateNitipBawakan onBack={() => setAction(null)} />}
      {action === "nitip_belikan" && <CreateNitipBelikan onBack={() => setAction(null)} />}
      {action === "bawa_titipan" && <CreateBawaTitipan onBack={() => setAction(null)} />}
      {action === "content" && <CreateContent onBack={() => setAction(null)} />}
      {action === "warung" && <CreateWarung onBack={() => setAction(null)} />}
    </div>
  );
}
