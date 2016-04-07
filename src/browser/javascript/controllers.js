import { ipcRenderer } from 'electron'

;(() => {
  angular.module('Chateo') // eslint-disable-line
    .controller('appController', ($scope, $mdSidenav, $location, $timeout, $routeParams, $mdToast) => {
      $scope._ = {
        userLogged: false,
        username: null,
        fontSize: '1.0em',
        color: '#000000',
        messages: {
          'chat': []
        },
        notification: '0',
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

      $scope.isOnline = (user) => {
        if (user === 'chat') return false
        for (let i = 0, len = $scope._.connectedUsers.length; i < len; i++) {
          if ($scope._.connectedUsers[i].user === user) return !$scope._.connectedUsers[i].online
        }
      }

      let checkConnectedUsers = (user) => {
        for (let i = 0, len = $scope._.connectedUsers.length; i < len; i++) {
          if ($scope._.connectedUsers[i].user === user) return true
        }
        return false
      }

      let setOnline = (user, online) => {
        for (let i = 0, len = $scope._.connectedUsers.length; i < len; i++) {
          if ($scope._.connectedUsers[i].user === user) $scope._.connectedUsers[i].online = online
        }
      }

      let getIndex = (user) => {
        for (let i = 0, len = $scope._.connectedUsers.length; i < len; i++) {
          if ($scope._.connectedUsers[i].user === user) return i
        }
      }

      let moveToTop = (pos) => {
        $timeout(() => {
          let swap = $scope._.connectedUsers[pos]
          $scope._.connectedUsers.splice(pos, 1)
          $scope._.connectedUsers.unshift(swap)
          $scope.$apply()
        })
      }

      let addNotification = (user) => {
        $timeout(() => {
          if (user === 'chat') {
            if ($scope._.notification === '99' || $scope._.notification === '99+') {
              $scope._.notification = '99+'
            } else {
              $scope._.notification = `${Number($scope._.notification) + 1}`
            }
          } else {
            let index = getIndex(user)
            let notification = $scope._.connectedUsers[index].notification
            if (notification === '99' || notification === '99+') {
              notification = '99+'
            } else {
              notification = `${Number(notification) + 1}`
            }
            $scope._.connectedUsers[index].notification = notification
          }
          $scope.$apply()
        })
      }

      let removeNotification = (user) => {
        $timeout(() => {
          let index = getIndex(user)
          $scope._.connectedUsers[index].notification = '0'
          $scope.$apply()
        })
      }

      ipcRenderer.on('connectedUsers', (event, connectedUsers) => {
        $timeout(() => {
          // let bool
          for (let i = 0; i < connectedUsers.length; i++) {
            if (!checkConnectedUsers(connectedUsers[i].user)) $scope._.connectedUsers.push(connectedUsers[i])
          }
          $scope.$apply()
        })
      })

      ipcRenderer.on('userLogin', (event, user) => {
        $timeout(() => {
          if (checkConnectedUsers(user)) {
            setOnline(user, true)
          } else {
            $scope._.connectedUsers.push({user: user, online: true, notification: '0'})
          }
          $scope._.messages.chat.push({user: 'chateoserver', text: `${user} connected`})
          $scope.$apply()
        })
      })

      ipcRenderer.on('userLogout', (event, user) => {
        $timeout(() => {
          setOnline(user, false)
          $scope._.messages.chat.push({user: 'chateoserver', text: `${user} disconnected`})
          $scope.$apply()
        })
      })

      ipcRenderer.on('newMessage', (event, msg) => {
        $timeout(() => {
          // let element = null
          if (!checkConnectedUsers(msg.content.user)) ipcRenderer.send('getConnectedUsers')
          if (msg.type === 'message') {
            $scope._.messages.chat.push(msg.content)
            if ($routeParams.chat !== 'chat') addNotification('chat')
          // if ($scope._.messages.chat.length > 1000) $scope._.messages.chat.shift() // keeps in the UI only the last 1000 messages
          } else if (msg.type === 'privateMessage') {
            if (!$scope._.messages[msg.content.user]) $scope._.messages[msg.content.user] = []
            $scope._.messages[msg.content.user].push(msg.content)
            if ($routeParams.chat !== msg.content.user) {
              moveToTop(getIndex(msg.content.user))
              addNotification(msg.content.user)
            }
          }
          $scope.$apply()
        })
      })

      $scope.$on('$routeChangeSuccess', function (next, current, previous) {
        if (previous && previous.loadedTemplateUrl === 'templates/login.html') ipcRenderer.send('getConnectedUsers')
        let ele = document.getElementsByClassName('chatList')
        for (let i = 0, len = ele.length; i < len; i++) ele[i].classList.remove('activeBackground')
        if (current.params.chat) {
          $timeout(() => {
            document.getElementById('textarea').focus()
          })
          document.getElementById(`list-${current.params.chat}`).classList.add('activeBackground')
          ele = document.getElementById(current.params.chat)
          if (ele && current.params.chat === 'chat') {
            if (ele.style.display !== 'none') {
              ele.textContent = 0
              ele.style.display = 'none'
            }
          } else if (current.params.chat !== 'chat') {
            removeNotification(current.params.chat)
          }
        }
      })
    })

    .controller('loginController', ($scope, $location, $mdToast) => {
      ipcRenderer.send('pastUser')

      ipcRenderer.on('pastUser', function (event, user) {
        console.log(user)
        if (user && user !== 'null') {
          document.getElementById('userLogin').value = user
          document.getElementById('userLogin').focus()
        }
      })
      $scope.login = () => {
        let username = document.getElementById('userLogin').value
        console.log(username)
        if (!username) return
        username = username.trim()
        ipcRenderer.send('sendNewUser', username)
        ipcRenderer.on('userAvailable', (event, bool) => {
          if (bool) {
            $scope._.username = username
            $scope._.userLogged = true
            $location.path('/chat/chat')
            $scope.$apply()
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
              ipcRenderer.send('sendMessage', {user: $scope._.username, time: time, text: $scope.chatMessage, color: $scope._.color})
              $scope._.messages.chat.push({user: $scope._.username, time: time, text: $scope.chatMessage, color: $scope._.color})
            } else {
              if (!$scope._.messages[$scope.param]) $scope._.messages[$scope.param] = []
              ipcRenderer.send('sendMessage', {user: $scope._.username, time: time, text: $scope.chatMessage, recipient: $scope.param, color: $scope._.color})
              $scope._.messages[$scope.param].push({user: $scope._.username, time: time, text: $scope.chatMessage, recipient: $scope.param, color: $scope._.color})
            }
            $scope.$apply()
            $scope.chatMessage = ''
          }
        })
      }
    })

    .controller('infoController', ($scope) => {
      ipcRenderer.send('getVersion')
      ipcRenderer.on('setVersion', (event, v) => {
        document.getElementById('versionNumber').textContent = `delvedor v${v.version.major}.${v.version.minor}.${v.version.patch} - ${v.status}`
        document.getElementById('buildNumber').textContent = `build ${v.build.total} - ${v.build.date}`
        document.getElementById('commitNumber').textContent = `commit ${v.commit}`
      })
    })
})()
