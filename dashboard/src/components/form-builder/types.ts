import { z } from 'zod';
import { useForm } from 'react-hook-form';

export type CustomComponents = {
	Form?: React.ComponentType<any>;
	Input?: React.ComponentType<any>;
	Select?: React.ComponentType<any>;
	Checkbox?: React.ComponentType<any>;
	Textarea?: React.ComponentType<any>;
	Switch?: React.ComponentType<any>;
	Radio?: React.ComponentType<any>;
	Slider?: React.ComponentType<any>;
	DatePicker?: React.ComponentType<any>;
	ZodPassword?: React.ComponentType<any>;
	ZodSelect?: React.ComponentType<any>;
	ZodCheckbox?: React.ComponentType<any>;
	ZodTextarea?: React.ComponentType<any>;
	ZodSwitch?: React.ComponentType<any>;
	ZodRadio?: React.ComponentType<any>;
	ZodSlider?: React.ComponentType<any>;
	ZodTabs?: React.ComponentType<any>;
	ZodAccordion?: React.ComponentType<any>;
	ZodDatePicker?: React.ComponentType<any>;
	ZodText?: React.ComponentType<any>;
};

// Types
export interface ComponentConfig {
	className?: string;
	containerClassName?: string;
	component?: React.ComponentType<any>;
	props?: Record<string, any>;
}

export type LayoutType = 'form' | 'stepper' | 'card';

export type StepperConfig = {
	steps: Array<{
		title: string;
		description?: string;
		validation?: (values: any) => boolean;
	}>;
	orientation?: 'horizontal' | 'vertical';
};

export type FormLayout = {
	type: LayoutType;
	stepperConfig?: StepperConfig;
	components?: Record<string, ComponentConfig>;
};

export interface SubmitConfig {
	component?: React.ComponentType<{ formState: FormState }>;
}

export type FormSection = {
	title?: string;
	description?: string;
	schema: z.ZodObject<any>;
	layout?: FormLayout;
	conditional?: (values: any) => boolean;
};

export type FormAction = {
	type?: 'post' | 'get';
	url?: string;
	onSubmit?: (values: any) => Promise<void> | void;
	onError?: (errors: any) => void;
	afterSubmit?: (values: any) => Promise<void> | void;
};

// Add to the types section
export type CustomFieldConfig = {
	component: React.ComponentType<any>;
	props?: Record<string, any>;
	wrapper?: React.ComponentType<any>;
	wrapperProps?: Record<string, any>;
};

// Add TypeName enum
export enum TypeName {
	Text = 'text',
	Password = 'password',
	Email = 'email',
	Select = 'select',
	Checkbox = 'checkbox',
	Radio = 'radio',
	Textarea = 'textarea',
	Switch = 'switch',
	Slider = 'slider',
	DatePicker = 'datePicker',
	Custom = 'custom',
	Input = 'input',
}

export type FormReturn = {
	Form: React.ComponentType<React.FormHTMLAttributes<HTMLFormElement>>;
	methods: ReturnType<typeof useForm>;
	formState: FormState;
};

export type FormState = {
	isSubmitting: boolean;
	isSubmitted: boolean;
	submitCount: number;
	isDirty: boolean;
};

// Update config type
export type FormBuilderConfig = {
	action?: FormAction;
	submit?: SubmitConfig;
	className?: string;
	debug?: boolean;
	layout?: FormLayout;
	components?: CustomComponents;
	props?: Record<string, any>;
	defaultValues?: Record<string, any>;
	transformValues?: (values: any) => any;
};
