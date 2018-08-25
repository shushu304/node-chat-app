var socket = io();

var messages = jQuery('#messages');
var messageForm = jQuery('#message-form');
var messageInput = messageForm.find('input[name=message]');
var locationButton = jQuery('#send-location');

function scroolToBottom() {
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');

    var newMessage = messages.children('li:last');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if((clientHeight + scrollTop + newMessageHeight + lastMessageHeight) >= scrollHeight) {
        messages.scrollTop(scrollHeight);
    }
}

socket.on('connect', function() {
    console.log('Connected to server');

    /*socket.emit('createMessage', {
        from: 'Frank',
        text: 'Hi there'
    }, function(resoonse) {
        console.log(resoonse);
    });*/

    var params = jQuery.deparam(window.location.serach);

    socket.emit('join', params, function(err) {
        if(err) {
            alert(err);
            window.location.href = '/';
        }
        else {
            console.log('Join success');
        }
    });
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
});

socket.on('updateUserList', function(users) {
    var ol = jQuery('<ol/>');

    users.forEach(function(user) {
        ol.append(jQuery('<li/>').text(user))
    });

    jQuery('#users').html('').append(ol);

});

socket.on('newMessage', function(messageData) {
    //console.log('new message', messageData);
    var formattedTime = moment(messageData.createdAt).format('HH:mm');

    //var li = jQuery('<li/>').text(`${messageData.from} ${formattedTime}: ${messageData.text}`);
    //messages.append(li);

    var template = jQuery('#message-template').html();
    var html = Mustache.render(template, {
        from: messageData.from,
        createdAtFormatted: formattedTime,
        text: messageData.text,
    });

    messages.append(html);
    scroolToBottom();
});

socket.on('newLocationMessage', function(messageData) {
    //console.log('new location message', messageData);
    var formattedTime = moment(messageData.createdAt).format('HH:mm');

    /*var a = jQuery('<a/>')
        .text('My Current Location')
        .attr('href', messageData.url)
        .attr('target', '_blank');

    var li = jQuery('<li/>').text(`${messageData.from} ${formattedTime}: `);
    li.append(a);
    messages.append(li);
    */

    var template = jQuery('#location-message-template').html();
    var html = Mustache.render(template, {
        from: messageData.from,
        createdAtFormatted: formattedTime,
        url: messageData.url,
    });

    messages.append(html);
    scroolToBottom();
});

// ---------------

messageForm.on('submit', function(e) {
    e.preventDefault();

    var message = messageInput.val();

    if(message.trim() === '') {
        return;
    }

    socket.emit('createMessage', {
        text: message
    }, function(response) {
        //console.log(response);

        messageInput.val('');
    });
});

// --------------

locationButton.on('click', function(e) {
    e.preventDefault();

    if (!"geolocation" in navigator) {
        alert('Geolocation not supported by your browser');
        return;
    }

    locationButton.attr('disabled', 'disabled').text('Sending Location...');

    navigator.geolocation.getCurrentPosition(function(position) {
        //console.log(position);

        socket.emit('createLocationMessage', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, function() {
            locationButton.removeAttr('disabled').text('Send Location');
        });
    }, function(error) {
        //console.log(error);
        alert('Unable to fetch location.');
        locationButton.removeAttr('disabled').text('Send Location');
    });
});