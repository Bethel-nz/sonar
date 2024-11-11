import { z } from 'zod';

export const projectSchema = z.object({
	name: z
		.string()
		.min(3, 'Project name must be at least 3 characters')
		.max(50, 'Project name must be less than 50 characters')
		.label('Project Name')
		.placeholder('Enter project name')
		.text(),
	
	"Project url": z
		.string()
		.url('Please enter a valid URL')
		.optional()
		.label('Project URL')
		.placeholder('https://your-project.com')
		.text(),
	
	"Github url": z
		.string()
		.url('Please enter a valid URL')
		.regex(/^https?:\/\/(www\.)?github\.com\//, 'Must be a valid GitHub URL')
		.optional()
		.label('GitHub URL')
		.placeholder('https://github.com/username/repo')
		.text(),

	description: z
		.string()
		.min(1, 'Description is required')
		.max(500, 'Description must be less than 500 characters')
		.label('Description')
		.placeholder('Enter project description')
		.textarea(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
