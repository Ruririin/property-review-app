import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error(err));
  }, []);

  const createProject = () => {
    if (!newTitle.trim()) return;
    axios.post('/api/projects', { title: newTitle })
      .then(res => {
        setProjects([...projects, res.data]);
        setNewTitle('');
      });
  };

  return (
    <div>
      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="New Project Title"
      />
      <button onClick={createProject}>Create</button>

      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <button onClick={() => navigate(`/project/${p.id}`)}>
              {p.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
