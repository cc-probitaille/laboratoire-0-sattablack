import supertest from 'supertest';
import 'jest-extended';
import app from '../../src/app';
import { jeuRoutes } from "../../src/routes/jeuRouter";

const request = supertest(app);

const testNom1 = 'Jean-Marc';
const testNom2 = 'Pierre';

describe('GET /api/v1/jeu/redemarrerJeu', () => {

  // Avant tous les tests, créer deux joueurs pour respecter la précondition
  beforeAll(async () => {
    await request.post('/api/v1/jeu/demarrerJeu').send({ nom: testNom1 });
    await request.post('/api/v1/jeu/demarrerJeu').send({ nom: testNom2 });
  });

  it('devrait redémarrer le jeu et retourner status 200', async () => {
    const response = await request.get('/api/v1/jeu/redemarrerJeu');
    expect(response.status).toBe(200);
    expect(response.type).toBe("application/json");
    expect(response.body).toHaveProperty('message', 'Success');
  });

  it('devrait supprimer tous les joueurs après le redémarrage', async () => {
    const joueursJSON = jeuRoutes.controleurJeu.joueurs;
    const joueursArray = JSON.parse(joueursJSON);
    expect(joueursArray.length).toBe(0);
  });

    it('devrait retourner 404 si on essaie de jouer après redémarrage', async () => {
    const response = await request.get(`/api/v1/jeu/jouer/${testNom1}`);
    expect(response.status).toBe(404);
  });

});