import express from 'express';
import ExpressSession from 'express-session';
import logger from 'morgan';
import flash from 'express-flash-plus';

import { jeuRoutes } from './routes/jeuRouter';

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public expressApp: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.expressApp = express();
    this.middleware();
    this.routes();
    this.expressApp.set('view engine', 'pug');
    this.expressApp.use(express.static(__dirname + '/public') as express.RequestHandler); // https://expressjs.com/en/starter/static-files.html
  }

  // Configure Express middleware.
  private middleware(): void {
    this.expressApp.use(logger('dev') as express.RequestHandler);
    this.expressApp.use(express.json() as express.RequestHandler);
    this.expressApp.use(express.urlencoded({ extended: false }) as express.RequestHandler);
    this.expressApp.use(ExpressSession(
      {
        secret: 'My Secret Key',
        resave: false,
        saveUninitialized: true
      }));
    this.expressApp.use(flash());
  }

  // Configure API endpoints.
  private routes(): void {
    const titreBase = 'Jeu de dés';
    let router = express.Router();
    // Le squelette ne traite pas la gestion des connexions d'utilisateur, mais
    // les gabarits Pug (navbar) supportent l'affichage selon l'état de connexion 
    // dans l'objet user, qui peut avoir deux valeurs (p.ex. admin ou normal)
    let user;
    // Si l'utilisateur est connecté, le gabarit Pug peut afficher des options, 
    // le nom de l'utilisateur et une option pour se déconnecter.
    user = { nom: 'Pierre Trudeau', hasPrivileges: true, isAnonymous: false };
    // Si user.isAnonymous est vrai, le gabarit Pug affiche une option pour se connecter.
    // user = { isAnonymous: true }; // utilisateur quand personne n'est connecté

    // Route pour jouer (index)
    router.get('/', (req, res, next) => {
      res.render('index',
        // passer objet au gabarit (template) Pug
        {
          title: `${titreBase}`,
          user: user,
          joueurs: JSON.parse(jeuRoutes.controleurJeu.joueurs)
        });
    });

    // Route pour classement (stats)
    router.get('/stats', (req, res, next) => {
      try {
        // Récupérer les joueurs depuis le contrôleur
        const joueursRaw = JSON.parse(jeuRoutes.controleurJeu.joueurs);

       
        const joueurs = joueursRaw as Array<any>;

        // Ajouter la propriété ratio à chaque joueur
        const joueursAvecRatio = joueurs.map(joueur => ({
          ...joueur,
          ratio: joueur.lancers === 0 ? 0 : joueur.lancersGagnes / joueur.lancers
        }));

        // Trier par ratio décroissant
        joueursAvecRatio.sort((a, b) => b.ratio - a.ratio);

        // Passer le tableau au gabarit Pug
        res.render('stats', {
          title: `${titreBase}`,
          user: user,
          joueurs: joueursAvecRatio
        });
      } catch (error) {
        req.flash('error', error.message);
        res.status(500).json({ error: error.toString() });
      }
    });

    
    // Route to login
    router.get('/signout', async function (req, res) {
      // simuler une déconnexion
      user = { isAnonymous: true };
      return res.redirect('/');
    });

    
    // Route pour se connecter
    router.get('/signin', (req, res) => {
      if (user && user.isAnonymous === false) {
        // déjà connecté → redirection vers la page principale
        return res.redirect('/');
      } else {
        // pas connecté → afficher signin.pug
        return res.status(200).render('signin', {
          title: `${titreBase} - Connexion`,
          user: user
        });
      }
     });


    this.expressApp.use('/', router);  // routage de base

    this.expressApp.use('/api/v1/jeu', jeuRoutes.router);  // tous les URI pour le scénario jeu (DSS) commencent ainsi
  }

}

export default new App().expressApp;
