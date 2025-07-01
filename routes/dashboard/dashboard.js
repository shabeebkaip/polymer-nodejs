import express from 'express'
import dashboardList from './api/dashboard.list.js'

const dashboardRouter = express.Router()
dashboardRouter.use('/list', dashboardList)

export default dashboardRouter