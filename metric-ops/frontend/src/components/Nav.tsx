import { Link } from 'react-router-dom';

export function Nav() {
  return <nav className="p-3 bg-white border-b flex gap-3 text-sm sticky top-0"><Link to="/">Home</Link><Link to="/work">Work</Link><Link to="/board/requests">Boards</Link><Link to="/metrics">Metrics</Link></nav>;
}
