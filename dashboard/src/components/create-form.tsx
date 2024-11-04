import { Button } from '~ui/button';
import { Checkbox } from '~ui/checkbox';
import { Input } from '~ui/input';
import { Label } from '~ui/label';
// import { Textarea } from "~ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~ui/select';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~ui/form';
import { RadioGroup, RadioGroupItem } from '~ui/radio-group';
// import { Switch } from "~ui/switch";
// import { Slider } from "~ui/slider";
// import { Calendar } from "~ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "~ui/popover";
// import { format } from "date-fns";
// import { CalendarIcon } from "lucide-react";
import { cx } from '~utils';
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Types
export interface ComponentConfig {
	className?: string;
	containerClassName?: string;
	component?: React.ComponentType<any>;
	props?: Record<string, any>;
	typeName?: TypeName;
}

type LayoutType = 'form' | 'stepper' | 'card';

type StepperConfig = {
	steps: Array<{
		title: string;
		description?: string;
		validation?: (values: any) => boolean;
	}>;
	orientation?: 'horizontal' | 'vertical';
};

type FormLayout = {
	type: LayoutType;
	stepperConfig?: StepperConfig;
	components?: Record<string, ComponentConfig>;
};

type SubmitConfig = {
	text?: string;
	className?: string;
	disabled?: boolean;
	icon?: React.ReactNode;
	position?: 'left' | 'center' | 'right';
	width?: 'auto' | 'full';
};

type FormSection = {
	title?: string;
	description?: string;
	schema: z.ZodObject<any>;
	layout?: FormLayout;
	submit?: SubmitConfig;
	conditional?: (values: any) => boolean;
};

type FormAction = {
	type?: 'post' | 'get';
	url?: string;
	onSubmit?: (values: any) => Promise<void> | void;
	onError?: (errors: any) => void;
};

// Add to the types section
type CustomFieldConfig = {
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

// Extend Zod types
declare module 'zod' {
	interface ZodType {
		label(label: string | React.ReactNode): this;
		password(): this;
		placeholder(placeholder: string): this;
		select<T extends z.ZodEnum<[string, ...string[]]>>(
			values: { label: string; value: z.infer<T> }[],
		): this;
		defaultValue(defaultValue: any): this;
		textarea(rows?: number): this;
		radio<T extends z.ZodEnum<[string, ...string[]]>>(
			options: { label: string; value: z.infer<T> }[],
		): this;
		slider(options: { min: number; max: number; step?: number }): this;
		switch(): this;
		datePicker(options?: { minDate?: Date; maxDate?: Date }): this;
		custom(config: CustomFieldConfig): this;
		formDescription(description: string): this;
		checkbox(): this;
	}
}

// Implement Zod extensions
z.ZodType.prototype.label = function (label: string | React.ReactNode) {
	(this as any)._def.label = label;
	return this;
};

z.ZodType.prototype.password = function () {
	(this as any)._def.typeName = 'ZodPassword';
	return this;
};

z.ZodType.prototype.placeholder = function (placeholder: string) {
	(this as any)._def.placeholder = placeholder;
	return this;
};

z.ZodType.prototype.datePicker = function (options) {
	(this as any)._def.typeName = 'ZodDatePicker';
	(this as any)._def.dateOptions = options;
	return this;
};

z.ZodType.prototype.select = function <T extends z.ZodEnum<[string, ...string[]]>>(
	this: T,
	values: { label: string; value: z.infer<T> }[],
) {
	if (this._def.typeName !== 'ZodEnum') {
		throw new Error('select() can only be used with enum types');
	}
	(this as any)._def.values = values;
	return this;
};

z.ZodType.prototype.checkbox = function () {
	(this as any).typeName = 'ZodCheckbox';
	(this as any).attribute = 'ZodBoolean';
	(this as any).inputType = 'checkbox';
	return this;
};

z.ZodType.prototype.textarea = function (rows?: number) {
	(this as any)._def.typeName = 'ZodTextarea';
	(this as any)._def.rows = rows;
	return this;
};

z.ZodType.prototype.switch = function () {
	(this as any)._def.typeName = 'ZodSwitch';
	return this;
};

z.ZodType.prototype.radio = function (options) {
	(this as any)._def.typeName = 'ZodRadio';
	(this as any)._def.options = options;
	return this;
};

z.ZodType.prototype.slider = function (options) {
	(this as any)._def.typeName = 'ZodSlider';
	(this as any)._def.sliderOptions = options;
	return this;
};

z.ZodType.prototype.custom = function (config: CustomFieldConfig) {
	(this as any)._def.typeName = 'ZodCustom';
	(this as any)._def.customConfig = config;
	return this;
};

z.ZodType.prototype.formDescription = function (description: string) {
	(this as any)._def.formDescription = description;
	return this;
};

// Stepper Component
const Stepper = ({
	config,
	activeStep,
	onStepChange,
	values,
}: {
	config: StepperConfig;
	activeStep: number;
	onStepChange: (step: number) => void;
	values: any;
}) => {
	return (
		<div
			className={cx('flex', config.orientation === 'vertical' ? 'flex-col space-y-2' : 'space-x-4')}
		>
			{config.steps.map((step, index) => {
				const isValid = !step.validation || step.validation(values);
				const isComplete = index < activeStep && isValid;

				return (
					<div
						key={index}
						className={cx(
							'flex items-center gap-2 p-2 rounded-lg cursor-pointer',
							index === activeStep && 'bg-primary/10',
							isComplete && 'opacity-75',
						)}
						onClick={() => isValid && onStepChange(index)}
					>
						<div
							className={cx(
								'w-8 h-8 rounded-full flex items-center justify-center',
								index === activeStep ? 'bg-primary text-white' : 'bg-muted',
								isComplete && 'bg-green-500',
							)}
						>
							{isComplete ? '' : index + 1}
						</div>
						<div>
							<p className='font-medium'>{step.title}</p>
							{step.description && (
								<p className='text-sm text-muted-foreground'>{step.description}</p>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// Submit Button Component
const SubmitButton = ({ config }: { config?: SubmitConfig }) => {
	const {
		text = 'Submit',
		className,
		disabled = false,
		icon,
		position = 'center',
		width = 'auto',
	} = config || {};

	return (
		<div
			className={cx('flex', {
				'justify-start': position === 'left',
				'justify-center': position === 'center',
				'justify-end': position === 'right',
			})}
		>
			<Button
				type='submit'
				disabled={disabled}
				className={cx(width === 'full' ? 'w-full' : 'w-auto', 'flex items-center gap-2', className)}
			>
				{icon}
				{text}
			</Button>
		</div>
	);
};

type CustomComponents = {
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
};

type FormReturn = {
	Form: React.ComponentType<React.FormHTMLAttributes<HTMLFormElement>>;
	methods: ReturnType<typeof useForm>;
	formState: FormState;
};

// Add new types
type FormState = {
	isSubmitting: boolean;
	isSubmitted: boolean;
	submitCount: number;
	isDirty: boolean;
};

// Update config type
type FormBuilderConfig = {
	action?: FormAction;
	className?: string;
	debug?: boolean;
	layout?: FormLayout;
	components?: CustomComponents;
	props?: Record<string, any>;
	defaultValues?: Record<string, any>;
	transformValues?: (values: any) => any;
};

/**
 * form builder compoent
 * renders forms from zod schemas or form sections
 * adds extra validation to each form input fields
 *
 * needs support for calendars, popovers and textarea's
 *
 * Note to self: break this into sections and make it more modular
 */
export function createForm(
	schemaOrSections: z.ZodObject<any> | FormSection[],
	config?: FormBuilderConfig,
): FormReturn {
	const [formState, setFormState] = useState<FormState>({
		isSubmitting: false,
		isSubmitted: false,
		submitCount: 0,
		isDirty: false,
	});

	const methods = useForm<Record<string, any>>({
		resolver: zodResolver(
			Array.isArray(schemaOrSections)
				? z.object(
						schemaOrSections.reduce(
							(acc, section) => ({
								...acc,
								...section.schema.shape,
							}),
							{},
						),
					)
				: schemaOrSections,
		),
		defaultValues: config?.defaultValues,
	});

	function FormComponent(props: React.FormHTMLAttributes<HTMLFormElement>) {
		const [activeStep, setActiveStep] = useState(0);
		const sections: FormSection[] = Array.isArray(schemaOrSections)
			? schemaOrSections
			: [{ schema: schemaOrSections }];

		const form = methods;

		const handleSubmit = async (values: any) => {
			setFormState((prev) => ({
				...prev,
				isSubmitting: true,
				submitCount: prev.submitCount + 1,
			}));

			try {
				const transformedValues = config?.transformValues ? config.transformValues(values) : values;

				if (config?.action?.onSubmit) {
					await config.action.onSubmit(transformedValues);
				}

				setFormState((prev) => ({
					...prev,
					isSubmitting: false,
					isSubmitted: true,
				}));
			} catch (error) {
				setFormState((prev) => ({
					...prev,
					isSubmitting: false,
				}));
				config?.action?.onError?.(error);
			}
		};

		const renderField = (key: string, value: any, componentConfig?: ComponentConfig) => {
			const layoutConfig = config?.layout?.components?.[key];

			const finalConfig: ComponentConfig = {
				...componentConfig,
				...layoutConfig,
				containerClassName: cx(
					componentConfig?.containerClassName,
					layoutConfig?.containerClassName,
				),
				className: cx(componentConfig?.className, layoutConfig?.className),
			};

			return (
				<FormField
					key={key}
					control={methods.control}
					name={key}
					render={({ field, fieldState }) => (
						<FormItem className={finalConfig.containerClassName}>
							{value._def.label && <FormLabel>{value._def.label}</FormLabel>}
							<FormControl>{renderInput(value._def, field, finalConfig)}</FormControl>
							{value._def.formDescription && (
								<FormDescription>{value._def.formDescription}</FormDescription>
							)}
							{fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
						</FormItem>
					)}
				/>
			);
		};

		const renderInput = (def: any, field: any, config?: ComponentConfig) => {
			const CustomInputComponent = config?.component;
			if (CustomInputComponent) {
				return <CustomInputComponent {...field} className={config?.className} {...config?.props} />;
			}

			// Get the actual type definition, handling ZodDefault
			const actualDef = def.typeName === 'ZodDefault' ? def.innerType._def : def;
			const { typeName, label, placeholder } = actualDef;

			// Handle nested optional types
			const isOptional = typeName === 'ZodOptional';
			const finalDef = isOptional ? actualDef.innerType._def : actualDef;
			const finalTypeName = finalDef.typeName;

			// Safely check for inputType
			const inputType = finalDef.schema?.inputType;

			console.log(
				'Type:',
				typeName,
				'Final:',
				finalTypeName,
				'Label:',
				label,
				'InputType:',
				inputType ? inputType : 'none',
				finalDef.schema?._def.label,
			);

			const sharedProps = {
				required: !isOptional,
				name: field.name,
				id: field.name,
				defaultValue: def.defaultValue,
				...field,
			};

			// First check for specific input types
			if (inputType) {
				switch (inputType) {
					case 'checkbox':
						return (
							<div className={cx('flex items-center space-x-2', config?.containerClassName)}>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									id={field.name}
									className={config?.className}
									{...field}
								/>
								{finalDef.schema?._def.label && (
									<Label
										htmlFor={field.name}
										className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
									>
										{finalDef.schema?._def.label}
									</Label>
								)}
							</div>
						);
					case 'radio':
						return (
							<RadioGroup value={field.value} onValueChange={field.onChange}>
								{finalDef.options?.map((option: { label: string; value: string }) => (
									<div key={option.value} className='flex items-center space-x-2'>
										<RadioGroupItem value={option.value} id={option.value} />
										<Label htmlFor={option.value}>{option.label}</Label>
									</div>
								))}
							</RadioGroup>
						);
					// Add other input types here as needed
				}
			}

			// Then fall back to type checking if no specific input type
			if (finalTypeName === 'ZodEnum') {
				return (
					<div>
						{label && (
							<Label htmlFor={field.name} className='text-sm font-medium leading-none mb-2 block'>
								{label}
							</Label>
						)}
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger className={config?.className}>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
							<SelectContent>
								{finalDef.values?.map((option: { label: string; value: string }) => (
									<SelectItem key={option.value} value={option.value} className='cursor-pointer'>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				);
			}

			// Handle other types...
			switch (finalTypeName) {
				case 'ZodString':
					const isEmail = finalDef.checks?.some((check: any) => check.kind === 'email');
					return (
						<Input
							{...field}
							type={isEmail ? 'email' : 'text'}
							placeholder={placeholder}
							className={config?.className}
							{...config?.props}
						/>
					);

				case 'ZodPassword':
					return (
						<Input
							{...field}
							type='password'
							placeholder={placeholder}
							className={config?.className}
							{...config?.props}
						/>
					);

				default:
					return (
						<Input
							{...field}
							type='text'
							placeholder={placeholder}
							className={config?.className}
							{...config?.props}
						/>
					);
			}
		};

		const renderFormContent = () => {
			if (config?.layout?.type === 'stepper') {
				return (
					<div className='space-y-8'>
						<Stepper
							config={config.layout.stepperConfig!}
							activeStep={activeStep}
							onStepChange={setActiveStep}
							values={form.getValues()}
						/>
						<div className='mt-8'>
							{sections[activeStep] &&
								Object.entries(sections[activeStep].schema.shape).map(([key, value]) =>
									renderField(key, value, config.layout?.components?.[key]),
								)}
						</div>
					</div>
				);
			}

			if (config?.layout?.type === 'card') {
				return (
					<div className='p-6 rounded-lg border bg-card'>
						{sections.map((section) =>
							Object.entries(section.schema.shape).map(([key, value]) =>
								renderField(key, value, config.layout?.components?.[key]),
							),
						)}
					</div>
				);
			}

			return sections.map((section) =>
				Object.entries(section.schema.shape).map(([key, value]) =>
					renderField(key, value, config!.layout?.components?.[key]),
				),
			);
		};

		const FormWrapper = config?.components?.Form || Form;

		return (
			<FormProvider {...methods}>
				<FormWrapper {...config?.props}>
					<form
						onSubmit={methods.handleSubmit(handleSubmit)}
						className={cx('space-y-8', config?.className, props.className)}
						{...props}
					>
						{renderFormContent()}
						<SubmitButton config={sections[activeStep]?.submit} />

						{config?.debug && (
							<pre className='overflow-auto p-4 mt-4 rounded-lg bg-muted'>
								{JSON.stringify(methods.getValues(), null, 2)}
							</pre>
						)}
					</form>
				</FormWrapper>
			</FormProvider>
		);
	}

	return {
		Form: FormComponent,
		methods,
		formState,
	};
}
