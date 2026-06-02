import express from 'express';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { User, Conversation } from '../models/index.js';

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['senha'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});


router.put('/profile', auth, upload.single('foto'), async (req, res) => {
  try {
    const { nome, apelido } = req.body;
    const updateData = { nome, apelido };

    if (req.file) {
      updateData.foto = `/uploads/profiles/${req.file.filename}`;
    }

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['senha'] }
    });

    res.json({ message: 'Perfil atualizado', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.get('/conversations', auth, async (req, res) => {
  try {
    const conversas = await Conversation.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'titulo', 'sessionId', 'updatedAt', 'mensagens']
    });
    
    const formatadas = conversas.map(c => {
      // Parse JSON if needed (though Sequelize does it)
      const msgs = Array.isArray(c.mensagens) ? c.mensagens : JSON.parse(c.mensagens || '[]');
      return {
        id: c.id,
        sessionId: c.sessionId,
        titulo: c.titulo,
        data: c.updatedAt,
        preview: msgs[0]?.content.slice(0, 100) || '...'
      };
    });

    res.json(formatadas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

export default router;