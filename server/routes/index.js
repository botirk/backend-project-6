import usersRoute from './users.js';
import sessionRoute from './session.js';
import statusesRoute from './statuses.js';
import tasksRoute from './tasks.js';
import labelsRoute from './labels.js';
import mainRoute from './main.js';

export default (app) => {
  mainRoute(app);
  usersRoute(app);
  sessionRoute(app);
  statusesRoute(app);
  tasksRoute(app);
  labelsRoute(app);
};
