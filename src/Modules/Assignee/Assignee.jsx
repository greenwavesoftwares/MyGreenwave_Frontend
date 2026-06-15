import React, { useState } from 'react'
import ProjectsInfo from './ProjectsInfo'
import ProjectActivityInfo from './ProjectActivityInfo';
import { getUserData } from '../Login/Encrypt';

export default function Assignee() {
    const [selectedProject, setSelectedProject] = useState(null);
    const projectSelection=(project)=>{
        setSelectedProject(project)
    }
    const currentUserId   = getUserData()?.userDetails?.userId;

  return (
    <>
    {!selectedProject &&<ProjectsInfo projectSelection={projectSelection}/>}
    {selectedProject &&<ProjectActivityInfo selectedProject={selectedProject} setSelectedProject={setSelectedProject} />}
    </>
  )
}
