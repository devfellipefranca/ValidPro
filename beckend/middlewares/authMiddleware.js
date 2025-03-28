const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Header Authorization recebido:', authHeader);
    
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('Token não encontrado no header');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado com sucesso:', decoded);
      if (!allowedRoles.includes(decoded.role)) {
        console.log('Role não permitido. Roles esperados:', allowedRoles, 'Role do token:', decoded.role);
        return res.status(403).json({ error: 'Acesso negado' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Erro ao verificar token:', error.message);
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};

module.exports = authMiddleware;