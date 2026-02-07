import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';

export function WorkListPage() {
  const [sp, setSp] = useSearchParams();
  const filters: any = Object.fromEntries(sp.entries());
  const { data } = useQuery({ queryKey: ['work', filters], queryFn: async () => (await api.get('/work', { params: filters })).data });
  return <main><Nav /><div className="p-3"><input className="border rounded p-2 w-full mb-3" placeholder="search" onBlur={(e)=>setSp({ ...filters, search: e.target.value })} /><div className="space-y-2">{(data ?? []).map((w:any)=><Link key={w.work_id} className="card block" to={`/work/${w.work_id}`}>{w.title}<div className="text-xs">{w.board} • {w.stage} • {w.status}</div></Link>)}</div></div></main>;
}
