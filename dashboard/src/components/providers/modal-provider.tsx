import { createContext, useContext, useState } from 'react';
import { ProjectModal } from '~/components/modals/project-modal';
import type { Project } from '~/types';
import type { ModalType } from '~/hooks/use-project-modal';

interface ProjectModalContext {
	isOpen: boolean;
	type: ModalType | null;
	project: Project | null;
	openModal: (type: ModalType, project?: Project) => void;
	closeModal: () => void;
}

const ProjectModalContext = createContext<ProjectModalContext | undefined>(undefined);

export function useProjectModalContext() {
	const context = useContext(ProjectModalContext);
	if (!context) {
		throw new Error('useProjectModalContext must be used within ProjectModalProvider');
	}
	return context;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [type, setType] = useState<ModalType | null>(null);
	const [project, setProject] = useState<Project | null>(null);

	return (
		<ProjectModalContext.Provider
			value={{
				isOpen,
				type,
				project,
				openModal: (newType, selectedProject) => {
					setType(newType);
					setProject(selectedProject!);
					setIsOpen(true);
				},
				closeModal: () => {
					setIsOpen(false);
					setType(null);
					setProject(null);
				},
			}}
		>
			{children}
			<ProjectModal />
		</ProjectModalContext.Provider>
	);
} 