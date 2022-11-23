const Room = require('../models/Room.model')

const isNotOwner = (req, res, next) => {
    Room.findById(req.params.id)
    .then((foundRoom) => {
        if(String(foundRoom.owner) !== req.session.user._id) {
            next()
        } else {
            res.render('list-rooms', {message: "You do not have permission"})
        }
    }) 
    .catch((err) => {
        console.log(err)
    })
}
    
    module.exports = isNotOwner