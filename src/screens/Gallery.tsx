import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import './Gallery.css';

interface Project {
  id: string;
  name: string;
  date: string;
  preview: string;
  filePath?: string;
  shapes?: any[];
}

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
      }
    }
  }, []);

  const loadProjects = async () => {
    try {
      const filePath = await openDialog({
        title: 'Открыть проект',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        multiple: true
      });
      
      if (filePath && Array.isArray(filePath)) {
        const loadedProjects: Project[] = [];
        for (const path of filePath) {
          try {
            const content = await readTextFile(path);
            const data = JSON.parse(content);
            loadedProjects.push({
              id: data.id || Date.now().toString(),
              name: data.name || 'Без названия',
              date: new Date(data.updatedAt || Date.now()).toLocaleDateString(),
              preview: '📄',
              filePath: path,
              shapes: data.shapes || []
            });
          } catch (e) {
            console.error('Ошибка загрузки проекта:', e);
          }
        }
        if (loadedProjects.length > 0) {
          setProjects(loadedProjects);
          localStorage.setItem('projects', JSON.stringify(loadedProjects));
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error);
    }
  };

  const openProject = (project: Project) => {
    localStorage.setItem('projectToLoad', JSON.stringify({
      id: project.id,
      name: project.name,
      shapes: project.shapes || [],
      filePath: project.filePath
    }));
    navigate(`/editor/${project.id}`);
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Проект ${projects.length + 1}`,
      date: new Date().toLocaleDateString(),
      preview: '📄'
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
  };

  return (
    <div className="gallery-container">
      <div className="gallery-content">
        <div className="gallery-header">
          <h1>Мои проекты</h1>
          <div className="gallery-buttons">
            <button className="create-button" onClick={addProject}>+ Создать проект</button>
            <button className="raster-button" onClick={loadProjects}>📂 Открыть проект</button>
            <button className="raster-button" onClick={() => navigate('/raster-lab')}>🎨 Растеризатор</button>
            <button className="shapes-button" onClick={() => navigate('/shapes-demo')}>📐 Фигуры</button>
          </div>
        </div>

        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="empty-state">
              <p>Нет проектов</p>
              <p>Нажмите "Создать проект" или "Открыть проект"</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} onClick={() => openProject(project)} className="project-card" style={{ cursor: 'pointer' }}>
                <div className="project-preview">{project.preview}</div>
                <h3 className="project-name">{project.name}</h3>
                <p className="project-date">{project.date}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;