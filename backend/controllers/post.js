const Post = require('../models/postSchema');
const User = require('../models/userSchema');
const Comment = require('../models/commentSchema');
const fs = require('fs');

//Création d'un nouveau post en tenant compte de l'utilisateur connecté

exports.newPost = (req, res, next) => {
    if (req.file === undefined){ //Création sans image
        const post = {
            title: req.body.title,
            content: req.body.content,
            UserId: req.token.userId
        };
        Post.create(post)
            .then(() => res.status(201).json({ message: 'Post créé !' }))
            .catch(error => res.status(401).json({ error, message: error.message }));
    } else if (req.body.title && req.body.content && req.file){ //Création avec image
        const post = {
            title: req.body.title,
            content: req.body.content,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
            UserId: req.token.userId
        };
        Post.create(post)
        .then(() => res.status(201).json({ message: 'Post créé !' }))
        .catch(error => res.status(401).json({ error, message: error.message }));
    } else {
        return res.status(401).json({message : "Un champ ne peut être vide"});
    }
};

//Mise à jour du post par son auteur ou l'utilisateur adminisrateur

exports.updatePost = (req, res, next) => {
    if (req.file === undefined) { //Mise à jour sans image
        Post.findOne({ where: { id: req.params.id } })
            .then(post => {
                if (post.UserId === req.token.userId || post.isAdmin === req.token.isAdmin ) {
                    Post.update({...post, title: req.body.title, content: req.body.content}, { where: { id: req.params.id }})
                        .then(() => res.status(201).json({ message: 'Post modifié !' }))
                        .catch(error => res.status(400).json({ error, message: error.message }));
                } else {
                    res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce post !' });
                }
            })
            .catch(error => res.status(500).json({ error, message: error.message }));
    } else { //Mise à jour avec image
        const postImage = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        Post.findOne({ where: { id: req.params.id } })
        .then(post => {
            if (post.UserId === req.token.userId || post.isAdmin === req.token.isAdmin ) {
                Post.update({...post, title: req.body.title, content: req.body.content, imageUrl: postImage}, { where: { id: req.params.id }})
                    .then(() => res.status(200).json({ message: 'Post modifié !' }))
                    .catch(error => res.status(400).json({ error, message: error.message }));
            } else {
                res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce post !' });
            }
        })
    .catch(error => res.status(500).json({ error, message: error.message }));
    }    
};

//Suppression d'un post par son auteur ou l'utilisateur adminisrateur

exports.deletePost = (req, res, next) => {
    Post.findOne({ where: { id: req.params.id } })
        .then(post => {
            if (post.UserId === req.token.userId  || req.token.isAdmin) {
                if (post.imageUrl === null) { //Suppression du post sans image
                    Post.destroy({ where: { id: req.params.id } })
                        .then(() => res.status(201).json({ message: 'Post supprimé !' }))
                        .catch(error => res.status(400).json({ error, message: error.message }));
                } else { //Suppression du post avec image
                    const filename = post.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`, () =>
                    Post.destroy({ where: { id: req.params.id } })
                        .then(() => res.status(200).json({ message: 'Post supprimé !' }))
                        .catch(error => res.status(400).json({ error, message: error.message }))
                    );
                }
            } else {
                res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce post !' });
            }
        })
        .catch(error => res.status(500).json({ error, message: error.message }));
};

//Recupération de tout les posts de tous les utilisateurs

exports.getAllPosts = (req, res, next) => {
    Post.findAll({
        order: [['createdAt', 'DESC']],
        include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
        },]
    })
    .then(posts => { res.status(200).json(posts); })
    .catch(error => res.status(500).json({ error, message: error.message }));
};

//Récupération d'un seul post

exports.getOnePost = (req, res, next) => {
    Post.findOne({
        where: {
            id: req.params.id
        },
        include: [{
            model: User,
            attributes: ['id', 'firstName', 'lastName']
        },]
    })
        .then(post => { res.status(200).json(post)})
        .catch(error => res.status(500).json({ error, message: error.message }));
};