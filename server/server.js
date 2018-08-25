const path = require('path');
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validations');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIo(server);
const users = new Users();

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    //console.log('Socket connection made: ' + socket.id);

    socket.on('join', (params, callback) => {
        //console.log('join', params);

        if(!isRealString(params.name) || !isRealString(params.room)) {
            callback('Invalid Name or Room');
        }

        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit('updateUserList', users.getUserList(params.room));

        // socket.leave(params.room);

        // io.emit -> to all connected socket
        // socket.broadcast.emit -> to all socket except himself
        // socket.emit -> to one socket

        // io.to('room').emit;
        // socket.broadcast.to('room') -> to all socket except himself

        socket.emit('newMessage', generateMessage('Admin', 'Welcome to chat app'));

        //socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined'));
        socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined`));

        callback();
    });

    socket.on('createMessage', (messageData, callback) => {
        //console.log('create message', messageData);

        var user = users.getUser(socket.id);

        if(user && isRealString(messageData.text)) {
            //io.emit('newMessage', generateMessage(messageData.from, messageData.text));
            //socket.broadcast.emit('newMessage', generateMessage(messageData.from, messageData.text));

            io.to(user.room).emit('newMessage', generateMessage(user.name, messageData.text));
        }

        if (typeof callback === 'function') {
            callback();
        }
    });

    socket.on('createLocationMessage', (locationData, callback) => {
        //console.log('create location message', locationData);

        var user = users.getUser(socket.id);

        if(user) {
            io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, locationData.latitude, locationData.longitude));
        }

        if (typeof callback === 'function') {
            callback();
        }
    });
    
    socket.on('disconnect', () => {
        //console.log('Socket connection closed');

        var user = users.removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('updateUserList', users.getUserList(user.room));
            io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left`));
        }
    });
});

server.listen(port, () => {
    console.log(`listening to request on port ${port}`);
});

