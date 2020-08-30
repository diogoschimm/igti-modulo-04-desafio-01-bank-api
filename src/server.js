import express from 'express';
import cors from 'cors';

import { db } from './database/index.js';
import { accountsRouter } from './routes/accountsRouter.js';

(async()=>{
  try {
    await db.mongoose.connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("Conectado com sucesso ao Mongo");
  } catch (err) {
    console.log(`Erro ao conectar no mongo ${err}`);
  }
})();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/accounts', accountsRouter);

app.listen(process.env.PORT, () => {
  console.log("⨁ API Started!!!");
})