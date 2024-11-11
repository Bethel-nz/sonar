import { create } from 'zustand';
import type { Project } from '~/types';

export type ModalType = 'create' | 'edit' | 'delete';

interface ProjectModalState {
	isOpen: boolean;
	type: ModalType | null;
	project: Project | null;
	openModal: (type: ModalType, project?: Project | null) => void;
	closeModal: () => void;
}

export const useProjectModal = create<ProjectModalState>((set) => ({
	isOpen: false,
	type: null,
	project: null,
	openModal: (type, project = null) => {
		console.log('Setting modal state:', { type, project });
		set({ isOpen: true, type, project });
	},
	closeModal: () => set({ isOpen: false, type: null, project: null }),
})); 