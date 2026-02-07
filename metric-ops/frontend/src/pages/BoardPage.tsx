import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useParams, Link } from 'react-router-dom';
import { Nav } from '../components/Nav';

export function BoardPage() {
  const { board = 'requests' } = useParams();
  const { data } = useQuery({ queryKey: ['work', board], queryFn: async () => (await api.get('/work', { params: { board } })).data });
  const grouped = (data ?? []).reduce((acc: any, w: any) => { (acc[w.stage] ||= []).push(w); return acc; }, {});
  return <main><Nav /><div className="p-3"><h1 className="text-lg font-semibold capitalize">{board.replace('_',' ')}</h1><div className="flex gap-3 overflow-x-auto pb-3">{Object.entries(grouped).map(([stage,items]:any)=><div className="min-w-64" key={stage}><h2 className="font-medium mb-2">{stage}</h2><div className="space-y-2">{items.map((w:any)=><Link className="card block" to={`/work/${w.work_id}`} key={w.work_id}><p className="font-medium">{w.title}</p><p className="text-xs">{w.priority} • blockers {w.blocker_count}</p></Link>)}</div></div>)}</div></div></main>;
}
