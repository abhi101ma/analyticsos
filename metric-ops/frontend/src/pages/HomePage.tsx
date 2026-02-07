import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';

export function HomePage() {
  const { data } = useQuery({ queryKey: ['daily'], queryFn: async () => (await api.get('/summary/daily')).data });
  return <main className="pb-8"><Nav /><section className="p-4 space-y-3"><h1 className="text-xl font-semibold">Command Center</h1>
    <Link to="/work?view=boards" className="card block"><h2 className="font-medium">Work in flight</h2><p>{data?.counts?.length ?? 0} stage slices</p></Link>
    <Link to="/work?needs_approval=true" className="card block"><h2 className="font-medium">Approvals needed</h2><p>{data?.approvals_pending_by_user?.reduce((a:number,c:any)=>a+c.count,0) ?? 0}</p></Link>
    <Link to="/work?blocked=true" className="card block"><h2 className="font-medium">Blocked items</h2><p>{data?.blocked_items?.length ?? 0}</p></Link>
    <div className="card"><h2 className="font-medium">KPI snapshot</h2><ul>{data?.kpi?.map((k:any)=><li key={k.snapshot_id}>{k.kpi_name}: {k.kpi_value}</li>)}</ul></div>
  </section></main>;
}
