import express from 'express'
import createSample from './api/create.js'
import getUserSamples from './api/history.js'
import recivedRouter from './api/received.js'
import getAllSampleRequests from './api/list.js'
import updateSampleStatus from './api/status.update.js'

const sampleRouter = express.Router()
sampleRouter.use('/create', createSample)
sampleRouter.use('/history', getUserSamples)
sampleRouter.use('/received', recivedRouter)
sampleRouter.use('/list', getAllSampleRequests)
sampleRouter.use('/status', updateSampleStatus)


export default sampleRouter