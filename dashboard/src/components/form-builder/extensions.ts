import { z } from 'zod';
import type { CustomFieldConfig } from './types';

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
		text(): this;
		textarea(): this;
	}
}

// Implement Zod extensions
z.ZodType.prototype.label = function (label: string | React.ReactNode) {
	(this as any)._def.label = label;
	return this;
};

z.ZodType.prototype.text = function () {
	(this as any)._def.typeName = 'ZodText';
	(this as any).inputType = 'text';
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

	(this as any).inputType = 'textarea';
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
