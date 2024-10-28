import { nanoid } from 'nanoid';

// Function to generate readable project IDs
const generateProjectId = () => {
  const prefix = 'prj';
  const randomString = nanoid(8);
  return `${prefix}_${randomString}`;
};

// Function to generate API key
const generateApiKey = () => {
  return `sonar_${nanoid(16)}`;
};

export { generateProjectId, generateApiKey };
