Number.prototype.mod = function(n) {
  return ((this % n) + n) % n
}
$(document).ready(function() {
  var username = ''
  var current_picture = null
  var image_data = {}
  var message_data = {}
  const picture_ref = firebase.database().ref('pictures')
  const message_ref = firebase.database().ref('chat')
  const get_norm_picture_index = (picture_index) => (picture_index.mod(Object.keys(_.omit(image_data, 'background')).length)).toString()
  const get_norm_message_index = (message_index) => (message_index.mod(Object.keys(message_data['messages']).length)).toString()
  const set_background = () => {
    if (image_data && image_data['background']) {
      const background_url = image_data['background']
      $('body').css('background-image', `url(${background_url})`)
    }
  }
  const set_picture = (picture_index) => {
    $('.image-container').empty()
    if (image_data) {
      if (picture_index != null) {
        picture = image_data[get_norm_picture_index(picture_index)]
        $('.image-container').append(`<img src=\"${picture['location']}\">`)
        $('#vote-up p').text(picture['up'] || 0)
        $('#vote-down p').text(picture['down'] || 0)
        $('.info-modal .content').text(picture['info'] || 'No info on this image')
      } else {
        $('.image-container').append('<h1>Album Empty</h1>')
        $('.info-modal .content').text('Album Empty')
      }
    }
  }
  const add_message = (message_index) => {
    if (message_data) {
      message = message_data['messages'][get_norm_message_index(message_index)]
      $('.chat-modal .content').append(
  `<div class=\"message\">
    <div class=\"message-sender\">
      ${message['user']}
    </div>
    <div class=\"message-text\">
      ${message['message']}
    </div>
  </div>`)
    }
  }
  const add_all_messages = () => {
    $('.chat-modal .content').empty()
    const head = message_data['head']
    const messages = message_data['messages'] || {}
    const message_count = Object.keys(messages).length
    _.range(message_count).forEach((iterator) => {
      add_message(head + 1 + iterator)
    })
  }
  const upvote_picture = (picture_index) => {
    picture_ref
      .child(get_norm_picture_index(picture_index) + '/up')
      .transaction((current_up_votes) => (current_up_votes || 0) + 1)
  }
  const downvote_picture = (picture_index) => {
    picture_ref
      .child(get_norm_picture_index(picture_index) + '/down')
      .transaction((current_down_votes) => (current_down_votes || 0) + 1)
  }
  const send_message = (user, message) => {
    message_ref
      .transaction((current_messages) => {
        current_messages_safe = current_messages || {head: -1}
        const head = ((current_messages_safe['head'] == null ? -1 : current_messages_safe['head']) + 1) % 30
        const messages = Object.assign({}, current_messages_safe['messages'], _.object([[`${head}`, {message: message, user: user}]]))
        return {head: head, messages: messages}
      })
  }
  picture_ref.on('value', function(snapshot) {
    image_data = snapshot.val() || {}
    if(current_picture == null && Object.keys(_.omit(image_data, 'background')).length > 0) {
      current_picture = 0
    }
    set_picture(current_picture)
    set_background()
  })
  message_ref.on('value', function(snapshot) {
    message_data = snapshot.val() || {}
    add_all_messages()
  })
  $('#vote-up').click(function() {
    upvote_picture(current_picture)
  })
  $('#chat').click(function() {
    $('.modal-overlay').css('display', 'flex')
    $('.chat-modal').show()
  })
  $('#info').click(function() {
    $('.modal-overlay').css('display', 'flex')
    $('.info-modal').show()
  })
  $('#vote-down').click(function() {
    downvote_picture(current_picture)
  })
  $('.close, .modal-overlay').click(function() {
    $('.modal-overlay').hide()
    $('.modal').hide()
  })
  $('.left-pane').click(function() {
    set_picture(--current_picture)
  })
  $('.right-pane').click(function() {
    set_picture(++current_picture)
  })
  $('#signin').click(function() {
    username = $('#username').val()
    if (username) {
      $('.need-name').hide()
      $('.new-message').css('display', 'flex')
    }
  })
  $('#message-send').click(function() {
    const message = $('#message-text').val()
    if (username && message) {
      send_message(username, message)
      $('#message-text').val('')
    }
  })
})
