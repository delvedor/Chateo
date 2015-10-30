import ipc from 'ipc'

;(() => {
  angular.module('Chateo')
    .controller('appController', ($scope, $mdSidenav, $location, $timeout, $routeParams, $mdToast) => {
      $scope._ = {
        userLogged: false,
        username: null,
        fontSize: '1.0em',
        color: '#000000',
        messages: {
          'chat': []
        },
        connectedUsers: [],
        openWebsite: () => {
          require('shell').openExternal('http://www.entract.it/')
        }
      }

      if (!$scope._.userLogged) $location.path('/')

      $scope.toggleSidenav = (menuId) => {
        $mdSidenav(menuId).toggle()
      }

      $scope.logout = () => {
        $scope._.userLogged = false
        $location.path('/')
      }

      $scope.settings = () => {
        $location.path('/settings')
      }

      $scope.info = () => {
        $location.path('/info')
      }

      $scope.openChat = (chatName) => {
        $location.path(`/chat/${chatName}`)
      }

      ipc.on('connectedUsers', (connectedUsers) => {
        $timeout(() => {
          $scope._.connectedUsers = connectedUsers
          $scope.$apply()
        })
      })

      ipc.on('userLogin', (user) => {
        $timeout(() => {
          let date = new Date()
          $scope._.messages.chat.push({user: 'chateoserver', text: `${date.getHours()}.${date.getMinutes()}: ${user} connected`})
          $scope.$apply()
        })
      })

      ipc.on('userLogout', (user) => {
        $timeout(() => {
          let date = new Date()
          $scope._.messages.chat.push({user: 'chateoserver', text: `${date.getHours()}.${date.getMinutes()}: ${user} disconnected`})
          $scope.$apply()
        })
      })

      ipc.on('newMessage', (msg) => {
        $timeout(() => {
          let element = null
          if (!$scope._.connectedUsers[msg.content.user]) ipc.send('getConnectedUsers')
          if (msg.type === 'message') {
            $scope._.messages.chat.push(msg.content)
            // if ($scope._.messages.chat.length > 1000) $scope._.messages.chat.shift() // keeps in the UI only the last 1000 messages
            if ($routeParams.chat !== 'chat') element = document.getElementById('chat')
          } else if (msg.type === 'privateMessage') {
            if (!$scope._.messages[msg.content.user]) $scope._.messages[msg.content.user] = []
            $scope._.messages[msg.content.user].push(msg.content)
            if ($routeParams.chat !== msg.content.user) element = document.getElementById(msg.content.user)
          }
          if (element) {
            element.style.display = 'inline-block'
            if (element.textContent === '99' || element.textContent === '99+') {
              element.textContent = '99+'
            } else {
              element.textContent = Number(element.textContent) + 1
            }
          }
          $scope.$apply()
        })
      })

      $scope.$on('$routeChangeSuccess', function (next, current, previous) {
        if (previous && previous.loadedTemplateUrl === 'templates/login.html') ipc.send('getConnectedUsers')
        let ele = document.getElementsByClassName('chatList')
        for (let i = 0, len = ele.length; i < len; i++) ele[i].classList.remove('activeBackground')
        if (current.params.chat) {
          document.getElementById(`list-${current.params.chat}`).classList.add('activeBackground')
          ele = document.getElementById(current.params.chat)
          if (ele.style.display !== 'none') {
            ele.textContent = 0
            ele.style.display = 'none'
          }
        }
      })
    })

    .controller('loginController', ($scope, $location, $mdToast) => {
      $scope.login = (username) => {
        if (!username) return
        ipc.send('sendNewUser', username)
        ipc.on('userAvailable', (bool) => {
          if (bool) {
            $scope._.username = username
            $scope._.userLogged = true
            $location.path('/chat/chat')
          } else {
            $mdToast.show(
              $mdToast.simple()
                .content('Username not available.')
                .hideDelay(3000)
            )
          }
        })
      }
    })

    .controller('settingsController', ($scope) => {
      $scope.fontsize = '1.0'

      $scope.changeFontSize = (fontSize) => {
        $scope._.fontSize = `${fontSize}em`
      }

      $scope.changeColor = (color) => {
        $scope._.color = color
      }
    })

    .controller('chatController', ($scope, $location, $timeout, $routeParams) => {
      $scope.param = $routeParams.chat
      $scope.getFirstLetter = (username) => {
        return username.charAt(0)
      }

      $scope.sendMessage = (keyEvent) => {
        $timeout(() => {
          if (keyEvent.which === 13) {
            let time = new Date().getTime()
            if ($scope.param === 'chat') {
              ipc.send('sendMessage', {user: $scope._.username, time: time, text: $scope.chatMessage, color: $scope._.color})
              $scope._.messages.chat.push({user: $scope._.username, time: time, text: $scope.chatMessage, color: $scope._.color})
            } else {
              if (!$scope._.messages[$scope.param]) $scope._.messages[$scope.param] = []
              ipc.send('sendMessage', {user: $scope._.username, time: time, text: $scope.chatMessage, recipient: $scope.param, color: $scope._.color})
              $scope._.messages[$scope.param].push({user: $scope._.username, time: time, text: $scope.chatMessage, recipient: $scope.param, color: $scope._.color})
            }
            $scope.$apply()
            $scope.chatMessage = ''
          }
        })
      }
    })

    .controller('infoController', ($scope) => {
      ipc.send('getVersion')
      ipc.on('setVersion', (v) => {
        document.getElementById('versionNumber').textContent = `delvedor v${v.version.major}.${v.version.minor}.${v.version.patch} - ${v.status}`
        document.getElementById('buildNumber').textContent = `build ${v.build.total} - ${v.build.date}`
        document.getElementById('commitNumber').textContent = `commit ${v.commit}`
      })
    })
})()
