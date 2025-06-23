export const mainPaths = {
  main: () => '/',
};

export default (app) => {
  app.get(mainPaths.main(), (_, res) => res.render('main.pug'));
};
