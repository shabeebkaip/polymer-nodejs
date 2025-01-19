import express from 'express'
import fileUpload from './api/file.upload.js'
import removeFile from './api/remove.file.js'




const fileRouter = express.Router()

fileRouter.use('/upload', fileUpload)
fileRouter.use('/remove',removeFile)




export default fileRouter