import { Routes, Route } from 'react-router-dom';
import UniHome from './unipages/UniHome.jsx';
import './unipages/UniHome.css';

function UniApp() {
  return (
    <div className="uni-app-root">
      <Routes>
        <Route path="" element={<UniHome />} />
      </Routes>
    </div>
  );
}

export default UniApp;
