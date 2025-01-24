import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: 'Authentication token is missing' });
        }
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.body.email = decoded.id
        next()
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
}