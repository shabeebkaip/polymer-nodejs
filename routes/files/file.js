import express from 'express'
import fileUpload from './api/file.upload.js'
import removeFile from './api/remove.file.js'
import uploadSignature from './api/upload.signature.js'


const fileRouter = express.Router()

fileRouter.use('/upload', fileUpload)
fileRouter.use('/remove',removeFile)
fileRouter.use('/upload-signature', uploadSignature)




export default fileRouter