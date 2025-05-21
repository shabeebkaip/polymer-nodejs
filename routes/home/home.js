import express from 'express'
import homeList from './api/list.js'

const homeRouter = express.Router()
homeRouter.use('/list', homeList)

export default homeRouter