import { mainPaths } from './main.js';
import { usersPaths } from './users.js';
import { sessionPaths } from './session.js';
import { statusesPaths } from './statuses.js';
import { tasksPaths } from './tasks.js';
import { labelsPaths } from './labels.js';

export default {
  ...usersPaths,
  ...sessionPaths,
  ...statusesPaths,
  ...tasksPaths,
  ...labelsPaths,
  ...mainPaths,
};
