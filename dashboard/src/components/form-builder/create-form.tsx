import './extensions';

import {
	Form as UIForm,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~ui/form';
import { Input } from '~ui/input';
import { Button } from '~ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~ui/select';
import { Checkbox } from '~ui/checkbox';
import { RadioGroup, RadioGroupItem } from '~ui/radio-group';
import { Label } from '~ui/label';
import { Textarea } from '~ui/textarea';

import { cx } from '~utils';
import React, { useMemo } from 'react';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormSection, FormBuilderConfig, FormReturn, ComponentConfig } from './types';

export function createForm(
	schemaOrSections: z.ZodObject<any> | FormSection[],
	config?: FormBuilderConfig,
): FormReturn {

	const sections: FormSection[] = Array.isArray(schemaOrSections)
		? schemaOrSections
		: [{ schema: schemaOrSections }];

	const mergedSchema = useMemo(() => {

		return z.object(
			sections.reduce((acc, section) => ({
				...acc,
				...(section.schema.shape || {}),
			}), {})
		);
	}, [schemaOrSections]);

	const methods = useForm<Record<string, any>>({
		resolver: zodResolver(mergedSchema),
		defaultValues: config?.defaultValues,
	});

	const formState = {
		isSubmitting: methods.formState.isSubmitting,
		isSubmitted: methods.formState.isSubmitted,
		submitCount: methods.formState.submitCount,
		isDirty: methods.formState.isDirty,
	};

	function FormComponent(props: React.FormHTMLAttributes<HTMLFormElement>) {
		const handleSubmit = async (values: any) => {
			formState.isSubmitting = true;
			formState.submitCount = formState.submitCount + 1;

			try {
				const transformedValues = config?.transformValues ? config.transformValues(values) : values;

				if (config?.action?.onSubmit) {
					await config.action.onSubmit(transformedValues);
				}

				formState.isSubmitting = false;
				formState.isSubmitted = true;

				if (config?.action?.afterSubmit) {
					await config?.action?.afterSubmit(transformedValues);
				}
			} catch (error) {
				formState.isSubmitting = false;
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
							<FormControl>
								{renderInput(value._def, field, finalConfig)}
							</FormControl>
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
			if (config?.component) {
				const CustomComponent = config.component;
				return (
					<CustomComponent
						{...field}
						className={config?.className}
						placeholder={def.placeholder}
						{...config?.props}
					/>
				);
			}

			const actualDef = def.typeName === 'ZodDefault' ? def.innerType._def : def;
			const { typeName, label, placeholder } = actualDef;

			const isOptional = typeName === 'ZodOptional';
			const finalDef = isOptional ? actualDef.innerType._def : actualDef;
			const finalTypeName = finalDef.typeName;
			const inputType = finalDef.schema?.inputType;

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
									<Label htmlFor={field.name}>
										{finalDef.schema?._def.label || label}
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
				}
			}

			if (finalTypeName === 'ZodEnum') {
				return (
					<Select value={field.value} onValueChange={field.onChange}>
						<SelectTrigger className={config?.className}>
							<SelectValue placeholder={placeholder} />
						</SelectTrigger>
						<SelectContent>
							{finalDef.values?.map((option: { label: string; value: string }) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			}

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

				case "ZodTextarea":
					return (
						<Textarea
							{...field}
							placeholder={placeholder}
							className={config?.className}
							{...config?.props}
						/>
					)

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
			return sections.flatMap((section) =>
				Object.entries(section.schema.shape || {}).map(([key, value]) =>
					renderField(key, value, config?.layout?.components?.[key])
				)
			);
		};

		const renderSubmitButton = () => {
			if (config?.submit?.component) {
				const SubmitComponent = config.submit.component;
				return <SubmitComponent formState={formState} />;
			}

			return (
				<Button type='submit' disabled={formState.isSubmitting}>
					{formState.isSubmitting ? 'Submitting...' : 'Submit'}
				</Button>
			);
		};

		const FormWrapper = config?.components?.Form || UIForm;

		return (
			<FormProvider {...methods}>
				<FormWrapper {...config?.props}>
					<form
						onSubmit={methods.handleSubmit(handleSubmit)}
						className={cx('space-y-8', config?.className, props.className)}
						{...props}
					>
						{renderFormContent()}
						{renderSubmitButton()}

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
