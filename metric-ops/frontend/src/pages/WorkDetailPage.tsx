import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useParams } from 'react-router-dom';
import { Nav } from '../components/Nav';

export function WorkDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['workdetail', id], queryFn: async () => (await api.get(`/work/${id}`)).data });
  const move = useMutation({ mutationFn: (to_stage: string) => api.post(`/work/${id}/move`, { to_stage }), onSuccess: ()=>qc.invalidateQueries({queryKey:['workdetail',id]}) });
  if (!data) return null;
  return <main><Nav /><div className="p-3 space-y-3"><div className="card"><h1 className="text-lg font-semibold">{data.work.title}</h1><p>{data.work.description}</p><div className="text-sm">{data.work.stage} • {data.work.status}</div><button className="mt-2 bg-blue-600 text-white rounded px-3 py-1" onClick={()=>move.mutate(prompt('Move to stage') || data.work.stage)}>Move</button></div>
    <div className="card"><h2 className="font-medium">Approvals</h2>{data.approvals.map((a:any)=><div key={a.approval_id} className="text-sm">{a.gate}: {a.status}</div>)}</div>
    <div className="card"><h2 className="font-medium">Dependencies</h2>{data.dependencies.map((d:any)=><div key={d.dep_id} className="text-sm">{d.dep_type} {d.depends_on_work_id}</div>)}</div>
    <div className="card"><h2 className="font-medium">Comments</h2>{data.comments.map((c:any)=><div key={c.comment_id} className="text-sm">{c.body}</div>)}</div>
    <div className="card"><h2 className="font-medium">Timeline</h2>{data.events.map((e:any)=><div key={e.event_id} className="text-sm">{e.event_type}</div>)}</div>
  </div></main>;
}
