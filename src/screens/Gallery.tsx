import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Gallery.css';

interface Project {
  id: string;
  name: string;
  date: string;
  preview: string;
}

const Gallery: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Проект ${projects.length + 1}`,
      date: new Date().toLocaleDateString(),
      preview: '📄'
    };
    setProjects([...projects, newProject]);
  };

  return (
    <div className="gallery-container">
      <div className="gallery-content">
        <div className="gallery-header">
          <h1>Мои проекты</h1>
          <button 
            className="create-button"
            onClick={addProject}
          >
            + Создать проект
          </button>
        </div>

        <div className="projects-grid">
          {projects.map(project => (
            <Link 
              key={project.id} 
              to={`/editor/${project.id}`}
              className="project-card"
            >
              <div className="project-preview">{project.preview}</div>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-date">{project.date}</p>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="empty-state">
              <p>Нет проектов</p>
              <p>Нажмите "Создать проект" чтобы начать</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;