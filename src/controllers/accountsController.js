import { db } from '../database/index.js';

const accountRepository = db.account;

const getAll = async (req, res) => {
  const accounts = await accountRepository.find();
  return res.json(accounts);
};

const getOne = async (req, res) => {
  try {
    const { agencia, conta } = req.query;
    const account = await accountRepository.findOne({ agencia, conta });
    if (!account) {
      throw new Error('Conta não localizada');
    }
    return res.json(account);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Erro ao buscar um conta: ${error.message}` });
  }
};

const depositar = async (req, res) => {
  try {
    const { agencia, conta, valor } = req.body;

    if (valor <= 0) {
      throw new Error('Valor do deposito não pode ser menor ou igual a ZERO');
    }

    const account = await accountRepository.findOne({ agencia, conta });
    if (!account) {
      throw new Error('Conta não localizada');
    }

    account.balance += valor;
    await accountRepository.updateOne({ agencia, conta }, account);

    return res.json(account);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Erro ao registrar um deposito: ${error.message}` });
  }
};

const sacar = async (req, res) => {
  try {
    const { agencia, conta, valor } = req.body;

    if (valor <= 0) {
      throw new Error('Valor do saque não pode ser menor ou igual a ZERO');
    }

    const valorTotalSaque = valor + parseInt(process.env.TARIFA);

    const account = await accountRepository.findOne({ agencia, conta });
    if (!account) {
      throw new Error('Conta não localizada');
    }

    if (account.balance - valorTotalSaque < 0) {
      throw new Error('Saldo insuficiente para realizar o saque');
    }

    account.balance -= valorTotalSaque;
    await accountRepository.updateOne({ agencia, conta }, account);

    return res.json(account);
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Erro ao registrar um saque: ${error.message}` });
  }
};

const exluir = async (req, res) => {
  try {
    const { agencia, conta } = req.body;

    const account = await accountRepository.findOne({ agencia, conta });
    if (!account) {
      throw new Error('Conta não localizada');
    }
    await accountRepository.deleteOne({ agencia, conta });

    const totalAccountsActive = await accountRepository.countDocuments({
      agencia,
    });

    return res.json({ total: totalAccountsActive });
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Erro ao excluir uma conta: ${error.message}` });
  }
};

const transferir = async (req, res) => {
  try {
    const { conta_origem, conta_destino, valor } = req.body;

    if (valor <= 0) {
      throw new Error(
        'Valor da transferência não pode ser menor ou igual a ZERO'
      );
    }
    if (conta_origem === conta_destino) {
      throw new Error('Conta de Origem e Destino não podem ser as mesmas');
    }

    const accountOrigem = await accountRepository.findOne({
      conta: conta_origem,
    });
    if (!accountOrigem) {
      throw new Error('Conta de origem não localizada');
    }
    const accountDestino = await accountRepository.findOne({
      conta: conta_destino,
    });
    if (!accountDestino) {
      throw new Error('Conta de destino não localizada');
    }

    let valorTransferencia = valor;
    if (accountOrigem.agencia !== accountDestino.agencia) {
      valorTransferencia += parseFloat(process.env.TARIFA_TRANSFERENCIA);
    }

    if (accountOrigem.balance - valorTransferencia < 0) {
      throw new Error('Saldo insuficiente para realizar a transferência');
    }

    accountOrigem.balance -= valorTransferencia;
    accountDestino.balance += valor;

    await accountRepository.updateOne({ conta: conta_origem }, accountOrigem);
    await accountRepository.updateOne({ conta: conta_destino }, accountDestino);

    return res.json({ accountOrigem });
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao transferir valor entre contas: ${error.message}`,
    });
  }
};

const media = async (req, res) => {
  try {
    const { agencia } = req.params;

    const balanceMedio = await accountRepository.aggregate([
      {
        $match: { agencia: parseInt(agencia) },
      },
      {
        $group: {
          _id: '$agencia',
          avg: { $avg: '$balance' },
        },
      },
    ]);

    return res.json({ balanceMedio });
  } catch (error) {
    return res.status(400).json({
      message: `Erro calcular média dos saldos: ${error.message}`,
    });
  }
};

const maisPobres = async (req, res) => {
  try {
    const { qtd } = req.params;

    const accounts = await accountRepository
      .find({}, ['agencia', 'conta', 'balance'])
      .sort({ balance: 1 })
      .limit(parseInt(qtd));

    return res.json(accounts);
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao calcular os menores saldos: ${error.message}`,
    });
  }
};

const maisRicos = async (req, res) => {
  try {
    const { qtd } = req.params;

    const accounts = await accountRepository
      .find({}, ['agencia', 'conta', 'name', 'balance'])
      .sort({ balance: -1 })
      .limit(parseInt(qtd));

    return res.json(accounts);
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao calcular os maiores saldos: ${error.message}`,
    });
  }
};

const transferirPrivates = async (req, res) => {
  try {
    const accountsGroupToPrivate = await accountRepository.aggregate([
      {
        $group: {
          _id: '$agencia',
          balance: { $max: '$balance' },
        },
      },
    ]);

    const accountsToPrivate = accountsGroupToPrivate.map(
      (item) => item.balance
    );

    await accountRepository.updateMany(
      { balance: { $in: accountsToPrivate } },
      { agencia: 99 }
    );

    const privates = await accountRepository.find({agencia: 99});

    return res.json(privates);
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao transferir clientes private: ${error.message}`,
    });
  }
};


const accountsByAgencia = async (req, res) => {
  try { 
    const { agencia } = req.params;
    const accounts = await accountRepository.find({agencia: parseInt(agencia)});

    return res.json(accounts);
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao consultar por agencia: ${error.message}`,
    });
  }
};

const agencias = async (req, res) => {
  try { 
    const agencias = await accountRepository.aggregate([
      {
        $group: {
          _id: '$agencia',
          clientes: { $sum: 1 },
        },
      },
    ]);

    return res.json(agencias);
  } catch (error) {
    return res.status(400).json({
      message: `Erro ao consultar agencias: ${error.message}`,
    });
  }
};

export default {
  getAll,
  getOne,
  depositar,
  sacar,
  exluir,
  transferir,
  media,
  maisPobres,
  maisRicos,
  transferirPrivates,
  accountsByAgencia,
  agencias
};
