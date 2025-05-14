import express from 'express'
import financeRequestRouter from './api/create.js'
import financeList from './api/list.js'

const financeRouter = express.Router()
financeRouter.use('/create', financeRequestRouter)
financeRouter.use('/list', financeList)


export default financeRouter