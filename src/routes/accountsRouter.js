import express from 'express';

import accountsController from '../controllers/accountsController.js';

const app = express();
 
app.get('/', accountsController.getAll);
app.get('/one', accountsController.getOne);
app.get('/agencia/:agencia', accountsController.accountsByAgencia);
app.get('/agencias', accountsController.agencias);

app.get('/media/:agencia', accountsController.media);
app.get('/pobres/:qtd', accountsController.maisPobres);
app.get('/ricos/:qtd', accountsController.maisRicos);

app.post('/depositar', accountsController.depositar)
app.post('/sacar', accountsController.sacar)
app.post('/transferir', accountsController.transferir)

app.put('/privates', accountsController.transferirPrivates);

app.delete('/', accountsController.exluir);

export {app as accountsRouter};