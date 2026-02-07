import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export function LoginPage() {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
  return <main className="p-4 max-w-md mx-auto"><h1 className="text-2xl font-bold mb-4">Metric Ops Login</h1><form className="card space-y-3" onSubmit={handleSubmit(async (v) => { const { data } = await api.post('/auth/login', v); localStorage.setItem('token', data.token); nav('/'); })}><input className="w-full border p-2 rounded" placeholder="email" {...register('email')} /><input className="w-full border p-2 rounded" type="password" placeholder="password" {...register('password')} /><button className="w-full bg-blue-600 text-white p-2 rounded">Login</button></form></main>;
}
