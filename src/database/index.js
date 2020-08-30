import mongoose from 'mongoose';
import accountModel from '../models/accountModel.js';

const db = {};

db.url = process.env.MONGO_URL;
db.mongoose = mongoose;
db.account = accountModel(mongoose)

export { db };